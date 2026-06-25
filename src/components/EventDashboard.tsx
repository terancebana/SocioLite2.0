"use client"

import { useState, useEffect, useCallback } from "react"
import { format } from "date-fns"
import ChatWindow from "./ChatWindow"
import CreateEventModal from "./CreateEventModal"
import InviteParticipantModal from "./InviteParticipantModal"
import RenameEventModal from "./RenameEventModal"
import ParticipantListModal from "./ParticipantListModal"

interface Participant { name: string; email: string }
interface Event {
  id: string; title: string; description: string; event_date: string
  creator_id: string; creator_name: string; participant_count: number
  participants: Participant[]
}

// Deterministic per-event gradient + monogram (stable colors, used by rail rows)
const GRADIENTS = [
  "linear-gradient(135deg,#818cf8,#6366f1)",
  "linear-gradient(135deg,#34d399,#059669)",
  "linear-gradient(135deg,#f472b6,#e11d48)",
  "linear-gradient(135deg,#fbbf24,#f97316)",
  "linear-gradient(135deg,#22d3ee,#0891b2)",
  "linear-gradient(135deg,#c084fc,#7c3aed)",
]
const gradFor = (id: string) =>
  GRADIENTS[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % GRADIENTS.length]
const monogram = (t: string) =>
  (t.split(" ").slice(0, 2).map((w) => w[0]).join("") || "?").toUpperCase()

