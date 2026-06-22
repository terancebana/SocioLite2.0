import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import LoginForm from "@/components/LoginForm"

export default async function LoginPage() {
  const session = await auth()
  if (session) redirect("/")

  return (
    <main className="min-h-[100dvh] flex flex-col lg:flex-row">
      {/* Brand panel — hidden on mobile, visible on desktop */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-brand-400/20 rounded-full blur-3xl" />
        </div>
        <div className="max-w-md text-white relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <span className="text-2xl font-bold tracking-tight">SocioLite</span>
          </div>
          <h1 className="text-4xl font-extrabold mb-4 leading-tight">
            Chat with your<br />people, in real&nbsp;time.
          </h1>
          <p className="text-brand-200 text-lg leading-relaxed">
            SocioLite brings your events to life with instant messaging,
            media sharing, and live presence — all in one beautiful space.
          </p>
          <div className="mt-10 flex gap-2">
            <div className="w-2 h-2 rounded-full bg-white/60" />
            <div className="w-2 h-2 rounded-full bg-white/30" />
            <div className="w-2 h-2 rounded-full bg-white/10" />
          </div>
        </div>
      </div>

      {/* Form — full width on mobile, half on desktop */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 sm:px-12 lg:px-16 bg-surface">
        {/* Mobile-only brand header */}
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center shadow-sm shadow-brand-500/25">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-ink-primary tracking-tight">SocioLite</span>
        </div>

        <div className="w-full max-w-sm">
          <LoginForm />
        </div>
      </div>
    </main>
  )
}
