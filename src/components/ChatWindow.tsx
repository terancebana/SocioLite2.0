"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { io, Socket } from "socket.io-client"
import Image from "next/image"

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
  const [error, setError] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [onlineCount, setOnlineCount] = useState(0)
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
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
      return await r.json() as Message[]
    } catch { setError("Failed to load messages"); return [] }
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
    const socket = io("http://localhost:3001", { path: "/socket.io" })
    socketRef.current = socket
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
      if (!r.ok) throw new Error("Failed")
      socketRef.current?.emit("typing-stop", eventId)
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      const d = await r.json()
      const msg: Message = { id: d.messageId, message_text: newMessage, user_id: userId, created_at: d.createdAt, user_name: d.userName }
      setMessages((prev) => [...prev, msg])
      socketRef.current?.emit("new-message", { ...msg, eventId })
      setNewMessage(""); scrollToBottom(); inputRef.current?.focus()
    } catch { setError("Failed to send") }
    finally { setIsSending(false) }
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
    } catch { setError("Upload failed") }
    finally { setIsUploading(false) }
  }

  const typingText = (() => {
    const others = typingUsers.filter((u) => u.userId !== userId)
    if (!others.length) return null
    if (others.length === 1) return `${others[0].userName} is typing`
    if (others.length === 2) return `${others[0].userName} and ${others[1].userName} are typing`
    return `${others[0].userName} and ${others.length - 1} others are typing`
  })()

  if (isLoading) return <div className="card flex items-center justify-center h-[500px]"><div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-200 border-t-brand-500" /></div>
  if (error) return <div className="card flex items-center justify-center h-[500px]"><p className="text-danger font-medium">{error}</p></div>

  return (
    <div className="card flex flex-col h-[500px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-surface-secondary/50">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/30" />
            {onlineCount > 0 && <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping opacity-40" />}
          </div>
          <span className="text-sm font-medium text-ink-primary">
            {onlineCount > 0 ? `${onlineCount} online` : "Chat"}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div ref={containerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-surface">
        {isLoadingMore && (
          <div className="text-center py-2">
            <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-brand-200 border-t-brand-500" />
          </div>
        )}
        {hasMore && !isLoadingMore && messages.length >= 50 && (
          <div className="text-center">
            <span className="text-xs text-ink-muted bg-surface-secondary px-3 py-1 rounded-full">Scroll up to load more</span>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMe = msg.user_id === userId
          const isSystem = msg.isSystemMessage
          return (
            <div key={msg.id} className={`flex flex-col ${isSystem ? "items-center" : isMe ? "items-end" : "items-start"} msg-enter`}
              style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}>
              {isSystem ? (
                <span className="text-xs text-ink-muted bg-surface-tertiary px-3 py-1 rounded-full">{msg.message_text}</span>
              ) : (
                <div className={`max-w-[75%] ${isMe ? "order-1" : ""}`}>
                  {!isMe && <p className="text-xs font-semibold text-brand-600 mb-0.5 ml-1">{msg.user_name}</p>}
                  <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-message ${
                    isMe ? "bg-brand-500 text-white rounded-br-md" : "bg-surface-secondary text-ink-primary rounded-bl-md border border-slate-100"
                  }`}>
                    {msg.message_text && <p className="break-words whitespace-pre-wrap">{msg.message_text}</p>}
                    {msg.media_url && (
                      <div className="mt-1.5 -mx-1 -mb-1">
                        {msg.media_type === "image" ? (
                          <Image src={msg.media_url} alt="Shared" width={400} height={250}
                            className="rounded-xl max-w-full cursor-pointer hover:opacity-95 transition-opacity"
                            onClick={() => window.open(msg.media_url, "_blank")} />
                        ) : (
                          <video src={msg.media_url} controls className="rounded-xl max-w-full max-h-64" />
                        )}
                      </div>
                    )}
                  </div>
                  <p className={`text-2xs mt-0.5 ${isMe ? "text-right mr-1" : "ml-1"} text-ink-muted`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              )}
            </div>
          )
        })}

        {/* Typing indicator */}
        {typingText && (
          <div className="flex items-start msg-enter">
            <div className="bg-surface-secondary border border-slate-100 rounded-2xl rounded-bl-md px-4 py-2.5">
              <p className="text-sm text-ink-secondary italic flex items-center gap-1">
                {typingText}
                <span className="inline-flex gap-0.5 ml-1">
                  <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                </span>
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-slate-100 bg-surface-secondary/50 flex items-end gap-2">
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f) }} />
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isSending || isUploading}
          className="btn-ghost btn-icon shrink-0 text-ink-muted hover:text-brand-500">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
        <div className="flex-1 relative">
          <input ref={inputRef} type="text" value={newMessage} onChange={(e) => handleInput(e.target.value)}
            placeholder="Type a message..." disabled={isSending || isUploading}
            className="w-full px-4 py-2.5 pr-12 bg-white border border-slate-200 rounded-2xl text-sm
                       focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400
                       placeholder:text-ink-muted disabled:opacity-50 transition-all duration-200" />
        </div>
        <button type="submit" disabled={isSending || isUploading || !newMessage.trim()}
          className="btn-primary btn-icon shrink-0 rounded-2xl w-10 h-10">
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
