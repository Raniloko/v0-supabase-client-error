"use client"
import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Reservation } from "@/lib/types"
import { Users, CalendarCheck, AlertCircle, XCircle, TrendingUp } from "lucide-react"
import Link from "next/link"

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (target === 0) { setValue(0); return }
    const start = Date.now()
    const raf = (cb: () => void) => requestAnimationFrame(cb)
    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      setValue(Math.round(progress * target))
      if (progress < 1) raf(tick)
    }
    raf(tick)
  }, [target, duration])
  return value
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: "#c9a84c",
  occupied:  "#2a9d5c",
  cancelled: "#cc2222",
  completed: "#6b6b6b",
  waitlist:  "#d4892a",
}
const STATUS_LABELS: Record<string, string> = {
  confirmed: "Bestätigt",
  occupied:  "Anwesend",
  cancelled: "Storniert",
  completed: "Abgeschlossen",
  waitlist:  "Warteliste",
}

const WEEKDAYS_DE = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"]
const MONTHS_DE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"]

export default function DashboardPage() {
  const supabase = createClient()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const today = new Date()
  const todayStr = today.toISOString().split("T")[0]

  const fetchReservations = async () => {
    const { data } = await supabase
      .from("reservations")
      .select("*, table:tables(*), area:areas(*)")
      .eq("reservation_date", todayStr)
      .order("start_time", { ascending: true })
    setReservations((data as Reservation[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchReservations()
    const channel = supabase
      .channel("dashboard-reservations")
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, fetchReservations)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const total = reservations.filter(r => r.status !== "cancelled").length
  const occupied = reservations.filter(r => r.status === "occupied").length
  const pending = reservations.filter(r => r.status === "waitlist").length
  const cancelled = reservations.filter(r => r.status === "cancelled").length
  const totalGuests = reservations.filter(r => r.status !== "cancelled").reduce((s, r) => s + (r.party_size ?? r.persons ?? 0), 0)

  const cTotal = useCountUp(total)
  const cOccupied = useCountUp(occupied)
  const cPending = useCountUp(pending)
  const cCancelled = useCountUp(cancelled)

  const dateLabel = `${WEEKDAYS_DE[today.getDay()]}, ${today.getDate()}. ${MONTHS_DE[today.getMonth()]} ${today.getFullYear()}`

  const stats = [
    { label: "Reservierungen Heute", value: cTotal,    icon: CalendarCheck, color: "#c9a84c", sub: `${totalGuests} Gäste gesamt` },
    { label: "Anwesende Gäste",      value: cOccupied, icon: Users,         color: "#2a9d5c", sub: "Derzeit eingecheckt" },
    { label: "Ausstehend / Warteliste", value: cPending, icon: AlertCircle, color: "#d4892a", sub: "Offene Anfragen" },
    { label: "Stornierungen Heute",  value: cCancelled, icon: XCircle,      color: "#cc2222", sub: "Heute storniert" },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: "#f5f0e8" }}>Übersicht</h2>
          <p className="text-sm mt-0.5" style={{ color: "#6b6b6b" }}>{dateLabel}</p>
        </div>
        <div className="flex items-center gap-2 text-sm" style={{ color: "#6b6b6b" }}>
          <TrendingUp className="w-4 h-4" style={{ color: "#2a9d5c" }} />
          <span>Live-Daten</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="glass-card rounded-2xl p-5 flex flex-col gap-3 transition-all duration-300 hover:scale-[1.02]"
            style={{ boxShadow: `0 0 24px ${s.color}08` }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-pretty" style={{ color: "#9a9a9a" }}>{s.label}</span>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${s.color}15` }}
              >
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
            </div>
            <div>
              <span className="text-4xl font-bold tabular-nums" style={{ color: s.color }}>{s.value}</span>
            </div>
            <span className="text-xs" style={{ color: "#6b6b6b" }}>{s.sub}</span>
          </div>
        ))}
      </div>

      {/* Today's Reservations */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(201,168,76,0.08)" }}>
          <h3 className="text-sm font-semibold" style={{ color: "#f5f0e8" }}>Heutige Reservierungen</h3>
          <Link href="/dashboard/reservierungen" className="text-xs transition-colors hover:opacity-80" style={{ color: "#c9a84c" }}>
            Alle anzeigen
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16" style={{ color: "#6b6b6b" }}>
            <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(201,168,76,0.2)", borderTopColor: "#c9a84c" }} />
          </div>
        ) : reservations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <CalendarCheck className="w-10 h-10" style={{ color: "#3a3a3a" }} />
            <p className="text-sm" style={{ color: "#6b6b6b" }}>Keine Reservierungen heute</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(201,168,76,0.06)" }}>
                  {["Uhrzeit", "Name", "Bereich", "Tisch", "Pers.", "Status"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-medium" style={{ color: "#6b6b6b" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reservations.map((r, i) => (
                  <tr
                    key={r.id}
                    className="transition-colors"
                    style={{
                      borderBottom: i < reservations.length - 1 ? "1px solid rgba(201,168,76,0.04)" : "none",
                      background: r.status === "occupied" ? "rgba(42,157,92,0.04)" : "transparent",
                    }}
                  >
                    <td className="px-5 py-3 font-mono text-xs" style={{ color: "#9a9a9a" }}>
                      {r.start_time.slice(0, 5)} – {r.end_time.slice(0, 5)}
                    </td>
                    <td className="px-5 py-3 font-medium" style={{ color: "#f5f0e8" }}>{r.guest_name}</td>
                    <td className="px-5 py-3 text-xs" style={{ color: "#9a9a9a" }}>{r.area?.name || r.area_id}</td>
                    <td className="px-5 py-3 font-mono text-xs" style={{ color: "#c9a84c" }}>#{r.table?.number || r.table_id}</td>
                    <td className="px-5 py-3 text-xs" style={{ color: "#9a9a9a" }}>{r.party_size ?? r.persons}</td>
                    <td className="px-5 py-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          background: `${STATUS_COLORS[r.status]}18`,
                          color: STATUS_COLORS[r.status],
                        }}
                      >
                        {STATUS_LABELS[r.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
