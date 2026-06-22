import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import RegisterForm from "@/components/RegisterForm"

export default async function RegisterPage() {
  const session = await auth()
  if (session) redirect("/")

  return (
    <main className="min-h-[100dvh] flex flex-col lg:flex-row">
      {/* Brand panel */}
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
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <span className="text-2xl font-bold tracking-tight">SocioLite</span>
          </div>
          <h1 className="text-4xl font-extrabold mb-4 leading-tight">
            Join the<br />conversation.
          </h1>
          <p className="text-brand-200 text-lg leading-relaxed">
            Create an account to start chatting, share media, and connect
            with your event community in real time.
          </p>
          <div className="mt-10 flex gap-2">
            <div className="w-2 h-2 rounded-full bg-white/60" />
            <div className="w-2 h-2 rounded-full bg-white/30" />
            <div className="w-2 h-2 rounded-full bg-white/10" />
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 sm:px-12 lg:px-16 bg-surface">
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center shadow-sm shadow-brand-500/25">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-ink-primary tracking-tight">SocioLite</span>
        </div>

        <div className="w-full max-w-sm">
          <RegisterForm />
        </div>
      </div>
    </main>
  )
}
