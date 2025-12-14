/**
 * Tiered Image Upload System with Background Processing
 * Version 2.0.0
 * Dev by Drexx
 *
 * This utility provides a robust image upload system that attempts uploads
 * in the following order:
 * 1. Cloudinary (primary)
 * 2. Uploadthing (fallback)
 *
 * The system only proceeds to the next provider if the previous one fails.
 * It also supports background uploading with progress tracking.
 */

// Environment variables needed for each provider
// Cloudinary
// - VITE_CLOUDINARY_CLOUD_NAME
// - VITE_CLOUDINARY_UPLOAD_PRESET
//
// Uploadthing
// - VITE_UPLOADTHING_API_KEY

/**
 * Attempts to upload an image to Cloudinary with progress tracking
 * @param file The file to upload
 * @param folder Optional folder path within Cloudinary
 * @param onProgress Callback for upload progress updates
 * @returns The URL of the uploaded image or null if upload failed
 */
async function uploadToCloudinary(
  file: File,
  folder?: string,
  onProgress?: (progress: number) => void,
): Promise<string | null> {
  try {
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

    if (!uploadPreset || !cloudName) {
      console.error("Cloudinary configuration missing")
      return null
    }

    const formData = new FormData()
    formData.append("file", file)
    formData.append("upload_preset", uploadPreset)
    if (folder) {
      formData.append("folder", folder)
    }

    // Use XMLHttpRequest to track upload progress
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/upload`, true)

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100)
          onProgress(progress)
        }
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText)
          resolve(response.secure_url)
        } else {
          reject(new Error(`Cloudinary upload failed: ${xhr.status} ${xhr.statusText}`))
        }
      }

      xhr.onerror = () => {
        reject(new Error("Network error during Cloudinary upload"))
      }

      xhr.send(formData)
    })
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error)
    return null
  }
}

/**
 * Attempts to upload an image to Uploadthing with progress tracking
 * @param file The file to upload
 * @param onProgress Callback for upload progress updates
 * @returns The URL of the uploaded image or null if upload failed
 */
async function uploadToUploadthing(file: File, onProgress?: (progress: number) => void): Promise<string | null> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_UPLOADTHING_API_KEY

    if (!apiKey) {
      console.error("Uploadthing configuration missing")
      return null
    }

    const formData = new FormData()
    formData.append("file", file)

    // Use XMLHttpRequest to track upload progress
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      xhr.open("POST", "https://uploadthing.com/api/uploadFiles", true)
      xhr.setRequestHeader("X-API-Key", apiKey)

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100)
          onProgress(progress)
        }
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText)
            if (response.data && response.data[0] && response.data[0].url) {
              resolve(response.data[0].url)
            } else {
              reject(new Error("Invalid response format from Uploadthing"))
            }
          } catch (e) {
            reject(new Error("Failed to parse Uploadthing response"))
          }
        } else {
          reject(new Error(`Uploadthing upload failed: ${xhr.status} ${xhr.statusText}`))
        }
      }

      xhr.onerror = () => {
        reject(new Error("Network error during Uploadthing upload"))
      }

      xhr.send(formData)
    })
  } catch (error) {
    console.error("Error uploading to Uploadthing:", error)
    return null
  }
}

/**
 * Uploads an image using a tiered fallback system with progress tracking
 * @param file The file to upload
 * @param options Additional options for the upload
 * @returns An object containing the URL of the uploaded image, the provider used, and a promise that resolves when the upload is complete
 */
export function uploadImage(
  file: File,
  options: {
    cloudinaryFolder?: string
    onProgress?: (progress: number) => void
    showAlert?: boolean
  } = {},
): {
  uploadPromise: Promise<{ url: string | null; provider: string | null }>
  cancelUpload: () => void
} {
  const { cloudinaryFolder, onProgress, showAlert = false } = options
  let isCancelled = false

  const cancelUpload = () => {
    isCancelled = true
  }

  const uploadPromise = new Promise<{ url: string | null; provider: string | null }>(async (resolve) => {
    let fileUrl: string | null = null
    let provider: string | null = null

    // Progress handler that respects cancellation
    const handleProgress = (progress: number) => {
      if (!isCancelled && onProgress) {
        onProgress(progress)
      }
    }

    // 1. Try Cloudinary first
    if (!isCancelled) {
      try {
        fileUrl = await uploadToCloudinary(file, cloudinaryFolder, handleProgress)
        if (fileUrl) {
          provider = "Spotix-Cloud"
        }
      } catch (error) {
        console.error("Cloudinary upload failed:", error)
      }
    }

    // 2. If Cloudinary fails and not cancelled, try Uploadthing
    if (!fileUrl && !isCancelled) {
      try {
        // Reset progress to 0 for the next provider
        handleProgress(0)
        fileUrl = await uploadToUploadthing(file, handleProgress)
        if (fileUrl) {
          provider = "uploadthing"
        }
      } catch (error) {
        console.error("Uploadthing upload failed:", error)
      }
    }

    if (isCancelled) {
      resolve({ url: null, provider: null })
      return
    }

    if (fileUrl && showAlert) {
      alert(`Uploaded to server (${provider})`)
    }

    if (!fileUrl && showAlert) {
      alert("Failed to upload image to any server. Please try again later.")
    }

    resolve({ url: fileUrl, provider })
  })

  return { uploadPromise, cancelUpload }
}
