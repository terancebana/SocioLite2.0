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

interface EventDashboardProps { userId: string }

export default function EventDashboard({ userId }: EventDashboardProps) {
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

  const fetchEvents = useCallback(async () => {
    try {
      const response = await fetch("/api/events")
      if (!response.ok) throw new Error("Failed to fetch events")
      const data = await response.json()
      setEvents(data)
      if (selectedEvent) {
        const updated = data.find((e: Event) => e.id === selectedEvent.id)
        if (updated) setSelectedEvent(updated)
      }
    } catch {
      setError("Failed to load events")
    } finally {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchEvents()
    const interval = setInterval(fetchEvents, 30000)
    return () => clearInterval(interval)
  }, [fetchEvents])

  useEffect(() => {
    if (selectedEvent && !events.find((e) => e.id === selectedEvent.id)) {
      setSelectedEvent(null)
    }
  }, [events, selectedEvent])

  const filtered = events.filter((e) => {
    const matchesSearch = !searchTerm || e.title.toLowerCase().includes(searchTerm.toLowerCase())
      || e.creator_name.toLowerCase().includes(searchTerm.toLowerCase())
    if (!matchesSearch) return false
    if (filter === "created") return e.creator_id === userId
    if (filter === "participating") return e.creator_id !== userId
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    const da = new Date(a.event_date).getTime(), db = new Date(b.event_date).getTime()
    const now = Date.now()
    const aFuture = da > now, bFuture = db > now
    if (aFuture !== bFuture) return aFuture ? -1 : 1
    return Math.abs(da - now) - Math.abs(db - now)
  })

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-200 border-t-brand-500" />
    </div>
  )

  if (error) return (
    <div className="card p-8 text-center">
      <p className="text-danger font-medium">{error}</p>
      <button onClick={fetchEvents} className="btn-secondary btn-sm mt-4">Retry</button>
    </div>
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Sidebar: Events List */}
      <div className="lg:col-span-1">
        <div className="sticky top-24 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between animate-fade-in">
            <div>
              <h2 className="text-lg font-semibold text-ink-primary">Events</h2>
              <p className="text-xs text-ink-muted">{events.length} total</p>
            </div>
            <button onClick={() => setIsCreateModalOpen(true)} className="btn-primary btn-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New
            </button>
          </div>

          {/* Search */}
          <div className="relative animate-fade-in animate-delay-75">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search events..." className="input pl-10 py-2 text-sm"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 p-1 bg-surface-tertiary rounded-lg animate-fade-in animate-delay-100">
            {[
              { key: "all", label: "All", count: events.length },
              { key: "created", label: "Created", count: events.filter((e) => e.creator_id === userId).length },
              { key: "participating", label: "Joined", count: events.filter((e) => e.creator_id !== userId).length },
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key as typeof filter)}
                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                  filter === key ? "bg-white text-ink-primary shadow-soft" : "text-ink-secondary hover:text-ink-primary"
                }`}
              >
                {label} <span className="opacity-50 ml-0.5">{count}</span>
              </button>
            ))}
          </div>

          {/* Event cards */}
          <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
            {sorted.length === 0 ? (
              <div className="text-center py-12 animate-fade-in">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-surface-tertiary flex items-center justify-center">
                  <svg className="w-6 h-6 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm text-ink-secondary">No events found</p>
                {searchTerm && <p className="text-xs text-ink-muted mt-1">Try a different search</p>}
              </div>
            ) : (
              sorted.map((event, i) => (
                <button
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 animate-fade-in ${
                    selectedEvent?.id === event.id
                      ? "border-brand-300 bg-brand-50/50 shadow-sm"
                      : "border-transparent bg-white hover:bg-surface-secondary hover:border-slate-200"
                  }`}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-ink-primary truncate">{event.title}</h3>
                      {event.description && (
                        <p className="text-xs text-ink-secondary mt-0.5 line-clamp-2">{event.description}</p>
                      )}
                      <p className="text-2xs text-ink-muted mt-1.5">
                        {format(new Date(event.event_date), "MMM d, yyyy · h:mm a")}
                      </p>
                    </div>
                    <span className={`badge shrink-0 ${event.creator_id === userId ? "badge-brand" : "badge-success"}`}>
                      {event.participant_count}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main: Chat */}
      <div className="lg:col-span-2">
        {selectedEvent ? (
          <div className="animate-fade-in" key={selectedEvent.id}>
            {/* Chat header */}
            <div className="flex items-center justify-between mb-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-ink-primary truncate">{selectedEvent.title}</h2>
                  {selectedEvent.creator_id === userId && (
                    <button onClick={() => setIsRenameModalOpen(true)}
                      className="btn-ghost btn-sm text-brand-600">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <p className="text-xs text-ink-secondary">
                    {format(new Date(selectedEvent.event_date), "MMM d, yyyy · h:mm a")}
                  </p>
                  <span className="text-ink-muted">·</span>
                  <button onClick={() => setIsParticipantListOpen(true)}
                    className="text-xs text-brand-600 hover:text-brand-700 font-medium">
                    {selectedEvent.participant_count} participant{selectedEvent.participant_count !== 1 ? "s" : ""}
                  </button>
                </div>
              </div>
              {selectedEvent.creator_id === userId && (
                <button onClick={() => setIsInviteModalOpen(true)} className="btn-primary btn-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Invite
                </button>
              )}
            </div>

            <ChatWindow eventId={selectedEvent.id} userId={userId} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[70vh] text-center animate-fade-in">
            <div className="w-20 h-20 rounded-3xl bg-surface-tertiary flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-ink-primary mb-2">Select an event</h3>
            <p className="text-sm text-ink-secondary max-w-xs">
              Choose an event from the sidebar to start chatting, or create a new one.
            </p>
            <button onClick={() => setIsCreateModalOpen(true)} className="btn-primary mt-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create your first event
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateEventModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onEventCreated={fetchEvents} />
      {selectedEvent && (
        <>
          <InviteParticipantModal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)}
            eventId={selectedEvent.id} onSuccess={() => { fetchEvents(); setIsInviteModalOpen(false) }} />
          <RenameEventModal isOpen={isRenameModalOpen} onClose={() => setIsRenameModalOpen(false)}
            eventId={selectedEvent.id} currentTitle={selectedEvent.title} onSuccess={fetchEvents} />
          <ParticipantListModal isOpen={isParticipantListOpen} onClose={() => setIsParticipantListOpen(false)}
            participants={selectedEvent.participants} creatorId={selectedEvent.creator_id} eventTitle={selectedEvent.title} />
        </>
      )}
    </div>
  )
}
