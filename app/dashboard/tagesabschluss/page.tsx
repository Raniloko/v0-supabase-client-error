"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Reservation } from "@/lib/types"
import { FileText, CheckCircle, Users, Clock, XCircle, Download, TrendingUp } from "lucide-react"

const AREA_LABELS: Record<string, string> = {
  billard: "Billard Tisch",
  salitos: "Salitos Lounge",
  rest140: "Restaurant 140\"",
  rest75:  "Restaurant 75\"",
  vip:     "VIP Raum",
}
const STATUS_LABELS: Record<string, string> = {
  confirmed: "Bestätigt",
  occupied:  "Anwesend",
  cancelled: "Storniert",
  completed: "Abgeschlossen",
  waitlist:  "Warteliste",
}
const STATUS_COLORS: Record<string, string> = {
  confirmed: "#c9a84c",
  occupied:  "#2a9d5c",
  cancelled: "#cc2222",
  completed: "#6b6b6b",
  waitlist:  "#d4892a",
}
const MONTHS_DE = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"]
const WEEKDAYS_LONG_DE = ["Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag"]

export default function TagesabschlussPage() {
  const supabase = createClient()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0])
  const [closed, setClosed] = useState(false)

  const fetchReservations = async () => {
    const { data } = await supabase
      .from("reservations")
      .select("*, table:tables(*), area:areas(*)")
      .eq("reservation_date", reportDate)
      .order("start_time", { ascending: true })
    setReservations((data as Reservation[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    setLoading(true)
    fetchReservations()
  }, [reportDate])

  const total = reservations.length
  const confirmed = reservations.filter(r => r.status === "confirmed").length
  const occupied = reservations.filter(r => r.status === "occupied").length
  const cancelled = reservations.filter(r => r.status === "cancelled").length
  const completed = reservations.filter(r => r.status === "completed").length
  const totalGuests = reservations.filter(r => !["cancelled","waitlist"].includes(r.status)).reduce((s, r) => s + (r.party_size ?? 0), 0)
  const avgPersons = total > 0 ? (totalGuests / Math.max(1, total - cancelled)).toFixed(1) : "0"

  // By area breakdown
  const areaBreakdown = Object.entries(AREA_LABELS).map(([id, name]) => {
    const areaRes = reservations.filter(r => r.area_id === id && r.status !== "cancelled")
    return { id, name, count: areaRes.length, guests: areaRes.reduce((s, r) => s + (r.party_size ?? 0), 0) }
  }).filter(a => a.count > 0)

  const dateObj = new Date(reportDate + "T12:00:00")
  const dateLabel = `${WEEKDAYS_LONG_DE[dateObj.getDay()]}, ${dateObj.getDate()}. ${MONTHS_DE[dateObj.getMonth()]} ${dateObj.getFullYear()}`
  const isToday = reportDate === new Date().toISOString().split("T")[0]

  const handleCompleteDay = async () => {
    // Mark all "confirmed" as "completed" 
    const toComplete = reservations.filter(r => r.status === "confirmed")
    for (const r of toComplete) {
      await supabase.from("reservations").update({ status: "completed" }).eq("id", r.id)
    }
    setClosed(true)
    fetchReservations()
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: "#f5f0e8" }}>Tagesabschluss</h2>
          <p className="text-sm mt-1" style={{ color: "#6b6b6b" }}>{dateLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={reportDate}
            onChange={e => setReportDate(e.target.value)}
            className="rounded-lg px-4 py-2 text-sm outline-none"
            style={{ background: "#111111", border: "1px solid rgba(201,168,76,0.15)", color: "#f5f0e8" }}
          />
          {isToday && !closed && total > 0 && (
            <button
              onClick={handleCompleteDay}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
              style={{ background: "rgba(42,157,92,0.12)", color: "#2a9d5c", border: "1px solid rgba(42,157,92,0.2)" }}
            >
              <CheckCircle className="w-4 h-4" />
              Tag abschließen
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(201,168,76,0.2)", borderTopColor: "#c9a84c" }} />
        </div>
      ) : (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
            {[
              { label: "Gesamt",           value: total,     icon: FileText,    color: "#c9a84c" },
              { label: "Gäste",            value: totalGuests, icon: Users,      color: "#2a9d5c" },
              { label: "Anwesend",         value: occupied,  icon: TrendingUp,  color: "#4a90d9" },
              { label: "Abgeschlossen",    value: completed, icon: CheckCircle, color: "#6b6b6b" },
              { label: "Storniert",        value: cancelled, icon: XCircle,     color: "#cc2222" },
            ].map(stat => (
              <div
                key={stat.label}
                className="glass-card rounded-2xl p-4 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "#9a9a9a" }}>{stat.label}</span>
                  <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                </div>
                <span className="text-3xl font-bold tabular-nums" style={{ color: stat.color }}>{stat.value}</span>
              </div>
            ))}
          </div>

          {/* Extra stats */}
          <div className="flex gap-4 flex-wrap text-sm" style={{ color: "#9a9a9a" }}>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" style={{ color: "#c9a84c" }} />
              <span>Ø Personenanzahl: <span style={{ color: "#c9a84c", fontWeight: "600" }}>{avgPersons}</span></span>
            </div>
            {areaBreakdown.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4" style={{ color: "#2a9d5c" }} />
                <span>Meiste Buchungen: <span style={{ color: "#2a9d5c", fontWeight: "600" }}>{areaBreakdown.sort((a, b) => b.count - a.count)[0]?.name}</span></span>
              </div>
            )}
          </div>

          {/* Area breakdown */}
          {areaBreakdown.length > 0 && (
            <div className="glass-card rounded-2xl p-5">
              <h3 className="text-sm font-semibold mb-4" style={{ color: "#f5f0e8" }}>Aufschlüsselung nach Bereich</h3>
              <div className="flex flex-col gap-3">
                {areaBreakdown.map(area => {
                  const pct = total > 0 ? Math.round((area.count / (total - cancelled)) * 100) : 0
                  return (
                    <div key={area.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm" style={{ color: "#f5f0e8" }}>{area.name}</span>
                        <div className="flex items-center gap-4 text-xs" style={{ color: "#9a9a9a" }}>
                          <span>{area.count} Reservierungen</span>
                          <span>{area.guests} Gäste</span>
                          <span style={{ color: "#c9a84c", fontWeight: "600" }}>{pct}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(201,168,76,0.08)" }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, background: "#c9a84c" }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Full reservations list */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(201,168,76,0.08)" }}>
              <h3 className="text-sm font-semibold" style={{ color: "#f5f0e8" }}>Alle Reservierungen</h3>
              <span className="text-xs" style={{ color: "#6b6b6b" }}>{reservations.length} Einträge</span>
            </div>
            {reservations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <FileText className="w-8 h-8" style={{ color: "#3a3a3a" }} />
                <p className="text-sm" style={{ color: "#6b6b6b" }}>Keine Reservierungen für diesen Tag</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(201,168,76,0.06)" }}>
                      {["Zeit", "Name", "Bereich", "Tisch", "Pers.", "Status", "Notiz"].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-medium" style={{ color: "#6b6b6b" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.map((r, i) => (
                      <tr
                        key={r.id}
                        style={{
                          borderBottom: i < reservations.length - 1 ? "1px solid rgba(201,168,76,0.04)" : "none",
                          opacity: r.status === "cancelled" ? 0.5 : 1,
                        }}
                      >
                        <td className="px-5 py-3 font-mono text-xs" style={{ color: "#9a9a9a" }}>
                          {r.start_time.slice(0,5)} – {r.end_time.slice(0,5)}
                        </td>
                        <td className="px-5 py-3 font-medium" style={{ color: "#f5f0e8" }}>{r.guest_name}</td>
                        <td className="px-5 py-3 text-xs" style={{ color: "#9a9a9a" }}>{AREA_LABELS[r.area_id] || r.area_id}</td>
                        <td className="px-5 py-3 font-mono text-xs" style={{ color: "#c9a84c" }}>#{(r.table as any)?.number || r.table_id}</td>
                        <td className="px-5 py-3 text-xs" style={{ color: "#9a9a9a" }}>{r.party_size}</td>
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
                        <td className="px-5 py-3 text-xs italic" style={{ color: "#c9a84c" }}>
                          {r.internal_note || "–"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
