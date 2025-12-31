"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { auth, storage } from "@/app/lib/firebase"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { createVote, generateContestantId, type ContestantData } from "@/app/lib/voting-utils"
import UserHeader from "@/components/UserHeader"
import Footer from "@/components/footer"
import {
  Upload,
  Calendar,
  Users,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Info,
  ImageIcon,
  Loader,
} from "lucide-react"

interface FormData {
  pollName: string
  pollImage: string | null
  pollDescription: string
  pollStartDate: string
  pollStartTime: string
  pollEndDate: string
  pollEndTime: string
  pollPrice: number
  contestants: ContestantData[]
}

interface UploadingState {
  pollImage: boolean
  contestants: { [key: number]: boolean }
}

export default function CreateVotePage() {
  const [user, setUser] = useState<any>(null)
  const [voteId, setVoteId] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    pollName: "",
    pollImage: null,
    pollDescription: "",
    pollStartDate: "",
    pollStartTime: "",
    pollEndDate: "",
    pollEndTime: "",
    pollPrice: 100,
    contestants: [{ contestantId: "", name: "", image: "" }],
  })
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [contestantPreviews, setContestantPreviews] = useState<(string | null)[]>([null])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState<UploadingState>({ pollImage: false, contestants: {} })
  const [errors, setErrors] = useState<string[]>([])
  const [currentStep, setCurrentStep] = useState(1)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (!currentUser) {
        router.push("/auth/login")
        return
      }
      setUser(currentUser)
      const newVoteId = `vote_${currentUser.uid}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      setVoteId(newVoteId)
    })
    return () => unsubscribe()
  }, [router])

  const validateForm = (): boolean => {
    const newErrors: string[] = []
    if (!formData.pollName.trim()) newErrors.push("Poll name is required")
    if (!formData.pollImage) newErrors.push("Poll image is required")
    if (!formData.pollDescription.trim()) newErrors.push("Poll description is required")
    if (!formData.pollStartDate) newErrors.push("Start date is required")
    if (!formData.pollStartTime) newErrors.push("Start time is required")
    if (!formData.pollEndDate) newErrors.push("End date is required")
    if (!formData.pollEndTime) newErrors.push("End time is required")

    const startDateTime = new Date(`${formData.pollStartDate}T${formData.pollStartTime}`)
    const endDateTime = new Date(`${formData.pollEndDate}T${formData.pollEndTime}`)
    if (startDateTime >= endDateTime) newErrors.push("End date must be after start date")

    const validContestants = formData.contestants.filter((c) => c.name.trim() || c.image)
    if (validContestants.length === 0) newErrors.push("At least one contestant is required")

    validContestants.forEach((contestant, index) => {
      if (!contestant.name.trim()) newErrors.push(`Contestant ${index + 1}: Name required`)
      if (!contestant.image) newErrors.push(`Contestant ${index + 1}: Image required`)
      if (!contestant.contestantId) newErrors.push(`Contestant ${index + 1}: Generate ID`)
    })

    if (formData.pollPrice <= 0) newErrors.push("Price must be greater than 0")
    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handlePollImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && voteId) {
      setUploading((prev) => ({ ...prev, pollImage: true }))
      const reader = new FileReader()
      reader.onload = (event) => setImagePreview(event.target?.result as string)
      reader.readAsDataURL(file)

      try {
        const pollImageRef = ref(storage, `polls/${voteId}/pollImage`)
        await uploadBytes(pollImageRef, file)
        const downloadUrl = await getDownloadURL(pollImageRef)
        setFormData((prev) => ({ ...prev, pollImage: downloadUrl }))
      } catch (error) {
        console.error("Error uploading poll image:", error)
        setErrors((prev) => [...prev, "Failed to upload poll image"])
      } finally {
        setUploading((prev) => ({ ...prev, pollImage: false }))
      }
    }
  }

  const handleContestantImageChange = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && voteId) {
      setUploading((prev) => ({ ...prev, contestants: { ...prev.contestants, [index]: true } }))
      const reader = new FileReader()
      reader.onload = (event) => {
        const newPreviews = [...contestantPreviews]
        newPreviews[index] = event.target?.result as string
        setContestantPreviews(newPreviews)
      }
      reader.readAsDataURL(file)

      try {
        const timestamp = Date.now()
        const contestantImageRef = ref(storage, `polls/${voteId}/${timestamp}`)
        await uploadBytes(contestantImageRef, file)
        const downloadUrl = await getDownloadURL(contestantImageRef)
        const newContestants = [...formData.contestants]
        newContestants[index].image = downloadUrl
        setFormData((prev) => ({ ...prev, contestants: newContestants }))
      } catch (error) {
        console.error("Error uploading contestant image:", error)
        setErrors((prev) => [...prev, `Failed to upload image for contestant ${index + 1}`])
      } finally {
        setUploading((prev) => {
          const updated = { ...prev.contestants }
          delete updated[index]
          return { ...prev, contestants: updated }
        })
      }
    }
  }

  const handleContestantInputChange = (index: number, field: "name", value: string) => {
    const newContestants = [...formData.contestants]
    newContestants[index][field] = value
    setFormData((prev) => ({ ...prev, contestants: newContestants }))
  }

  const generateContestantIdForIndex = (index: number) => {
    const newContestants = [...formData.contestants]
    newContestants[index].contestantId = generateContestantId()
    setFormData((prev) => ({ ...prev, contestants: newContestants }))
  }

  const addContestantField = () => {
    setFormData((prev) => ({
      ...prev,
      contestants: [...prev.contestants, { contestantId: "", name: "", image: "" }],
    }))
    setContestantPreviews((prev) => [...prev, null])
  }

  const removeContestant = (index: number) => {
    if (formData.contestants.length > 1) {
      setFormData((prev) => ({
        ...prev,
        contestants: prev.contestants.filter((_, i) => i !== index),
      }))
      setContestantPreviews((prev) => prev.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async () => {
    if (!validateForm() || !user || !voteId) return
    setLoading(true)

    try {
      const processedContestants = formData.contestants
        .filter((c) => c.name.trim())
        .map((contestant) => ({
          contestantId: contestant.contestantId,
          name: contestant.name,
          image: contestant.image,
        }))

      await createVote(user.uid, {
        pollName: formData.pollName,
        pollImage: formData.pollImage as string,
        pollDescription: formData.pollDescription,
        pollStartDate: formData.pollStartDate,
        pollStartTime: formData.pollStartTime,
        pollEndDate: formData.pollEndDate,
        pollEndTime: formData.pollEndTime,
        pollAmount: 0,
        pollPrice: formData.pollPrice,
        contestants: processedContestants,
        creatorId: user.uid,
      })
      router.push("/vote")
    } catch (error) {
      console.error("Error creating vote:", error)
      setErrors(["Failed to create poll. Please try again."])
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
        <UserHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-purple-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-slate-600 font-medium">Loading...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const steps = [
    { number: 1, title: "Poll Details", icon: Info },
    { number: 2, title: "Schedule", icon: Calendar },
    { number: 3, title: "Contestants", icon: Users },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <UserHeader />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-900">Create Your Poll</h1>
              <p className="text-slate-600">Set up a new voting campaign in minutes</p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-8 mb-6">
            {steps.map((step, index) => {
              const StepIcon = step.icon
              const isActive = currentStep === step.number
              const isCompleted = currentStep > step.number
              return (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isCompleted ? "bg-green-500 text-white shadow-lg" : isActive ? "bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg" : "bg-white border-2 border-slate-200 text-slate-400"}`}
                    >
                      {isCompleted ? <CheckCircle className="w-6 h-6" /> : <StepIcon className="w-5 h-5" />}
                    </div>
                    <p
                      className={`text-xs font-medium mt-2 ${isActive ? "text-purple-600" : isCompleted ? "text-green-600" : "text-slate-400"}`}
                    >
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-1 flex-1 mx-2 rounded-full transition-all ${currentStep > step.number ? "bg-green-500" : "bg-slate-200"}`}
                    ></div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {errors.length > 0 && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-red-900 font-bold mb-2 text-lg">Fix these errors:</h3>
                <ul className="space-y-1">
                  {errors.map((error, index) => (
                    <li key={index} className="text-red-700 flex gap-2">
                      <span className="text-red-500">•</span>
                      <span>{error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <Info className="w-6 h-6 text-purple-600" />
                  Basic Information
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Poll Name *</label>
                    <input
                      type="text"
                      placeholder="e.g., Best Local Music Artist 2025"
                      value={formData.pollName}
                      onChange={(e) => setFormData({ ...formData, pollName: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Poll Cover Image *{" "}
                      {uploading.pollImage && <Loader className="w-4 h-4 inline animate-spin text-purple-600 ml-2" />}
                    </label>
                    <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 hover:border-purple-500 transition-all bg-slate-50 hover:bg-purple-50/50">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePollImageChange}
                        id="poll-image-input"
                        className="hidden"
                        disabled={uploading.pollImage}
                      />
                      <label
                        htmlFor="poll-image-input"
                        className={`cursor-pointer block ${uploading.pollImage ? "opacity-50" : ""}`}
                      >
                        {imagePreview ? (
                          <div className="relative w-full aspect-video rounded-xl overflow-hidden group">
                            <img
                              src={imagePreview || "/placeholder.svg"}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <div className="text-white text-center">
                                <Upload className="w-8 h-8 mx-auto mb-2" />
                                <p className="font-medium">Change Image</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <ImageIcon className="w-8 h-8 text-purple-600" />
                            </div>
                            <div className="text-slate-600 font-medium mb-2">Click to upload</div>
                            <div className="text-sm text-slate-500">PNG, JPG up to 5MB</div>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Description *</label>
                    <textarea
                      placeholder="Describe your poll..."
                      value={formData.pollDescription}
                      onChange={(e) => setFormData({ ...formData, pollDescription: e.target.value })}
                      rows={5}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 resize-none"
                    />
                    <p className="text-xs text-slate-500 mt-2">{formData.pollDescription.length} characters</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-purple-600" />
                  Schedule & Pricing
                </h2>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Start Date *</label>
                      <input
                        type="date"
                        value={formData.pollStartDate}
                        onChange={(e) => setFormData({ ...formData, pollStartDate: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Start Time *</label>
                      <input
                        type="time"
                        value={formData.pollStartTime}
                        onChange={(e) => setFormData({ ...formData, pollStartTime: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">End Date *</label>
                      <input
                        type="date"
                        value={formData.pollEndDate}
                        onChange={(e) => setFormData({ ...formData, pollEndDate: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">End Time *</label>
                      <input
                        type="time"
                        value={formData.pollEndTime}
                        onChange={(e) => setFormData({ ...formData, pollEndTime: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10"
                      />
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
                    <label className="block text-sm font-semibold text-slate-700 mb-3">Price Per Vote (₦) *</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={formData.pollPrice}
                      onChange={(e) => setFormData({ ...formData, pollPrice: Number(e.target.value) })}
                      className="w-full px-4 py-3 border-2 border-purple-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 text-2xl font-bold"
                    />
                    <p className="text-sm text-slate-600 mt-3">💡 Default is ₦100. Set what works for you.</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-8 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="flex-1 px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                    <Users className="w-6 h-6 text-purple-600" />
                    Add Contestants
                  </h2>
                  <div className="text-sm text-slate-600 bg-purple-100 px-4 py-2 rounded-full font-medium">
                    {formData.contestants.length} Contestant{formData.contestants.length !== 1 ? "s" : ""}
                  </div>
                </div>
                <div className="space-y-6">
                  {formData.contestants.map((contestant, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-xl border-2 border-slate-200"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-slate-900">Contestant {index + 1}</h3>
                        {formData.contestants.length > 1 && (
                          <button
                            onClick={() => removeContestant(index)}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-5 h-5 text-red-600" />
                          </button>
                        )}
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Name *</label>
                          <input
                            type="text"
                            placeholder="Enter contestant name"
                            value={contestant.name}
                            onChange={(e) => handleContestantInputChange(index, "name", e.target.value)}
                            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            ID *{" "}
                            {uploading.contestants[index] && (
                              <Loader className="w-4 h-4 inline animate-spin text-purple-600 ml-2" />
                            )}
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Auto-generated"
                              value={contestant.contestantId}
                              disabled
                              className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl bg-slate-50 text-slate-700 placeholder-slate-400 disabled:opacity-60"
                            />
                            <button
                              onClick={() => generateContestantIdForIndex(index)}
                              className="px-4 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors"
                            >
                              Generate
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Photo *{" "}
                            {uploading.contestants[index] && (
                              <Loader className="w-4 h-4 inline animate-spin text-purple-600 ml-2" />
                            )}
                          </label>
                          <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 hover:border-purple-500 transition-all bg-slate-50 hover:bg-purple-50/50">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleContestantImageChange(index, e)}
                              id={`contestant-image-${index}`}
                              className="hidden"
                              disabled={uploading.contestants[index]}
                            />
                            <label
                              htmlFor={`contestant-image-${index}`}
                              className={`cursor-pointer block ${uploading.contestants[index] ? "opacity-50" : ""}`}
                            >
                              {contestantPreviews[index] ? (
                                <div className="relative w-full aspect-square rounded-lg overflow-hidden group">
                                  <img
                                    src={contestantPreviews[index]! || "/placeholder.svg"}
                                    alt={`Contestant ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <div className="text-white text-center">
                                      <Upload className="w-6 h-6 mx-auto mb-1" />
                                      <p className="text-sm font-medium">Change</p>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center py-8">
                                  <ImageIcon className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                                  <div className="text-slate-600 text-sm font-medium">Click to upload</div>
                                </div>
                              )}
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={addContestantField}
                    className="w-full py-3 border-2 border-dashed border-purple-300 text-purple-600 rounded-xl font-semibold hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Contestant
                  </button>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-8 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating Poll..." : "Create Poll"}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
