"use client"

interface UserDetailProps {
  fullName: string
  username: string
  onFullNameChange: (value: string) => void
  onUsernameChange: (value: string) => void
}

export default function UserDetail({
  fullName,
  username,
  onFullNameChange,
  onUsernameChange,
}: UserDetailProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 lg:p-8">
      <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-6">Personal Information</h2>

      <div className="space-y-5">
        <div>
          <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2">
            Full Name
          </label>
          <input
            type="text"
            id="fullName"
            value={fullName}
            onChange={(e) => onFullNameChange(e.target.value)}
            placeholder="Enter your full name"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
          />
        </div>

        <div>
          <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
            Username
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => onUsernameChange(e.target.value)}
            placeholder="Choose a username"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
          />
        </div>
      </div>
    </div>
  )
}