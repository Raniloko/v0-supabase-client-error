"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Reservation } from "@/lib/types"
import { ChevronLeft, ChevronRight } from "lucide-react"

const AREA_COLORS: Record<string, string> = {
  billard: "#2a9d5c",
  salitos: "#4a90d9",
  rest140: "#c9a84c",
  rest75:  "#d4892a",
  vip:     "#9b59b6",
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 15) // 15:00 – 03:00 next day
const WEEKDAYS_DE = ["Mo.", "Di.", "Mi.", "Do.", "Fr.", "Sa.", "So."]
const MONTHS_DE = ["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"]

function getWeekDates(weekOffset: number) {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + weekOffset * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

export default function KalenderPage() {
  const supabase = createClient()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [weekOffset, setWeekOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const weekDates = getWeekDates(weekOffset)

  useEffect(() => {
    const startDate = weekDates[0].toISOString().split("T")[0]
    const endDate = weekDates[6].toISOString().split("T")[0]
    supabase.from("reservations")
      .select("*, area:areas(*)")
      .gte("reservation_date", startDate)
      .lte("reservation_date", endDate)
      .neq("status", "cancelled")
      .then(({ data }) => { setReservations((data as Reservation[]) || []); setLoading(false) })
  }, [weekOffset])

  const nowMinutes = (() => {
    const now = new Date()
    return now.getHours() * 60 + now.getMinutes()
  })()

  const todayStr = new Date().toISOString().split("T")[0]

  const getReservationsForSlot = (date: Date, hour: number) => {
    const dateStr = date.toISOString().split("T")[0]
    return reservations.filter(r => {
      if (r.reservation_date !== dateStr) return false
      const startHour = parseInt(r.start_time.split(":")[0])
      return startHour === hour
    })
  }

  const topOffset = (time: string) => {
    const [h, m] = time.split(":").map(Number)
    const mins = (h < 10 ? h + 24 : h) * 60 + m - 15 * 60
    return Math.max(0, (mins / 60) * 60)
  }
  const blockHeight = (start: string, end: string) => {
    const [sh, sm] = start.split(":").map(Number)
    const [eh, em] = end.split(":").map(Number)
    const startMin = (sh < 10 ? sh + 24 : sh) * 60 + sm
    const endMin = (eh < 10 ? eh + 24 : eh) * 60 + em
    return Math.max(30, ((endMin - startMin) / 60) * 60)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold" style={{ color: "#f5f0e8" }}>Kalender</h2>
        <div className="flex items-center gap-3">
          <button onClick={() => setWeekOffset(w => w - 1)} className="p-1.5 rounded-lg" style={{ color: "#9a9a9a", background: "#111111" }}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => setWeekOffset(0)} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "rgba(201,168,76,0.1)", color: "#c9a84c" }}>
            Heute
          </button>
          <button onClick={() => setWeekOffset(w => w + 1)} className="p-1.5 rounded-lg" style={{ color: "#9a9a9a", background: "#111111" }}>
            <ChevronRight className="w-5 h-5" />
          </button>
          <span className="text-sm" style={{ color: "#9a9a9a" }}>
            {weekDates[0].getDate()}. {MONTHS_DE[weekDates[0].getMonth()]} – {weekDates[6].getDate()}. {MONTHS_DE[weekDates[6].getMonth()]} {weekDates[6].getFullYear()}
          </span>
        </div>
      </div>

      <div
        className="glass-card rounded-2xl overflow-auto"
        style={{ maxHeight: "calc(100vh - 200px)" }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(201,168,76,0.2)", borderTopColor: "#c9a84c" }} />
          </div>
        ) : (
          <div className="min-w-[800px]">
            {/* Day headers */}
            <div className="grid grid-cols-8 sticky top-0 z-10" style={{ background: "rgba(13,13,13,0.95)" }}>
              <div className="px-3 py-3" />
              {weekDates.map((date, i) => {
                const isToday = date.toISOString().split("T")[0] === todayStr
                return (
                  <div key={i} className="px-3 py-3 text-center" style={{ borderLeft: "1px solid rgba(201,168,76,0.06)" }}>
                    <div className="text-xs" style={{ color: isToday ? "#c9a84c" : "#6b6b6b" }}>{WEEKDAYS_DE[i]}</div>
                    <div
                      className="text-base font-bold mt-0.5 w-8 h-8 rounded-full flex items-center justify-center mx-auto"
                      style={{
                        color: isToday ? "#0a0a0a" : "#f5f0e8",
                        background: isToday ? "#c9a84c" : "transparent",
                      }}
                    >
                      {date.getDate()}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Time grid */}
            <div className="grid grid-cols-8 relative" style={{ borderTop: "1px solid rgba(201,168,76,0.06)" }}>
              {/* Hour rows */}
              {HOURS.map(hour => (
                <div key={hour} className="contents">
                  <div className="px-3 py-0 flex items-start pt-2" style={{ borderBottom: "1px solid rgba(201,168,76,0.04)", height: "60px" }}>
                    <span className="text-xs font-mono" style={{ color: "#4a4a4a" }}>{String(hour > 23 ? hour - 24 : hour).padStart(2, "0")}:00</span>
                  </div>
                  {weekDates.map((date, di) => {
                    const slotRes = getReservationsForSlot(date, hour > 23 ? hour - 24 : hour)
                    return (
                      <div
                        key={di}
                        className="relative"
                        style={{
                          borderLeft: "1px solid rgba(201,168,76,0.06)",
                          borderBottom: "1px solid rgba(201,168,76,0.04)",
                          height: "60px",
                        }}
                      >
                        {slotRes.map(r => (
                          <div
                            key={r.id}
                            className="absolute left-1 right-1 rounded-md px-1.5 py-1 text-xs overflow-hidden z-10"
                            style={{
                              background: `${AREA_COLORS[r.area_id]}22`,
                              border: `1px solid ${AREA_COLORS[r.area_id]}60`,
                              color: AREA_COLORS[r.area_id],
                              top: 2,
                              height: Math.max(28, blockHeight(r.start_time, r.end_time) - 4),
                            }}
                          >
                            <div className="font-medium truncate" style={{ fontSize: "10px" }}>{r.guest_name}</div>
                            <div style={{ fontSize: "9px", opacity: 0.7 }}>{r.start_time.slice(0,5)}</div>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