export default function EventDashboard({ userId }: { userId: string }) {
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false)
  const [isParticipantListOpen, setIsParticipantListOpen] = useState(false)
  const [filter, setFilter] = useState<"all" | "created" | "participating">("all")
  const [searchTerm, setSearchTerm] = useState("")
  // Mobile: which view is shown
  const [mobileView, setMobileView] = useState<"list" | "chat">("list")

  const fetchEvents = useCallback(async () => {
    try {
      const r = await fetch("/api/events")
      if (!r.ok) throw new Error("Failed")
      const data = await r.json()
      setEvents(data)
      if (selectedEvent) {
        const u = data.find((e: Event) => e.id === selectedEvent.id)
        if (u) setSelectedEvent(u)
      }
    } catch { setError("Failed to load events") }
    finally { setIsLoading(false) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { fetchEvents(); const i = setInterval(fetchEvents, 30000); return () => clearInterval(i) }, [fetchEvents])
  useEffect(() => { if (selectedEvent && !events.find((e) => e.id === selectedEvent.id)) setSelectedEvent(null) }, [events, selectedEvent])

  const filtered = events.filter((e) => {
    const ms = !searchTerm || e.title.toLowerCase().includes(searchTerm.toLowerCase()) || e.creator_name.toLowerCase().includes(searchTerm.toLowerCase())
    if (!ms) return false
    if (filter === "created") return e.creator_id === userId
    if (filter === "participating") return e.creator_id !== userId
    return true
  })
  const sorted = [...filtered].sort((a, b) => {
    const da = new Date(a.event_date).getTime(), db = new Date(b.event_date).getTime(), now = Date.now()
    const aF = da > now, bF = db > now
    if (aF !== bF) return aF ? -1 : 1
    return Math.abs(da - now) - Math.abs(db - now)
  })

  const selectEvent = (event: Event) => {
    setSelectedEvent(event)
    if (window.innerWidth < 1024) setMobileView("chat")
  }

  const handleEventCreated = () => { fetchEvents(); setIsCreateModalOpen(false) }
  const handleInviteSuccess = () => { fetchEvents(); setIsInviteModalOpen(false) }

  // === SIDEBAR (event list) ===
  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--panel-border)]">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Events</h2>
          <p className="text-2xs text-[var(--text-muted)]">{events.length} total</p>
        </div>
        <button onClick={() => setIsCreateModalOpen(true)}
          className="w-9 h-9 rounded-xl bg-brand-500 hover:bg-brand-600 text-white flex items-center justify-center shadow-sm transition-colors"
          title="Create event">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      <div className="px-3 py-3 space-y-3 border-b border-[var(--panel-border)]">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search events"
            className="w-full pl-10 pr-3 py-2 text-sm rounded-xl border-none outline-none bg-[var(--search-bg)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-brand-500/30 transition-all" />
        </div>

        <div className="flex gap-1 p-1 bg-[var(--search-bg)] rounded-xl">
          {[
            { k: "all", l: "All", n: events.length },
            { k: "created", l: "Created", n: events.filter((e) => e.creator_id === userId).length },
            { k: "participating", l: "Joined", n: events.filter((e) => e.creator_id !== userId).length },
          ].map(({ k, l, n }) => (
            <button key={k} onClick={() => setFilter(k as typeof filter)}
              className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-lg transition-all ${filter === k ? "bg-[var(--list-bg)] text-[var(--text-primary)] shadow-soft" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}>
              {l} <span className="opacity-50 ml-0.5">{n}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {sorted.length === 0 ? (
          <div className="text-center py-10 px-4">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-[var(--search-bg)] flex items-center justify-center">
              <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">No events</p>
            {searchTerm && <p className="text-xs text-[var(--text-muted)] mt-0.5">Try a different search</p>}
          </div>
        ) : (
          sorted.map((event) => {
            const selected = selectedEvent?.id === event.id
            const preview = (event.description || format(new Date(event.event_date), "MMM d · h:mm a")).slice(0, 40)
            return (
              <button key={event.id} onClick={() => selectEvent(event)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${selected ? "bg-[var(--row-selected)]" : "hover:bg-[var(--row-hover)]"}`}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
                  style={{ background: gradFor(event.id) }}>
                  {monogram(event.title)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={`text-sm font-semibold truncate ${selected ? "text-[var(--accent-text)]" : "text-[var(--text-primary)]"}`}>{event.title}</h3>
                    <span className="text-2xs text-[var(--text-muted)] shrink-0">{format(new Date(event.event_date), "MMM d")}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className="text-xs text-[var(--text-secondary)] truncate">{preview}</p>
                    <span className="badge badge-brand shrink-0 text-2xs">{event.participant_count}</span>
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )

  // === CHAT VIEW (with header) ===
  const chatView = selectedEvent ? (
    <div className="flex flex-col h-full">
      {/* Chat header bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--panel-border)] bg-[var(--list-bg)] shrink-0">
        <button onClick={() => { setMobileView("list"); setSelectedEvent(null) }}
          className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--row-hover)] -ml-1 shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
          style={{ background: gradFor(selectedEvent.id) }}>
          {monogram(selectedEvent.title)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] truncate">{selectedEvent.title}</h2>
            {selectedEvent.creator_id === userId && (
              <button onClick={() => setIsRenameModalOpen(true)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-brand-500 hover:bg-[var(--row-hover)] shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <button onClick={() => setIsParticipantListOpen(true)} className="hover:text-[var(--text-secondary)] transition-colors">
              {selectedEvent.participant_count} members
            </button>
            <span>·</span>
            <span>{format(new Date(selectedEvent.event_date), "MMM d")}</span>
          </div>
        </div>
        {selectedEvent.creator_id === userId && (
          <button onClick={() => setIsInviteModalOpen(true)} className="btn-primary btn-sm shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <span className="hidden sm:inline">Invite</span>
          </button>
        )}
      </div>
      <div className="flex-1 min-h-0">
        <ChatWindow eventId={selectedEvent.id} userId={userId} />
      </div>
    </div>
  ) : null

  // === EMPTY STATE ===
  const emptyState = (
    <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-[var(--search-bg)] flex items-center justify-center mb-4 sm:mb-6">
        <svg className="w-8 h-8 sm:w-10 sm:h-10 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] mb-1">Select an event</h3>
      <p className="text-sm text-[var(--text-secondary)] max-w-xs">Choose an event from the list or create a new one to start chatting.</p>
      <button onClick={() => setIsCreateModalOpen(true)} className="btn-primary mt-5">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Create event
      </button>
    </div>
  )

  if (isLoading) return (
    <div className="flex items-center justify-center h-full w-full">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-200 border-t-brand-500" />
    </div>
  )
  if (error) return (
    <div className="flex items-center justify-center h-full w-full p-4">
      <div className="card p-8 text-center">
        <p className="text-danger font-medium">{error}</p>
        <button onClick={fetchEvents} className="btn-secondary btn-sm mt-4">Retry</button>
      </div>
    </div>
  )

  return (
    <>
      {/* === DESKTOP: rail already rendered by DashboardLayout; list column + chat pane === */}
      <div className="hidden lg:flex h-full w-full">
        <div className="w-[360px] shrink-0 overflow-hidden flex flex-col border-r border-[var(--panel-border)] bg-[var(--list-bg)]">
          {sidebar}
        </div>
        <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
          {selectedEvent ? chatView : emptyState}
        </div>
      </div>

      {/* === MOBILE: slide between views === */}
      <div className="lg:hidden flex flex-col h-full w-full">
        {mobileView === "list" && (
          <div className="flex-1 overflow-hidden bg-[var(--list-bg)]">{sidebar}</div>
        )}
        {mobileView === "chat" && selectedEvent && (
          <div className="flex-1 flex flex-col min-h-0 bg-[var(--list-bg)]">{chatView}</div>
        )}
      </div>

      {/* === BOTTOM BAR (mobile only) === */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[var(--list-bg)]/90 backdrop-blur-lg border-t border-[var(--panel-border)] safe-bottom z-40">
        <div className="flex items-center justify-around h-14 px-2">
          <button onClick={() => { setMobileView("list"); setSelectedEvent(null) }}
            className={`flex flex-col items-center justify-center gap-0.5 px-4 py-1 rounded-xl transition-colors ${mobileView === "list" ? "text-brand-600" : "text-[var(--text-muted)]"}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="text-2xs font-medium">Events</span>
          </button>
          <button onClick={() => setIsCreateModalOpen(true)}
            className="flex flex-col items-center justify-center -mt-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-500 shadow-lg shadow-brand-500/30 flex items-center justify-center text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </button>
          <button onClick={() => selectedEvent ? setMobileView("chat") : null}
            className={`flex flex-col items-center justify-center gap-0.5 px-4 py-1 rounded-xl transition-colors ${mobileView === "chat" ? "text-brand-600" : "text-[var(--text-muted)]"}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-2xs font-medium">Chat</span>
          </button>
        </div>
      </div>

      {/* Modals */}
      <CreateEventModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onEventCreated={handleEventCreated} />
      {selectedEvent && (
        <>
          <InviteParticipantModal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} eventId={selectedEvent.id} onSuccess={handleInviteSuccess} />
          <RenameEventModal isOpen={isRenameModalOpen} onClose={() => setIsRenameModalOpen(false)} eventId={selectedEvent.id} currentTitle={selectedEvent.title} onSuccess={fetchEvents} />
          <ParticipantListModal isOpen={isParticipantListOpen} onClose={() => setIsParticipantListOpen(false)} participants={selectedEvent.participants} creatorId={selectedEvent.creator_id} eventTitle={selectedEvent.title} />
        </>
      )}
    </>
  )
}
