"use client"

import { useState, useEffect } from "react"

interface ModalProps { isOpen: boolean; onClose: () => void; onEventCreated: () => void }

export default function CreateEventModal({ isOpen, onClose, onEventCreated }: ModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => { if (isOpen) requestAnimationFrame(() => setIsVisible(true)); else setIsVisible(false) }, [isOpen])
  const handleClose = () => { setIsVisible(false); setTimeout(onClose, 200) }
  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setIsLoading(true); setError("")
    const fd = new FormData(e.currentTarget)
    try {
      const r = await fetch("/api/events", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: fd.get("title"), description: fd.get("description"), eventDate: fd.get("eventDate") }),
      })
      if (!r.ok) { const d = await r.json(); throw new Error(d.error || "Failed") }
      onEventCreated(); handleClose()
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to create event") }
    finally { setIsLoading(false) }
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center transition-colors duration-200 ${isVisible ? "bg-black/50" : "bg-transparent"}`} onClick={handleClose}>
      <div className={`card p-6 w-full sm:max-w-md transition-all duration-200 max-h-[90dvh] overflow-y-auto sm:rounded-2xl rounded-t-2xl sm:rounded-b-2xl rounded-b-none ${isVisible ? "modal-content" : "opacity-0 translate-y-8"}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-ink-primary">Create Event</h2>
          <button onClick={handleClose} className="btn-ghost btn-icon btn-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-danger-light text-danger-dark px-4 py-3 rounded-xl text-sm animate-slide-down">{error}</div>}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-ink-primary mb-1.5">Event Title</label>
            <input type="text" id="title" name="title" required maxLength={200} className="input text-base sm:text-sm" placeholder="Team standup" />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-ink-primary mb-1.5">Description</label>
            <textarea id="description" name="description" rows={3} className="input text-base sm:text-sm" placeholder="What's this event about?" />
          </div>
          <div>
            <label htmlFor="eventDate" className="block text-sm font-medium text-ink-primary mb-1.5">Date &amp; Time</label>
            <input type="datetime-local" id="eventDate" name="eventDate" required className="input text-base sm:text-sm" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={handleClose} className="btn-secondary btn-sm flex-1 sm:flex-none">Cancel</button>
            <button type="submit" disabled={isLoading} className="btn-primary btn-sm flex-1 sm:flex-none">
              {isLoading ? "Creating..." : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
