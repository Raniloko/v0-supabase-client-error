"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Eye, EyeOff, Lock, Mail } from "lucide-react"

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)
    setLoading(true)

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwörter stimmen nicht überein")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Passwort muss mindestens 6 Zeichen lang sein")
      setLoading(false)
      return
    }

    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/login`,
      },
    })

    if (signupError) {
      setError(signupError.message || "Registrierung fehlgeschlagen. Bitte versuchen Sie es später erneut.")
      setLoading(false)
    } else {
      setSuccess(true)
      setEmail("")
      setPassword("")
      setConfirmPassword("")
      setLoading(false)
      // Redirect to login after a short delay
      setTimeout(() => router.push("/auth/login"), 2000)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#0a0a0a" }}
    >
      {/* Background glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(201,168,76,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-10">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center font-display text-3xl"
            style={{
              background: "#c9a84c",
              color: "#0a0a0a",
              boxShadow: "0 0 32px rgba(201,168,76,0.3)",
            }}
          >
            R
          </div>
          <div className="text-center">
            <h1 className="font-display text-2xl tracking-widest" style={{ color: "#f5f0e8" }}>RONDO</h1>
            <p className="text-sm" style={{ color: "#6b6b6b" }}>Admin Panel · Hanau</p>
          </div>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSignup}
          className="glass-card rounded-2xl p-8 flex flex-col gap-5"
        >
          <div>
            <h2 className="text-lg font-semibold" style={{ color: "#f5f0e8" }}>Registrieren</h2>
            <p className="text-sm mt-1" style={{ color: "#6b6b6b" }}>Admin-Konto erstellen</p>
          </div>

          {error && (
            <div
              className="rounded-lg px-4 py-3 text-sm"
              style={{ background: "rgba(204,34,34,0.12)", border: "1px solid rgba(204,34,34,0.3)", color: "#f87171" }}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              className="rounded-lg px-4 py-3 text-sm"
              style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", color: "#86efac" }}
            >
              Registrierung erfolgreich! Weitergeleitet zum Anmelden...
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "#9a9a9a" }}>E-Mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#6b6b6b" }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@rondo-hanau.de"
                  className="w-full rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none transition-all"
                  style={{
                    background: "#111111",
                    border: "1px solid rgba(201,168,76,0.15)",
                    color: "#f5f0e8",
                  }}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "#9a9a9a" }}>Passwort</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#6b6b6b" }} />
                <input
                  type={showPw ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg pl-10 pr-10 py-2.5 text-sm outline-none transition-all"
                  style={{
                    background: "#111111",
                    border: "1px solid rgba(201,168,76,0.15)",
                    color: "#f5f0e8",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "#6b6b6b" }}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "#9a9a9a" }}>Passwort bestätigen</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#6b6b6b" }} />
                <input
                  type={showConfirmPw ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg pl-10 pr-10 py-2.5 text-sm outline-none transition-all"
                  style={{
                    background: "#111111",
                    border: "1px solid rgba(201,168,76,0.15)",
                    color: "#f5f0e8",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw(!showConfirmPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "#6b6b6b" }}
                >
                  {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-[1.02] disabled:opacity-60 disabled:scale-100 mt-2"
            style={{
              background: "#c9a84c",
              color: "#0a0a0a",
              boxShadow: "0 0 20px rgba(201,168,76,0.2)",
            }}
          >
            {loading ? "Registrieren..." : "Registrieren"}
          </button>

          <div className="text-center text-xs" style={{ color: "#6b6b6b" }}>
            Bereits Konto vorhanden?{" "}
            <a href="/auth/login" className="hover:underline" style={{ color: "#c9a84c" }}>
              Anmelden
            </a>
          </div>
        </form>

        <p className="text-center text-xs mt-6" style={{ color: "#3a3a3a" }}>
          Rondo Sportsbar Hanau · Internes System
        </p>
      </div>
    </div>
  )
}
