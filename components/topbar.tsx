"use client"
import { useEffect, useState } from "react"
import { Bell, Plus } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const PAGE_TITLES: Record<string, string> = {
  "/dashboard":                  "Dashboard",
  "/dashboard/raumplan":         "Raumplan",
  "/dashboard/reservierungen":   "Reservierungen",
  "/dashboard/kalender":         "Kalender",
  "/dashboard/auslastung":       "Auslastung",
  "/dashboard/warteliste":       "Warteliste",
  "/dashboard/wiederkehrend":    "Wiederkehrende Reservierungen",
  "/dashboard/email-center":     "E-Mail Center",
  "/dashboard/aktivitaet":       "Aktivitäts-Log",
  "/dashboard/tagesabschluss":   "Tagesabschluss",
  "/dashboard/einstellungen":    "Einstellungen",
}

const WEEKDAYS_DE = ["So.", "Mo.", "Di.", "Mi.", "Do.", "Fr.", "Sa."]
const MONTHS_DE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"]

export default function Topbar({ onNewReservation }: { onNewReservation?: () => void }) {
  const pathname = usePathname()
  const [time, setTime] = useState("")
  const [dateStr, setDateStr] = useState("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const update = () => {
      const now = new Date()
      const hh = String(now.getHours()).padStart(2, "0")
      const mm = String(now.getMinutes()).padStart(2, "0")
      const ss = String(now.getSeconds()).padStart(2, "0")
      setTime(`${hh}:${mm}:${ss}`)
      setDateStr(`${WEEKDAYS_DE[now.getDay()]} ${now.getDate()}. ${MONTHS_DE[now.getMonth()]} ${now.getFullYear()}`)
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  const title = PAGE_TITLES[pathname] || "Rondo Admin"

  return (
    <header
      className="fixed top-0 right-0 z-30 flex items-center justify-between px-6 h-14"
      style={{
        left: "220px",
        background: "rgba(10,10,10,0.92)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(201,168,76,0.1)",
      }}
    >
      {/* Page title */}
      <h1 className="text-sm font-semibold tracking-wide" style={{ color: "#f5f0e8" }}>
        {title}
      </h1>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Live clock */}
        {mounted && (
          <div className="flex flex-col items-end">
            <span className="font-mono text-base font-bold tabular-nums" style={{ color: "#c9a84c" }}>
              {time}
            </span>
            <span className="text-xs" style={{ color: "#6b6b6b" }}>{dateStr}</span>
          </div>
        )}

        {/* New reservation button */}
        <Link
          href="/dashboard/reservierungen/neu"
          onClick={onNewReservation}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
          style={{
            background: "#c9a84c",
            color: "#0a0a0a",
            boxShadow: "0 0 16px rgba(201,168,76,0.25)",
          }}
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Neue Reservierung</span>
        </Link>

        {/* Notifications */}
        <button className="relative transition-all duration-200 hover:scale-110" style={{ color: "#6b6b6b" }}>
          <Bell className="w-5 h-5" />
          <span
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs font-bold flex items-center justify-center"
            style={{ background: "#cc2222", color: "#fff" }}
          >
            3
          </span>
        </button>

        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ background: "rgba(201,168,76,0.15)", color: "#c9a84c", border: "1px solid rgba(201,168,76,0.2)" }}
        >
          AD
        </div>
      </div>
    </header>
  )
}
