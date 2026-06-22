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
    <div className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center transition-colors duration-200 ${isVisible ? "bg-black/50" : "bg-transparent"}`} onClick={handleClose}>
      <div className={`card p-6 w-full sm:max-w-sm transition-all duration-200 sm:rounded-2xl rounded-t-2xl max-h-[80dvh] flex flex-col ${isVisible ? "modal-content" : "opacity-0 translate-y-8"}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-ink-primary">Participants</h2>
            <p className="text-xs text-ink-muted truncate max-w-[200px]">{eventTitle}</p>
          </div>
          <button onClick={handleClose} className="btn-ghost btn-icon btn-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="relative mb-3 shrink-0">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="input pl-10 py-2.5 text-base sm:text-sm" />
        </div>
        <div className="flex-1 overflow-y-auto space-y-1 -mx-1 px-1">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-ink-muted py-8">No participants found</p>
          ) : (
            filtered.map((p, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-surface-secondary active:bg-surface-tertiary transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-sm font-semibold text-brand-600 shrink-0">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-primary truncate">{p.name}</p>
                    <p className="text-xs text-ink-muted truncate">{p.email}</p>
                  </div>
                </div>
                {p.email === creatorId && <span className="badge badge-brand text-2xs shrink-0">Host</span>}
              </div>
            ))
          )}
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between shrink-0">
          <p className="text-xs text-ink-muted">{filtered.length} person{filtered.length !== 1 ? "s" : ""}</p>
          <button onClick={handleClose} className="btn-secondary btn-sm">Close</button>
        </div>
      </div>
    </div>
  )
}
