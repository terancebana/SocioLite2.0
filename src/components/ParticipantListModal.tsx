"use client"

import { useState, useEffect } from "react"

interface Participant { name: string; email: string }
interface Props { isOpen: boolean; onClose: () => void; participants: Participant[]; creatorId: string; eventTitle: string }

export default function ParticipantListModal({ isOpen, onClose, participants, creatorId, eventTitle }: Props) {
  const [search, setSearch] = useState("")
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => { if (isOpen) requestAnimationFrame(() => setIsVisible(true)); else setIsVisible(false) }, [isOpen])

  const handleClose = () => { setIsVisible(false); setTimeout(onClose, 200) }
  if (!isOpen) return null

  const filtered = participants.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-colors duration-200 ${isVisible ? "bg-black/50" : "bg-transparent"}`} onClick={handleClose}>
      <div className={`card p-6 w-full max-w-sm transition-all duration-200 ${isVisible ? "modal-content" : "opacity-0 scale-95"}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-ink-primary">Participants</h2>
            <p className="text-xs text-ink-muted">{eventTitle}</p>
          </div>
          <button onClick={handleClose} className="btn-ghost btn-icon btn-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="relative mb-4">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="input pl-10 py-2 text-sm" />
        </div>
        <div className="max-h-64 overflow-y-auto space-y-1">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-ink-muted py-6">No participants found</p>
          ) : (
            filtered.map((p, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-secondary transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-xs font-semibold text-brand-600">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink-primary">{p.name}</p>
                    <p className="text-xs text-ink-muted">{p.email}</p>
                  </div>
                </div>
                {p.email === creatorId && <span className="badge badge-brand text-2xs">Host</span>}
              </div>
            ))
          )}
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-ink-muted">{filtered.length} participant{filtered.length !== 1 ? "s" : ""}</p>
          <button onClick={handleClose} className="btn-secondary btn-sm">Close</button>
        </div>
      </div>
    </div>
  )
}
