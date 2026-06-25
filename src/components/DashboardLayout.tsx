"use client"

import Link from "next/link"
import EventDashboard from "./EventDashboard"
import ThemeToggle from "./ThemeToggle"

export default function DashboardLayout({ userId, userName }: { userId: string; userName: string }) {
  const initials = (userName || "U")
    .split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "U"

  return (
    <div className="h-full flex overflow-hidden bg-[var(--app-bg)]">
      {/* === ICON RAIL (desktop only) === */}
      <aside className="hidden lg:flex flex-col items-center w-[68px] shrink-0 py-4 gap-2"
        style={{ background: "var(--rail-bg)" }}>
        {/* Brand mark */}
        <div className="w-10 h-10 rounded-2xl bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-900/40 mb-3">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>

        {/* Primary nav (Chats active) */}
        <button title="Chats"
          className="w-11 h-11 rounded-2xl flex items-center justify-center bg-white/10 text-white transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
        <button title="Calendar"
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-white/55 hover:bg-white/10 hover:text-white/80 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
        <button title="Notifications"
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-white/55 hover:bg-white/10 hover:text-white/80 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7}
              d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>

        <div className="flex-1" />

        <ThemeToggle />

        <Link href="/settings" title="Settings"
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-white/55 hover:bg-white/10 hover:text-white/80 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </Link>

        {/* Profile avatar */}
        <Link href="/settings" title={userName}
          className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-semibold ring-2 ring-white/10 hover:ring-white/30 transition-all">
          {initials}
        </Link>
      </aside>

      {/* === MAIN: full-height, fills the rest === */}
      <main className="flex-1 min-w-0 flex">
        <EventDashboard userId={userId} />
      </main>
    </div>
  )
}
