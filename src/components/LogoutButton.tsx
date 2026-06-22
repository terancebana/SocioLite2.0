"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

export default function LogoutButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => { if (showConfirm) requestAnimationFrame(() => setIsVisible(true)); else setIsVisible(false) }, [showConfirm])
  const close = () => { setIsVisible(false); setTimeout(() => setShowConfirm(false), 200) }

  async function handleLogout() {
    setIsLoading(true)
    try { await fetch("/api/auth/logout", { method: "POST" }); router.refresh(); router.push("/login") }
    catch { setIsLoading(false) }
  }

  return (
    <>
      <button onClick={() => setShowConfirm(true)} className="btn-ghost btn-sm text-ink-secondary w-full justify-start sm:w-auto">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span>Logout</span>
      </button>

      {showConfirm && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-colors duration-200 ${isVisible ? "bg-black/50" : "bg-transparent"}`} onClick={close}>
          <div className={`card p-6 w-full sm:max-w-sm transition-all duration-200 ${isVisible ? "modal-content" : "opacity-0 scale-95"}`} onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-ink-primary mb-2">Confirm Logout</h2>
            <p className="text-sm text-ink-secondary mb-6">Are you sure you want to log out?</p>
            <div className="flex gap-3">
              <button onClick={close} className="btn-secondary btn-sm flex-1">Cancel</button>
              <button onClick={handleLogout} disabled={isLoading} className="btn-danger btn-sm flex-1">
                {isLoading ? "Logging out..." : "Logout"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
