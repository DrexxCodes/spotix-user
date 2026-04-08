# Face API Setup Instructions

The face embedding feature requires the face-api.js models to be downloaded and placed in the `public/models/` directory.

## Quick Setup

1. Create the models directory:
```bash
mkdir -p public/models
```

2. Download the required model files from the @vladmandic/face-api repository:
```bash
cd public/models
wget https://github.com/vladmandic/face-api/raw/master/model/face_detection_model-weights_manifest.json
wget https://github.com/vladmandic/face-api/raw/master/model/face_detection_model.weights.bin
wget https://github.com/vladmandic/face-api/raw/master/model/face_landmarks_model-weights_manifest.json
wget https://github.com/vladmandic/face-api/raw/master/model/face_landmarks_model.weights.bin
wget https://github.com/vladmandic/face-api/raw/master/model/face_recognition_model-weights_manifest.json
wget https://github.com/vladmandic/face-api/raw/master/model/face_recognition_model.weights.bin
wget https://github.com/vladmandic/face-api/raw/master/model/face_expression_model-weights_manifest.json
wget https://github.com/vladmandic/face-api/raw/master/model/face_expression_model.weights.bin
cd ../..
```

Alternatively, if using macOS or Windows, download them manually from:
https://github.com/vladmandic/face-api/tree/master/model

Then place them in `public/models/` directory.

3. Verify all files are in place:
```bash
ls -la public/models/
```

You should see these 8 files:
- face_detection_model-weights_manifest.json
- face_detection_model.weights.bin
- face_landmarks_model-weights_manifest.json
- face_landmarks_model.weights.bin
- face_recognition_model-weights_manifest.json
- face_recognition_model.weights.bin
- face_expression_model-weights_manifest.json
- face_expression_model.weights.bin

## After Setup

Once the models are in place:

1. Install the required package (if not already installed):
```bash
npm install @vladmandic/face-api
```

2. The face embedding feature should now be available in the ticket details page.
3. Click the "Generate Face ID" button on any ticket to start capturing facial embeddings.
