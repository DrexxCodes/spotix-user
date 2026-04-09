#!/usr/bin/env node

/**
 * Setup Face API Models
 * Downloads face-api model files to public/models directory
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const MODEL_DIR = path.join(__dirname, "../public/models");

// Create models directory if it doesn't exist
if (!fs.existsSync(MODEL_DIR)) {
  fs.mkdirSync(MODEL_DIR, { recursive: true });
  console.log(`Created directory: ${MODEL_DIR}`);
}

// Model files to download from CDN
const MODELS = [
  {
    name: "face_landmark_68_tiny_model-weights_manifest.json",
    url: "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model/face_landmark_68_tiny_model-weights_manifest.json",
  },
  {
    name: "face_landmark_68_tiny_model.bin",
    url: "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model/face_landmark_68_tiny_model.bin",
  },
  {
    name: "face_recognition_model-weights_manifest.json",
    url: "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model/face_recognition_model-weights_manifest.json",
  },
  {
    name: "face_recognition_model.bin",
    url: "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model/face_recognition_model.bin",
  },
  {
    name: "tiny_face_detector_model-weights_manifest.json",
    url: "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model/tiny_face_detector_model-weights_manifest.json",
  },
  {
    name: "tiny_face_detector_model.bin",
    url: "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model/tiny_face_detector_model.bin",
  },
];

const downloadFile = (url, filePath) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    https
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Download failed: ${response.statusCode}`));
          return;
        }
        response.pipe(file);
      })
      .on("error", (err) => {
        fs.unlink(filePath, () => {}); // Delete the file on error
        reject(err);
      });

    file.on("finish", () => {
      file.close();
      resolve();
    });

    file.on("error", (err) => {
      fs.unlink(filePath, () => {}); // Delete the file on error
      reject(err);
    });
  });
};

const setupModels = async () => {
  console.log("Setting up Face API models...");

  for (const model of MODELS) {
    const filePath = path.join(MODEL_DIR, model.name);

    // Skip if file already exists
    if (fs.existsSync(filePath)) {
      console.log(`✓ ${model.name} already exists`);
      continue;
    }

    try {
      console.log(`Downloading ${model.name}...`);
      await downloadFile(model.url, filePath);
      console.log(`✓ Downloaded ${model.name}`);
    } catch (error) {
      console.error(`✗ Failed to download ${model.name}: ${error.message}`);
    }
  }

  console.log("Face API models setup complete!");
};

setupModels().catch((error) => {
  console.error("Setup failed:", error);
  process.exit(1);
});
