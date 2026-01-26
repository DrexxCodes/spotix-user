"use client"

import { useState } from "react"
import { AlertCircle } from "lucide-react"

interface BaseFieldProps {
  question: {
    id: string
    questionText: string
    required: boolean
  }
  value: any
  onChange: (value: any) => void
  error?: string
}

// Short Text Input
export function ShortTextField({ question, value, onChange, error }: BaseFieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-slate-900">
        {question.questionText}
        {question.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${
          error
            ? "border-red-300 focus:ring-red-500 focus:border-red-500"
            : "border-slate-200 focus:ring-[#6b2fa5] focus:border-[#6b2fa5]"
        }`}
        placeholder="Your answer..."
      />
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  )
}

// Long Text Input (Textarea)
export function LongTextField({ question, value, onChange, error }: BaseFieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-slate-900">
        {question.questionText}
        {question.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 resize-none ${
          error
            ? "border-red-300 focus:ring-red-500 focus:border-red-500"
            : "border-slate-200 focus:ring-[#6b2fa5] focus:border-[#6b2fa5]"
        }`}
        placeholder="Your answer..."
      />
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  )
}

// Number Input
export function NumberField({ question, value, onChange, error }: BaseFieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-slate-900">
        {question.questionText}
        {question.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type="number"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${
          error
            ? "border-red-300 focus:ring-red-500 focus:border-red-500"
            : "border-slate-200 focus:ring-[#6b2fa5] focus:border-[#6b2fa5]"
        }`}
        placeholder="Enter a number..."
      />
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  )
}

// Radio Buttons (Single Choice)
interface RadioFieldProps extends BaseFieldProps {
  question: BaseFieldProps["question"] & {
    options: string[]
  }
}

export function RadioField({ question, value, onChange, error }: RadioFieldProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-slate-900">
        {question.questionText}
        {question.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="space-y-2">
        {question.options.map((option, index) => (
          <label
            key={index}
            className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
              value === option
                ? "border-[#6b2fa5] bg-[#6b2fa5]/5"
                : error
                  ? "border-red-300 hover:border-red-400"
                  : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <input
              type="radio"
              name={question.id}
              value={option}
              checked={value === option}
              onChange={(e) => onChange(e.target.value)}
              className="w-5 h-5 text-[#6b2fa5] focus:ring-[#6b2fa5] focus:ring-2"
            />
            <span className="text-sm font-medium text-slate-900">{option}</span>
          </label>
        ))}
      </div>
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  )
}

// Checkboxes (Multiple Choice)
interface CheckboxFieldProps extends BaseFieldProps {
  question: BaseFieldProps["question"] & {
    options: string[]
  }
}

export function CheckboxField({ question, value, onChange, error }: CheckboxFieldProps) {
  const selectedValues = Array.isArray(value) ? value : []

  const handleToggle = (option: string) => {
    const newValues = selectedValues.includes(option)
      ? selectedValues.filter((v) => v !== option)
      : [...selectedValues, option]
    onChange(newValues)
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-slate-900">
        {question.questionText}
        {question.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="space-y-2">
        {question.options.map((option, index) => (
          <label
            key={index}
            className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
              selectedValues.includes(option)
                ? "border-[#6b2fa5] bg-[#6b2fa5]/5"
                : error
                  ? "border-red-300 hover:border-red-400"
                  : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <input
              type="checkbox"
              checked={selectedValues.includes(option)}
              onChange={() => handleToggle(option)}
              className="w-5 h-5 text-[#6b2fa5] focus:ring-[#6b2fa5] focus:ring-2 rounded"
            />
            <span className="text-sm font-medium text-slate-900">{option}</span>
          </label>
        ))}
      </div>
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  )
}

// Phone Number Input (with validation)
export function PhoneField({ question, value, onChange, error }: BaseFieldProps) {
  const [touched, setTouched] = useState(false)

  const validatePhone = (phone: string) => {
    // Basic validation for phone numbers (10-15 digits)
    const phoneRegex = /^[0-9]{10,15}$/
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ""))
  }

  const handleChange = (val: string) => {
    // Allow only numbers, spaces, dashes, and parentheses
    const sanitized = val.replace(/[^0-9\s\-\(\)]/g, "")
    onChange(sanitized)
  }

  const showValidationError = touched && value && !validatePhone(value)

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-slate-900">
        {question.questionText}
        {question.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type="tel"
        value={value || ""}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={() => setTouched(true)}
        className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${
          error || showValidationError
            ? "border-red-300 focus:ring-red-500 focus:border-red-500"
            : "border-slate-200 focus:ring-[#6b2fa5] focus:border-[#6b2fa5]"
        }`}
        placeholder="e.g., 08012345678"
      />
      {(error || showValidationError) && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4" />
          {error || "Please enter a valid phone number (10-15 digits)"}
        </div>
      )}
    </div>
  )
}