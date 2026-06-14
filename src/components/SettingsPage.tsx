"use client"

import { useState } from "react"
import { toast } from "react-hot-toast"
import { useRouter } from "next/navigation"

interface SettingsPageProps {
  userId: string
  userName: string
}

export default function SettingsPage({ userName }: SettingsPageProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"profile" | "password">("profile")
  const [newUsername, setNewUsername] = useState(userName)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newUsername }),
      })
      if (!response.ok) throw new Error("Failed to update profile")
      toast.success("Profile updated successfully")
      router.refresh()
    } catch {
      toast.error("Failed to update profile")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match"); return }
    if (newPassword.length < 8) { toast.error("Password must be at least 8 characters"); return }
    setIsLoading(true)
    try {
      const response = await fetch("/api/user/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (!response.ok) throw new Error("Failed to update password")
      toast.success("Password updated successfully")
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("")
    } catch {
      toast.error("Failed to update password")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-surface-secondary">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-ink-primary">Settings</h1>
            <p className="text-sm text-ink-secondary mt-1">Manage your account preferences</p>
          </div>
          <button onClick={() => router.push("/")} className="btn-secondary btn-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-surface-tertiary rounded-xl mb-6 animate-fade-in animate-delay-100">
          {(["profile", "password"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                activeTab === tab
                  ? "bg-white text-ink-primary shadow-soft"
                  : "text-ink-secondary hover:text-ink-primary"
              }`}
            >
              {tab === "profile" ? "Profile" : "Password"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="card p-6 animate-fade-in animate-delay-200">
          {activeTab === "profile" && (
            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-ink-primary mb-1.5">Display Name</label>
                <input
                  type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)}
                  className="input" required maxLength={100}
                />
              </div>
              <button type="submit" disabled={isLoading || !newUsername.trim()} className="btn-primary">
                {isLoading ? "Saving..." : "Save Changes"}
              </button>
            </form>
          )}

          {activeTab === "password" && (
            <form onSubmit={handleUpdatePassword} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-ink-primary mb-1.5">Current Password</label>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-primary mb-1.5">New Password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  className="input" required minLength={8} placeholder="At least 8 characters" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-primary mb-1.5">Confirm New Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input" required />
              </div>
              <button type="submit" disabled={isLoading} className="btn-primary">
                {isLoading ? "Updating..." : "Update Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
