import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import RegisterForm from "@/components/RegisterForm"

export default async function RegisterPage() {
  const session = await auth()
  if (session) redirect("/")

  return (
    <main className="min-h-screen flex">
      {/* Left: Brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 items-center justify-center p-12">
        <div className="max-w-md text-white">
          <h1 className="text-4xl font-extrabold mb-4 leading-tight">
            Join the<br />conversation.
          </h1>
          <p className="text-brand-200 text-lg leading-relaxed">
            Create an account to start chatting, share media, and connect
            with your event community in real time.
          </p>
          <div className="mt-8 flex gap-3">
            <div className="w-3 h-3 rounded-full bg-white/60" />
            <div className="w-3 h-3 rounded-full bg-white/40" />
            <div className="w-3 h-3 rounded-full bg-white/20" />
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-surface">
        <div className="w-full max-w-sm">
          <RegisterForm />
        </div>
      </div>
    </main>
  )
}
