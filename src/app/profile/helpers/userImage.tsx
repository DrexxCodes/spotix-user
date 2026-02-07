"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import Image from "next/image"
import { uploadImage } from "@/utils/imageUploader"

interface UserImageProps {
  currentImage: string
  onImageChange: (newImageUrl: string) => void
  uploadProvider: string | null
  setUploadProvider: (provider: string | null) => void
}

export default function UserImage({
  currentImage,
  onImageChange,
  uploadProvider,
  setUploadProvider,
}: UserImageProps) {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageUpload = async () => {
    if (!imageFile) return

    setUploadingImage(true)
    setUploadProgress(0)
    
    try {
      const { uploadPromise } = uploadImage(imageFile, {
        cloudinaryFolder: "profile-pictures",
        showAlert: false,
        onProgress: (progress) => {
          setUploadProgress(progress)
        },
      })
      
      const result = await uploadPromise
      
      if (result.url) {
        onImageChange(result.url)
        setUploadProvider(result.provider)
        setImageFile(null)
        setImagePreview("")
        setUploadProgress(0)
      } else {
        alert("Failed to upload image. Please try again.")
      }
    } catch (error) {
      console.error("Error uploading image:", error)
      alert("Failed to upload image. Please try again.")
    } finally {
      setUploadingImage(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 lg:p-8">
      <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-6">Profile Picture</h2>

      <div className="flex flex-col items-center gap-6">
        <div className="relative w-32 h-32 lg:w-40 lg:h-40">
          <Image
            src={imagePreview || currentImage}
            alt="Profile"
            fill
            className="rounded-full object-cover border-4 border-purple-100"
            priority
          />
        </div>

        <div className="w-full space-y-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 file:cursor-pointer cursor-pointer"
          />

          {imagePreview && (
            <>
              <button
                type="button"
                onClick={handleImageUpload}
                disabled={uploadingImage}
                className="w-full px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold flex items-center justify-center gap-2"
              >
                {uploadingImage ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading... {uploadProgress}%
                  </>
                ) : (
                  "Upload Image"
                )}
              </button>

              {uploadingImage && uploadProgress > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-purple-600 h-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </>
          )}

          {uploadProvider && (
            <p className="text-xs text-gray-500 text-center">
              Using {uploadProvider} for image upload
            </p>
          )}
        </div>
      </div>
    </div>
  )
}