# Face Embedding Implementation Guide

## Overview

This document outlines the complete face embedding feature implementation for the Spotix User Portal. The system allows users to generate unique 128-dimensional facial embeddings for identity verification and event attendance tracking.

## Fixed Issues

### TypeScript Errors Fixed

1. **API Route Authentication (`/api/v1/ticket/[ticketId]/embedding/route.ts`)**
   - Fixed `verifyAccessToken` call to include the required `audience` parameter ("spotix-user")
   - Properly extract JWT token from Authorization header or `spotix_u_at` cookie
   - Added proper error handling with try-catch for token verification

2. **FaceMarker Component (`src/components/FaceMarker.tsx`)**
   - Fixed model loading references:
     - `faceLandmarkNet` → `faceLandmark68TinyNet`
     - `faceDetectionNet` → `tinyFaceDetector`
   - Updated detection chain to use `TinyFaceDetectorOptions()`
   - Fixed TypeScript type for `confidence` state: `useState<number>(0)`

### Model Setup

Created automatic model setup script (`scripts/setup-face-models.js`) that:
- Automatically downloads 6 face-api model files on dev/build
- Integrates with `npm run dev` and `npm run build`
- Stores models in `public/models/` directory
- Downloads from jsDelivr CDN for reliability

Models downloaded:
- `face_landmark_68_tiny_model-weights_manifest.json`
- `face_landmark_68_tiny_model.bin`
- `face_recognition_model-weights_manifest.json`
- `face_recognition_model.bin`
- `tiny_face_detector_model-weights_manifest.json`
- `tiny_face_detector_model.bin`

## Architecture

### Components

#### FaceMarker.tsx
- Real-time camera feed with face detection
- Visualizes facial landmarks (eyes, nose, mouth, ears, jawline)
- Generates 128-dimensional embeddings using face-api
- Auto-completes when confidence > 80%
- Displays confidence percentage and point count

#### FaceEmbeddingModal.tsx
- Modal wrapper for the embedding workflow
- Step-by-step instructions for users
- Success/error state management
- Integrates FaceMarker component

### API Endpoint

**POST `/api/v1/ticket/[ticketId]/embedding`**

Request:
```json
{
  "embedding": [number, ...128 values],
  "eventId": "event-id"
}
```

Response:
```json
{
  "success": true,
  "message": "Face embedding saved successfully",
  "data": {
    "ticketId": "ticket-id",
    "eventId": "event-id",
    "embeddingPoints": 128
  }
}
```

Storage Locations:
- `events/{eventId}/attendees/{ticketId}` - Primary storage
- `tickets/{ticketId}` - Backup storage with `faceEmbedding` field

### UI Integration

Added "Generate Face ID" button to ticket details page:
- Placed alongside "Add to Calendar" and "Download Ticket" buttons
- Opens FaceEmbeddingModal when clicked
- Passes `ticketId` and `eventId` to modal

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development**
   ```bash
   npm run dev
   ```
   - The setup script automatically downloads models on first run
   - Models cached in `public/models/` for subsequent runs

3. **Build for Production**
   ```bash
   npm run build
   ```
   - Models downloaded as part of build process

## File Structure

```
src/
├── components/
│   ├── FaceMarker.tsx              # Face detection & embedding
│   └── FaceEmbeddingModal.tsx       # Modal wrapper
├── app/
│   ├── api/v1/ticket/
│   │   ├── [ticketId]/
│   │   │   ├── embedding/
│   │   │   │   └── route.ts         # Save embedding API
│   │   │   └── route.ts
│   │   └── route.ts
│   └── ticket-history/
│       └── [ticketId]/
│           └── page.tsx              # Added "Generate Face ID" button
├── lib/
│   ├── auth-tokens.ts               # Token verification
│   └── firebase.ts                  # Firestore setup
scripts/
└── setup-face-models.js             # Auto-download models

public/
└── models/                          # Face-api models (auto-downloaded)
```

## Usage Flow

1. User navigates to ticket details page
2. Clicks "Generate Face ID" button
3. Modal opens with FaceMarker component
4. Camera access is requested and granted
5. User positions face in frame
6. System detects landmarks in real-time:
   - Eyes (left & right)
   - Nose
   - Mouth
   - Ears (from jawline)
   - Jawline outline
7. When confidence > 80%, auto-submit or manual "Confirm & Save"
8. Embedding sent to API
9. API stores in Firestore under `events/{eventId}/attendees/{ticketId}`
10. Success message displayed

## Error Handling

### FaceMarker Component
- Camera access denied → Error message displayed
- Model loading failure → Clear error guidance
- Detection errors → Silently logged, detection continues

### API Endpoint
- 401: Missing or invalid token
- 403: User doesn't own ticket
- 404: Ticket or event not found
- 400: Invalid embedding data (not 128 numbers)
- 500: Server error

### Modal
- Network errors → Display with retry option
- Permission errors → Clear message
- Validation errors → User-friendly feedback

## Security

1. **Authentication**: JWT token verification with audience validation
2. **Authorization**: Email-based ownership check (ticket.email === user.email)
3. **Validation**: Embedding must be exactly 128-element array of numbers
4. **CORS**: Restricted to authenticated requests only

## Browser Support

Requires:
- Camera/MediaDevices API support
- WebGL for TensorFlow.js (face-api dependency)
- Modern browser (Chrome 64+, Firefox 55+, Safari 11+, Edge 79+)

## Performance Considerations

- Models cached in browser LocalStorage by TensorFlow.js
- Detection runs at ~15-30 FPS on modern devices
- Embedding generation takes <500ms per frame
- Total embedding capture time: 2-5 seconds

## Future Enhancements

- Liveness detection (blink/head movement verification)
- Multiple embedding averaging for robustness
- Embedding comparison/matching for check-in
- Face masking detection
- Image quality assessment

## Troubleshooting

### Models not loading
- Check `public/models/` directory exists
- Verify CDN URLs are accessible
- Clear browser cache and reload

### Camera not accessible
- Check browser permissions for camera
- Ensure HTTPS in production (required by most browsers)
- Try different browser if issue persists

### Face not detected
- Ensure good lighting
- Position face clearly in frame
- Remove glasses/sunglasses if possible
- Check browser console for detailed errors

### Poor embedding quality
- Improve lighting conditions
- Stabilize head position
- Use front-facing camera (not selfie mode on some devices)
