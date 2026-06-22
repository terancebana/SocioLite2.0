"use client"

import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import { useRouter } from "next/navigation"

interface SettingsPageProps { userId: string; userName: string; userEmail: string }

export default function SettingsPage({ userId, userName, userEmail }: SettingsPageProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"profile" | "password">("profile")
  const [displayName, setDisplayName] = useState(userName)
  const [email, setEmail] = useState(userEmail)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [profileLoaded, setProfileLoaded] = useState(false)

  // Fetch latest profile on mount
  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.name) setDisplayName(data.name)
        if (data.email) setEmail(data.email)
        setProfileLoaded(true)
      })
      .catch(() => setProfileLoaded(true))
  }, [])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!displayName.trim()) { toast.error("Name is required"); return }
    if (!email.includes("@")) { toast.error("Valid email is required"); return }

    setIsLoading(true)
    try {
      const r = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: displayName.trim(), email: email.toLowerCase().trim() }),
      })
      if (!r.ok) {
        const d = await r.json()
        throw new Error(d.error || "Failed")
      }
      toast.success("Profile updated")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) { toast.error("Passwords don't match"); return }
    if (newPassword.length < 8) { toast.error("At least 8 characters"); return }
    setIsLoading(true)
    try {
      const r = await fetch("/api/user/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (!r.ok) {
        const d = await r.json()
        throw new Error(d.error || "Failed")
      }
      toast.success("Password updated")
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update password")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="h-full bg-surface-secondary safe-top safe-bottom flex flex-col overflow-auto">
      {/* Header bar — full width */}
      <div className="bg-white border-b border-slate-100 px-4 sm:px-8 lg:px-12 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink-primary">Settings</h1>
          <p className="text-xs sm:text-sm text-ink-secondary mt-0.5">Manage your account</p>
        </div>
        <button onClick={() => router.push("/")} className="btn-secondary btn-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="hidden sm:inline">Back</span>
        </button>
      </div>

      {/* Content — full width on desktop, constrained on mobile */}
      <div className="flex-1 px-4 sm:px-8 lg:px-12 py-6 sm:py-8">
        {/* Tabs */}
        <div className="flex p-1 bg-surface-tertiary rounded-xl mb-6 max-w-xl">
          {(["profile", "password"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-2.5 sm:py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === tab ? "bg-white text-ink-primary shadow-soft" : "text-ink-secondary hover:text-ink-primary"
              }`}>
              {tab === "profile" ? "Profile" : "Password"}
            </button>
          ))}
        </div>

        {/* Profile tab */}
        {activeTab === "profile" && (
          <div className="max-w-xl">
            {/* User avatar + info card */}
            <div className="card p-5 sm:p-6 mb-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center text-xl font-bold text-brand-600 shrink-0">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-ink-primary">{displayName || "User"}</h2>
                  <p className="text-sm text-ink-secondary">{email}</p>
                  <p className="text-xs text-ink-muted mt-0.5">User ID: {userId.slice(0, 8)}...</p>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-ink-primary mb-1.5">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="input text-base sm:text-sm"
                    required
                    maxLength={100}
                    placeholder="Your display name"
                  />
                  <p className="text-xs text-ink-muted mt-1">This is how others see you in chats and events.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-primary mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input text-base sm:text-sm"
                    required
                    placeholder="you@example.com"
                  />
                  <p className="text-xs text-ink-muted mt-1">Used for login and receiving event invitations.</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isLoading || (!displayName.trim() && email === userEmail)}
                    className="btn-primary"
                  >
                    {isLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>

            {/* Danger zone */}
            <div className="card p-5 sm:p-6 border-danger/20">
              <h3 className="text-sm font-semibold text-danger mb-2">Danger Zone</h3>
              <p className="text-xs text-ink-secondary mb-4">
                Once you delete your account, there is no going back. All your data will be permanently removed.
              </p>
              <button
                onClick={async () => {
                  if (!confirm("Are you absolutely sure? This cannot be undone.")) return
                  try {
                    const r = await fetch("/api/auth/delete-account", { method: "DELETE" })
                    if (r.ok) { router.push("/login") }
                    else toast.error("Failed to delete account")
                  } catch { toast.error("Failed to delete account") }
                }}
                className="btn-danger btn-sm"
              >
                Delete Account
              </button>
            </div>
          </div>
        )}

        {/* Password tab */}
        {activeTab === "password" && (
          <div className="max-w-xl">
            <div className="card p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-ink-primary mb-5">Change Password</h2>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink-primary mb-1.5">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="input text-base sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-primary mb-1.5">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input text-base sm:text-sm"
                    required
                    minLength={8}
                    placeholder="At least 8 characters"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-primary mb-1.5">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input text-base sm:text-sm"
                    required
                  />
                </div>
                <button type="submit" disabled={isLoading} className="btn-primary">
                  {isLoading ? "Updating..." : "Update Password"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
