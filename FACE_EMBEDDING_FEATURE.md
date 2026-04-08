# Face Embedding Feature Documentation

## Overview

The face embedding feature allows users to generate a unique facial embedding (128-point descriptor) that can be used for identity verification at events. Users can capture their face through their camera, and the system will extract facial landmarks and create a mathematical representation of their face that's stored securely.

## Features

- **Real-time Face Detection**: Uses @vladmandic/face-api to detect faces in real-time
- **Facial Landmark Visualization**: Displays detected landmarks (eyes, nose, mouth, ears) with green overlays
- **128-Point Embeddings**: Generates a 128-dimensional facial embedding vector
- **Confidence Scoring**: Shows detection confidence percentage
- **Secure Storage**: Embeddings are stored in Firestore under event attendees
- **User Verification**: Only the ticket owner can generate embeddings for their ticket

## File Structure

### Components

1. **`src/components/FaceMarker.tsx`**
   - Main component for face detection and landmark visualization
   - Handles camera access and requestAnimationFrame for real-time processing
   - Displays facial landmarks (eyes, nose, mouth, ears, jaw outline)
   - Manages embedding capture and auto-completion at high confidence

2. **`src/components/FaceEmbeddingModal.tsx`**
   - Modal wrapper for the face embedding feature
   - Displays instructions and user guidance
   - Handles the embedding save process
   - Shows success/error states with appropriate messages

### API Endpoints

**`POST /api/v1/ticket/[ticketId]/embedding`**
- Saves the facial embedding to Firestore
- Stores data at `events/{eventId}/attendees/{ticketId}`
- Also stores embedding in the ticket document for quick access
- Requires authentication
- Validates:
  - User is logged in (JWT token)
  - Ticket exists and belongs to the user (email match)
  - Event exists
  - Embedding is valid (128-point array)

### Database Schema

**Location**: `events/{eventId}/attendees/{ticketId}`
```javascript
{
  faceEmbedding: Float32Array[128],  // 128-dimensional face descriptor
  email: string,                       // User's email
  updatedAt: Timestamp                 // Server timestamp of last update
}
```

**Also updated**: `tickets/{ticketId}`
```javascript
{
  faceEmbedding: Float32Array[128],   // Same embedding
  faceEmbeddingUpdatedAt: Timestamp   // Last update time
}
```

## How It Works

### User Flow

1. User navigates to ticket details page
2. Clicks "Generate Face ID" button
3. Modal opens with instructions
4. User allows camera access
5. FaceMarker component loads face-api models
6. Real-time face detection begins
7. Green overlays show detected landmarks:
   - Both eyes (with points)
   - Nose (with points)
   - Mouth (with points)
   - Ears (approximate at jaw outline edges)
   - Jaw outline (connecting line)
8. Once face is detected with >80% confidence, embeddings auto-complete
9. User can manually click "Confirm & Save Embedding" or wait for auto-completion
10. System sends embedding to API endpoint
11. API validates and stores in Firestore
12. Success message displayed, modal closes
13. Embedding now available in `events/{eventId}/attendees/{ticketId}`

### Technical Details

**Face Detection Process**:
- Uses `faceapi.detectAllFaces()` with landmarks and recognition models
- Returns detection score and 128-dimensional descriptor
- Processes on requestAnimationFrame for smooth rendering (~60fps)
- Stops when user closes modal or window loses focus

**Landmark Drawing**:
- Eyes: Both left and right eye points
- Nose: Nose outline points
- Mouth: Mouth points
- Ears: Approximated at jaw outline edges
- Face Outline: Jaw outline connected with lines

**Embedding Storage**:
- Both the attendee document and ticket document store the embedding
- Uses Firestore's merge option to preserve other data
- Server timestamp ensures accurate tracking

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```
The `@vladmandic/face-api` package is already in package.json.

### 2. Download Model Files
See `FACE_API_SETUP.md` for detailed instructions. Models need to be in `public/models/`:

Required files:
- `face_detection_model-weights_manifest.json`
- `face_detection_model.weights.bin`
- `face_landmarks_model-weights_manifest.json`
- `face_landmarks_model.weights.bin`
- `face_recognition_model-weights_manifest.json`
- `face_recognition_model.weights.bin`
- `face_expression_model-weights_manifest.json`
- `face_expression_model.weights.bin`

### 3. Environment Variables
Ensure your Firebase configuration is set:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### 4. Test the Feature
1. Login to your account
2. Go to any ticket
3. Click "Generate Face ID"
4. Allow camera access
5. Position your face in the frame
6. Confirm when embeddings are captured

## Security Considerations

1. **Authentication**: All API calls require valid JWT token
2. **Authorization**: Users can only generate embeddings for their own tickets
3. **Camera Access**: Requires explicit user permission via browser
4. **Data Validation**: Server validates embedding data format and size
5. **HTTPS Only**: Should be deployed with HTTPS to ensure secure camera access

## Error Handling

The system handles various error scenarios:

| Error | Cause | User Message |
|-------|-------|--------------|
| Models fail to load | Network/file issue | "Failed to load face detection models. Please refresh and try again." |
| Camera access denied | Browser permissions | "Unable to access camera. Please check permissions and try again." |
| Not authenticated | Missing JWT token | "You must be logged in to save your face embedding." |
| Permission denied | Ticket doesn't belong to user | "You don't have permission to save an embedding for this ticket." |
| Invalid embedding | Not 128 points | "Invalid embedding data. Must be an array of 128 numbers." |
| Event not found | Event ID invalid | "Event not found" |
| Ticket not found | Ticket ID invalid | "Ticket not found" |

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14.1+
- Opera 76+

Requires browser with:
- WebRTC support (for camera)
- WebGL support (for face-api.js)
- Modern JavaScript features (ES2020+)

## Performance Considerations

- Model files are ~60MB total (loaded once on modal open)
- Real-time detection runs at ~60fps with requestAnimationFrame
- Face detection takes ~30-50ms per frame
- Embeddings are cached in state after first detection
- Camera stream stops automatically when modal closes

## Future Enhancements

Potential improvements:
- Multi-face detection for group tickets
- Liveness detection to prevent spoofing
- 3D face model visualization
- Comparison scoring between stored and new embeddings
- Mobile-optimized capture interface
- Privacy blur options for camera preview
