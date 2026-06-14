"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface DeleteAccountModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function DeleteAccountModal({ isOpen, onClose }: DeleteAccountModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isVisible, setIsVisible] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (isOpen) requestAnimationFrame(() => setIsVisible(true))
    else setIsVisible(false)
  }, [isOpen])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 200)
  }

  if (!isOpen) return null

  async function handleDelete() {
    setIsLoading(true)
    setError("")
    try {
      const response = await fetch("/api/auth/delete-account", { method: "DELETE" })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete account")
      }
      router.push("/login")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete account")
      setIsLoading(false)
    }
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-colors duration-200 ${isVisible ? "bg-black/50" : "bg-transparent"}`}
      onClick={handleClose}
    >
      <div
        className={`card p-6 w-full max-w-md transition-all duration-200 ${isVisible ? "modal-content" : "opacity-0 scale-95"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-danger-light flex items-center justify-center">
            <svg className="w-5 h-5 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-ink-primary">Delete Account</h2>
        </div>

        {error && (
          <div className="bg-danger-light text-danger-dark px-4 py-3 rounded-xl text-sm mb-4 animate-slide-down">
            {error}
          </div>
        )}

        <p className="text-sm text-ink-secondary mb-4">
          This will permanently delete your account, all your events, messages, and remove you from all events.
          This action <strong className="text-ink-primary">cannot be undone</strong>.
        </p>

        <div className="flex justify-end gap-3">
          <button onClick={handleClose} disabled={isLoading} className="btn-secondary btn-sm">Cancel</button>
          <button onClick={handleDelete} disabled={isLoading} className="btn-danger btn-sm">
            {isLoading ? "Deleting..." : "Delete Account"}
          </button>
        </div>
      </div>
    </div>
  )
}
