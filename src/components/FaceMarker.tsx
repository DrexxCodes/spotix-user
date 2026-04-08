"use client"

import { useEffect, useRef, useState } from "react"
import * as faceapi from "@vladmandic/face-api"
import { Loader2, AlertCircle } from "lucide-react"

interface FaceMarkerProps {
  onEmbeddingComplete: (embedding: number[]) => void
  isProcessing: boolean
}

export default function FaceMarker({ onEmbeddingComplete, isProcessing }: FaceMarkerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [embeddings, setEmbeddings] = useState<number[]>([])
  const [confidence, setConfidence] = useState(0)
  const detectionLoopRef = useRef<number | null>(null)

  useEffect(() => {
    const initializeFaceAPI = async () => {
      try {
        // Load models
        const MODEL_URL = "/models/"
        await Promise.all([
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmarkNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceDetectionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ])

        setLoading(false)
        startCamera()
      } catch (err) {
        console.error("[v0] Error loading face-api models:", err)
        setError("Failed to load face detection models. Please refresh and try again.")
        setLoading(false)
      }
    }

    initializeFaceAPI()

    return () => {
      stopCamera()
      if (detectionLoopRef.current) {
        cancelAnimationFrame(detectionLoopRef.current)
      }
    }
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraActive(true)
        startDetection()
      }
    } catch (err) {
      console.error("[v0] Error accessing camera:", err)
      setError("Unable to access camera. Please check permissions and try again.")
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
      setCameraActive(false)
    }
  }

  const startDetection = () => {
    const detectFace = async () => {
      if (!videoRef.current || !canvasRef.current || isProcessing) {
        detectionLoopRef.current = requestAnimationFrame(detectFace)
        return
      }

      try {
        const detections = await faceapi
          .detectAllFaces(videoRef.current)
          .withFaceLandmarks()
          .withFaceRecognition()

        const canvas = canvasRef.current
        const displaySize = {
          width: videoRef.current.width,
          height: videoRef.current.height,
        }

        faceapi.matchDimensions(canvas, displaySize)
        const resizedDetections = faceapi.resizeResults(detections, displaySize)

        const ctx = canvas.getContext("2d")
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)

          // Draw face landmarks
          resizedDetections.forEach((detection) => {
            const landmarks = detection.landmarks
            const recognitionData = detection.descriptor

            // Set drawing styles
            ctx.strokeStyle = "#00ff00"
            ctx.fillStyle = "#00ff00"
            ctx.lineWidth = 2

            // Draw key facial landmarks
            const drawPoint = (point: any) => {
              ctx.fillRect(point.x - 3, point.y - 3, 6, 6)
            }

            const drawLine = (p1: any, p2: any) => {
              ctx.beginPath()
              ctx.moveTo(p1.x, p1.y)
              ctx.lineTo(p2.x, p2.y)
              ctx.stroke()
            }

            // Eyes
            const leftEye = landmarks.getLeftEye()
            const rightEye = landmarks.getRightEye()

            leftEye.forEach(drawPoint)
            rightEye.forEach(drawPoint)

            // Nose
            const nose = landmarks.getNose()
            nose.forEach(drawPoint)

            // Mouth
            const mouth = landmarks.getMouth()
            mouth.forEach(drawPoint)

            // Ears (approximate)
            const jawline = landmarks.getJawOutline()
            if (jawline.length > 0) {
              drawPoint(jawline[0]) // Left ear
              drawPoint(jawline[jawline.length - 1]) // Right ear
            }

            // Draw connections for face outline
            const jawOutline = landmarks.getJawOutline()
            for (let i = 0; i < jawOutline.length - 1; i++) {
              drawLine(jawOutline[i], jawOutline[i + 1])
            }

            // Store embedding
            if (recognitionData && recognitionData.length === 128) {
              setEmbeddings(Array.from(recognitionData))
              setConfidence(detection.detection.score)

              // Auto-complete if face is detected with high confidence
              if (detection.detection.score > 0.8) {
                onEmbeddingComplete(Array.from(recognitionData))
              }
            }
          })

          // Draw instruction text
          ctx.fillStyle = "#00ff00"
          ctx.font = "16px Arial"
          ctx.fillText("Position your face in the frame", 10, 30)
          if (embeddings.length > 0) {
            ctx.fillText(`Confidence: ${(confidence * 100).toFixed(1)}%`, 10, 60)
            ctx.fillText(`Embeddings: ${embeddings.length} points`, 10, 90)
          }
        }
      } catch (err) {
        console.error("[v0] Detection error:", err)
      }

      detectionLoopRef.current = requestAnimationFrame(detectFace)
    }

    detectFace()
  }

  const handleCapture = () => {
    if (embeddings.length === 128) {
      onEmbeddingComplete(embeddings)
    }
  }

  return (
    <div className="w-full space-y-4">
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-purple-600" size={32} />
          <span className="ml-3 text-gray-600">Loading face detection...</span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={20} />
          <div>
            <h3 className="font-semibold text-red-900">Error</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {!loading && !error && (
        <div className="relative bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-auto"
            onLoadedMetadata={() => {
              if (canvasRef.current && videoRef.current) {
                canvasRef.current.width = videoRef.current.videoWidth
                canvasRef.current.height = videoRef.current.videoHeight
              }
            }}
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full"
            style={{ maxWidth: "100%", height: "auto" }}
          />
        </div>
      )}

      <div className="space-y-2">
        {embeddings.length > 0 && (
          <>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-900 font-semibold">Face Detected!</p>
              <p className="text-green-700 text-sm">
                Embeddings captured: {embeddings.length} points
              </p>
              <p className="text-green-700 text-sm">
                Confidence: {(confidence * 100).toFixed(1)}%
              </p>
            </div>
            <button
              onClick={handleCapture}
              disabled={isProcessing || embeddings.length !== 128}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {isProcessing ? "Processing..." : "Confirm & Save Embedding"}
            </button>
          </>
        )}

        {!embeddings.length && !loading && !error && (
          <p className="text-center text-gray-500 text-sm">
            Position your face in the camera to generate embeddings
          </p>
        )}
      </div>
    </div>
  )
}
