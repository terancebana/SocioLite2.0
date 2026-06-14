"use client"

import { useState, useEffect } from "react"

interface Props { isOpen: boolean; onClose: () => void; eventId: string; onSuccess: () => void }

export default function InviteParticipantModal({ isOpen, onClose, eventId, onSuccess }: Props) {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => { if (isOpen) requestAnimationFrame(() => setIsVisible(true)); else setIsVisible(false) }, [isOpen])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => { onClose(); setEmail(""); setError(""); setSuccess("") }, 200)
  }
  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setIsLoading(true); setError(""); setSuccess("")
    try {
      const response = await fetch(`/api/events/${eventId}/invite`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed")
      setSuccess("Invited successfully!")
      setEmail("")
      onSuccess()
      setTimeout(handleClose, 1500)
    } catch (err) { setError(err instanceof Error ? err.message : "Failed") }
    finally { setIsLoading(false) }
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-colors duration-200 ${isVisible ? "bg-black/50" : "bg-transparent"}`} onClick={handleClose}>
      <div className={`card p-6 w-full max-w-sm transition-all duration-200 ${isVisible ? "modal-content" : "opacity-0 scale-95"}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-ink-primary">Invite Someone</h2>
          <button onClick={handleClose} className="btn-ghost btn-icon btn-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-danger-light text-danger-dark px-4 py-3 rounded-xl text-sm animate-slide-down">{error}</div>}
          {success && <div className="bg-success-light text-success-dark px-4 py-3 rounded-xl text-sm animate-slide-down">{success}</div>}
          <div>
            <label className="block text-sm font-medium text-ink-primary mb-1.5">Email address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input" placeholder="friend@example.com" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={handleClose} className="btn-secondary btn-sm">Cancel</button>
            <button type="submit" disabled={isLoading || !email} className="btn-primary btn-sm">
              {isLoading ? "Inviting..." : "Send Invite"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
