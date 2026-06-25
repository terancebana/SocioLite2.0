"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { io, Socket } from "socket.io-client"
import Image from "next/image"
import { toast } from "react-hot-toast"

interface Message {
  id: string; message_text: string; user_name: string; created_at: string
  user_id: string; isSystemMessage?: boolean; media_url?: string; media_type?: "image" | "video"
}

interface OnlineUser { userId: string; userName: string }
interface TypingUser { userId: string; userName: string }

export default function ChatWindow({ eventId, userId }: { eventId: string; userId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [onlineCount, setOnlineCount] = useState(0)
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const [connected, setConnected] = useState(false)
  const socketRef = useRef<Socket>()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const oldestRef = useRef<string | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  const lastEmitRef = useRef(0)

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })

  const fetchMessages = useCallback(async (before?: string) => {
    try {
      const params = new URLSearchParams({ eventId })
      if (before) params.set("before", before)
      const r = await fetch(`/api/messages?${params}`)
      if (!r.ok) throw new Error("Failed")
      const data = await r.json() as Message[]
      setLoadError("") // clear any previous error on success
      return data
    } catch {
      if (!before) setLoadError("Could not load messages. Is the database running?")
      return []
    }
  }, [eventId])

  // Initial load
  useEffect(() => {
    fetchMessages().then((msgs) => {
      setMessages(msgs)
      if (msgs.length > 0) oldestRef.current = msgs[0].created_at
      setHasMore(msgs.length === 50)
      setIsLoading(false)
      setTimeout(scrollToBottom, 100)
    })
  }, [fetchMessages])

  // Socket
  useEffect(() => {
    const socket = io("http://localhost:3001", {
      path: "/socket.io",
      reconnectionAttempts: 3,
      timeout: 5000,
    })
    socketRef.current = socket

    socket.on("connect", () => setConnected(true))
    socket.on("disconnect", () => setConnected(false))
    socket.on("connect_error", () => setConnected(false))

    socket.emit("join-event", eventId)

    socket.on("message-received", (msg: Message) => {
      setMessages((prev) => { if (prev.some((m) => m.id === msg.id)) return prev; return [...prev, msg] })
      setTimeout(scrollToBottom, 50)
    })

    socket.on("event-rename-notification", (data: { eventId: string; oldTitle: string; newTitle: string }) => {
      if (data.eventId !== eventId) return
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(), message_text: `Event renamed from "${data.oldTitle}" to "${data.newTitle}"`,
        user_name: "System", created_at: new Date().toISOString(), user_id: "system", isSystemMessage: true,
      }])
      setTimeout(scrollToBottom, 50)
    })

    socket.on("online-users", (users: OnlineUser[]) => setOnlineCount(users.filter((u) => u.userId !== userId).length))
    socket.on("user-joined", () => setOnlineCount((c) => c + 1))
    socket.on("user-left", (u: { userId: string }) => {
      setOnlineCount((c) => Math.max(0, c - 1))
      setTypingUsers((prev) => prev.filter((t) => t.userId !== u.userId))
    })
    socket.on("typing-start", (user: TypingUser) => {
      setTypingUsers((prev) => { if (prev.some((u) => u.userId === user.userId)) return prev; return [...prev, user] })
    })
    socket.on("typing-stop", (user: { userId: string }) => {
      setTypingUsers((prev) => prev.filter((u) => u.userId !== user.userId))
    })

    return () => { socket.emit("leave-event", eventId); socket.disconnect() }
  }, [eventId, userId])

  // Load more
  const handleScroll = useCallback(async () => {
    const el = containerRef.current
    if (!el || !hasMore || isLoadingMore || el.scrollTop > 50) return
    setIsLoadingMore(true)
    const prevH = el.scrollHeight
    const older = await fetchMessages(oldestRef.current!)
    if (older.length > 0) {
      setMessages((prev) => [...older, ...prev])
      oldestRef.current = older[0].created_at
      setHasMore(older.length === 50)
      requestAnimationFrame(() => { el.scrollTop = el.scrollHeight - prevH })
    } else setHasMore(false)
    setIsLoadingMore(false)
  }, [hasMore, isLoadingMore, fetchMessages])

  // Typing emitter
  const handleInput = (val: string) => {
    setNewMessage(val)
    const now = Date.now()
    if (val.trim()) {
      if (now - lastEmitRef.current > 2000) { socketRef.current?.emit("typing-start", eventId); lastEmitRef.current = now }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = setTimeout(() => socketRef.current?.emit("typing-stop", eventId), 4000)
    } else {
      socketRef.current?.emit("typing-stop", eventId)
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || isSending) return
    setIsSending(true)
    try {
      const r = await fetch("/api/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, message: newMessage }),
      })
      if (!r.ok) {
        const errData = await r.json().catch(() => ({}))
        throw new Error(errData.error || "Failed to send")
      }
      socketRef.current?.emit("typing-stop", eventId)
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      const d = await r.json()
      const msg: Message = { id: d.messageId, message_text: newMessage, user_id: userId, created_at: d.createdAt, user_name: d.userName }
      setMessages((prev) => [...prev, msg])
      socketRef.current?.emit("new-message", { ...msg, eventId })
      setNewMessage("")
      scrollToBottom()
      inputRef.current?.focus()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send message")
    } finally {
      setIsSending(false)
    }
  }

  async function handleFileUpload(file: File) {
    setIsUploading(true)
    try {
      const fd = new FormData(); fd.append("file", file)
      const up = await fetch("/api/messages/upload", { method: "POST", body: fd })
      if (!up.ok) throw new Error("Upload failed")
      const { url, type } = await up.json()
      const r = await fetch("/api/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, mediaUrl: url, mediaType: type }),
      })
      if (!r.ok) throw new Error("Failed")
      const d = await r.json()
      const msg: Message = { id: d.messageId, user_id: userId, created_at: d.createdAt, user_name: d.userName, media_url: url, media_type: type, message_text: "" }
      setMessages((prev) => [...prev, msg])
      socketRef.current?.emit("new-message", { ...msg, eventId })
      scrollToBottom()
    } catch {
      toast.error("Failed to upload file")
    } finally {
      setIsUploading(false)
    }
  }

  const typingText = (() => {
    const others = typingUsers.filter((u) => u.userId !== userId)
    if (!others.length) return null
    if (others.length === 1) return `${others[0].userName} is typing`
    if (others.length === 2) return `${others[0].userName} and ${others[1].userName} are typing`
    return `${others[0].userName} and ${others.length - 1} others are typing`
  })()

  // Stable per-sender name color (for "them" bubbles)
  const NAME_COLORS = ["#6366f1", "#0891b2", "#059669", "#e11d48", "#7c3aed", "#ea580c", "#0284c7"]
  const nameColor = (name: string) =>
    NAME_COLORS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % NAME_COLORS.length]

  if (isLoading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-200 border-t-brand-500" />
    </div>
  )

  if (loadError && messages.length === 0) return (
    <div className="flex flex-col items-center justify-center h-full gap-3 px-4">
      <div className="w-12 h-12 rounded-full bg-danger-light flex items-center justify-center">
        <svg className="w-6 h-6 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="text-sm text-[var(--text-secondary)] text-center">{loadError}</p>
      <button onClick={() => { setLoadError(""); setIsLoading(true); fetchMessages().then((msgs) => { setMessages(msgs); setIsLoading(false); setTimeout(scrollToBottom, 100); }) }} className="btn-secondary btn-sm">Retry</button>
    </div>
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header — hidden on desktop (shown in parent) */}
      <div className="lg:hidden flex items-center justify-between px-4 py-2.5 border-b border-[var(--panel-border)] bg-[var(--list-bg)] shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${connected ? "bg-emerald-400 shadow-emerald-400/30" : "bg-[var(--text-muted)]"}`} />
            {connected && onlineCount > 0 && <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping opacity-40" />}
          </div>
          <span className="text-sm font-medium text-[var(--text-primary)]">
            {!connected ? "Connecting..." : onlineCount > 0 ? `${onlineCount} online` : "Chat"}
          </span>
        </div>
        {!connected && (
          <span className="text-xs text-warning-dark bg-warning-light px-2 py-0.5 rounded-full">Live offline</span>
        )}
      </div>

      {/* Messages */}
      <div ref={containerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto py-3 space-y-2.5 wa-wallpaper">
        {isLoadingMore && (
          <div className="text-center py-2">
            <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-brand-200 border-t-brand-500" />
          </div>
        )}
        {hasMore && !isLoadingMore && messages.length >= 50 && (
          <div className="text-center">
            <span className="text-xs text-[var(--text-muted)] bg-[var(--system-bubble-bg)] px-3 py-1 rounded-full">Scroll up to load more</span>
          </div>
        )}

        {messages.length === 0 && !isLoadingMore && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2">
            <div className="w-12 h-12 rounded-full bg-[var(--search-bg)] flex items-center justify-center">
              <svg className="w-6 h-6 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">No messages yet</p>
            <p className="text-xs text-[var(--text-muted)]">Be the first to say something!</p>
          </div>
        )}

        <div className="px-[7%] space-y-2.5">
          {messages.map((msg, i) => {
            const isMe = msg.user_id === userId
            const isSystem = msg.isSystemMessage
            return (
              <div key={msg.id} className={`flex flex-col ${isSystem ? "items-center" : isMe ? "items-end" : "items-start"} animate-fade-in`}
                style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}>
                {isSystem ? (
                  <span className="text-xs text-[var(--system-bubble-text)] bg-[var(--system-bubble-bg)] px-3 py-1 rounded-full shadow-soft">{msg.message_text}</span>
                ) : (
                  <div className={`max-w-[85%] sm:max-w-[75%] ${isMe ? "order-1" : ""}`}>
                    {!isMe && <p className="text-xs font-semibold mb-0.5 ml-3" style={{ color: nameColor(msg.user_name) }}>{msg.user_name}</p>}
                    <div className={`rounded-lg px-3 py-2 text-sm leading-relaxed shadow-message ${
                      isMe
                        ? "bg-[var(--bubble-me-bg)] text-[var(--bubble-me-text)] rounded-br-[3px]"
                        : "bg-[var(--bubble-them-bg)] text-[var(--bubble-them-text)] border border-[var(--bubble-them-border)] rounded-bl-[3px]"
                    }`}>
                      {msg.message_text && <p className="break-words whitespace-pre-wrap">{msg.message_text}</p>}
                      {msg.media_url && (
                        <div className="mt-1.5 -mx-1 -mb-1">
                          {msg.media_type === "image" ? (
                            <Image src={msg.media_url} alt="Shared" width={400} height={250}
                              className="rounded-lg max-w-full cursor-pointer hover:opacity-95 transition-opacity"
                              onClick={() => window.open(msg.media_url, "_blank")} />
                          ) : (
                            <video src={msg.media_url} controls className="rounded-lg max-w-full max-h-64" />
                          )}
                        </div>
                      )}
                    </div>
                    <p className={`text-2xs mt-0.5 flex items-center gap-1 ${isMe ? "justify-end mr-3 text-[var(--text-muted)]" : "ml-3 text-[var(--text-muted)]"}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      {isMe && (
                        <svg className="w-3 h-3 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </p>
                  </div>
                )}
              </div>
            )
          })}

          {typingText && (
            <div className="flex items-start animate-fade-in">
              <div className="bg-[var(--bubble-them-bg)] border border-[var(--bubble-them-border)] rounded-lg rounded-bl-[3px] px-3 py-2.5 shadow-message">
                <span className="inline-flex gap-1">
                  <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                </span>
              </div>
              <span className="text-xs text-[var(--text-muted)] ml-2 self-center">{typingText}</span>
            </div>
          )}
        </div>

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="px-3 sm:px-4 py-2.5 border-t border-[var(--panel-border)] bg-[var(--list-bg)] flex items-end gap-2 shrink-0">
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f) }} />
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isSending || isUploading}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-brand-500 hover:bg-[var(--row-hover)] transition-colors shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
        <div className="flex-1 relative">
          <input ref={inputRef} type="text" value={newMessage} onChange={(e) => handleInput(e.target.value)}
            placeholder="Type a message..." disabled={isSending || isUploading}
            enterKeyHint="send"
            className="w-full px-4 py-2.5 bg-[var(--search-bg)] border border-[var(--panel-border)] rounded-2xl text-sm
                       text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
                       focus:outline-none focus:ring-2 focus:ring-brand-500/30
                       disabled:opacity-50 transition-all duration-200" />
        </div>
        <button type="submit" disabled={isSending || isUploading || !newMessage.trim()}
          className="w-11 h-11 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white flex items-center justify-center shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0">
          {isSending || isUploading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </form>
    </div>
  )
}
