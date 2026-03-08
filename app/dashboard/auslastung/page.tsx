"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Reservation } from "@/lib/types"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { BarChart2, Users, TrendingUp, Clock } from "lucide-react"

const AREA_LABELS: Record<string, string> = {
  billard: "Billard",
  salitos: "Salitos",
  rest140: "Rest. 140\"",
  rest75:  "Rest. 75\"",
  vip:     "VIP",
}
const AREA_COLORS: Record<string, string> = {
  billard: "#2a9d5c",
  salitos: "#4a90d9",
  rest140: "#c9a84c",
  rest75:  "#d4892a",
  vip:     "#9b59b6",
}
const MONTHS_DE = ["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"]

export default function AuslastungPage() {
  const supabase = createClient()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const today = new Date()
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 29)
    supabase
      .from("reservations")
      .select("*, area:areas(*)")
      .gte("reservation_date", thirtyDaysAgo.toISOString().split("T")[0])
      .lte("reservation_date", today.toISOString().split("T")[0])
      .neq("status", "cancelled")
      .then(({ data }) => {
        setReservations((data as Reservation[]) || [])
        setLoading(false)
      })
  }, [])

  // Stats
  const totalReservations = reservations.length
  const totalGuests = reservations.reduce((s, r) => s + (r.party_size ?? 0), 0)
  const avgPersons = totalReservations > 0 ? (totalGuests / totalReservations).toFixed(1) : "0"
  const peakHour = (() => {
    const counts: Record<number, number> = {}
    reservations.forEach(r => {
      const h = parseInt(r.start_time.split(":")[0])
      counts[h] = (counts[h] || 0) + 1
    })
    const max = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
    return max ? `${max[0]}:00 Uhr` : "–"
  })()

  // By area chart data
  const areaData = Object.keys(AREA_LABELS).map(areaId => ({
    area: AREA_LABELS[areaId],
    areaId,
    count: reservations.filter(r => r.area_id === areaId).length,
    guests: reservations.filter(r => r.area_id === areaId).reduce((s, r) => s + (r.party_size ?? 0), 0),
  })).filter(d => d.count > 0)

  // Daily chart (last 14 days)
  const dailyData = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (13 - i))
    const dateStr = d.toISOString().split("T")[0]
    const count = reservations.filter(r => r.reservation_date === dateStr).length
    return {
      label: `${d.getDate()}. ${MONTHS_DE[d.getMonth()]}`,
      count,
      isToday: i === 13,
    }
  })

  // By hour data
  const hourData = Array.from({ length: 12 }, (_, i) => {
    const h = 15 + i
    const realH = h > 23 ? h - 24 : h
    const count = reservations.filter(r => parseInt(r.start_time.split(":")[0]) === realH).length
    return { label: `${String(realH).padStart(2, "0")}:00`, count }
  }).filter(d => d.count > 0)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold" style={{ color: "#f5f0e8" }}>Auslastung</h2>
        <p className="text-sm mt-1" style={{ color: "#6b6b6b" }}>Letzte 30 Tage</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(201,168,76,0.2)", borderTopColor: "#c9a84c" }} />
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { label: "Reservierungen",   value: totalReservations, icon: BarChart2,  color: "#c9a84c" },
              { label: "Gäste Gesamt",      value: totalGuests,        icon: Users,      color: "#2a9d5c" },
              { label: "Ø Personenanzahl",  value: avgPersons,         icon: TrendingUp, color: "#4a90d9" },
              { label: "Stoßzeit",          value: peakHour,           icon: Clock,      color: "#d4892a" },
            ].map(stat => (
              <div
                key={stat.label}
                className="glass-card rounded-2xl p-5 flex flex-col gap-3"
                style={{ boxShadow: `0 0 24px ${stat.color}08` }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: "#9a9a9a" }}>{stat.label}</span>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}15` }}>
                    <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                  </div>
                </div>
                <span className="text-3xl font-bold tabular-nums" style={{ color: stat.color }}>{stat.value}</span>
              </div>
            ))}
          </div>

          {/* Daily chart */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-sm font-semibold mb-5" style={{ color: "#f5f0e8" }}>Reservierungen – Letzte 14 Tage</h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={dailyData} barSize={20}>
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#6b6b6b", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: "#181818",
                    border: "1px solid rgba(201,168,76,0.2)",
                    borderRadius: "8px",
                    color: "#f5f0e8",
                    fontSize: "12px",
                  }}
                  cursor={{ fill: "rgba(201,168,76,0.05)" }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {dailyData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.isToday ? "#c9a84c" : "rgba(201,168,76,0.25)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* By area */}
            {areaData.length > 0 && (
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-sm font-semibold mb-5" style={{ color: "#f5f0e8" }}>Nach Bereich</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={areaData} barSize={28} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="area"
                      tick={{ fill: "#9a9a9a", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={80}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#181818",
                        border: "1px solid rgba(201,168,76,0.2)",
                        borderRadius: "8px",
                        color: "#f5f0e8",
                        fontSize: "12px",
                      }}
                      cursor={{ fill: "rgba(255,255,255,0.03)" }}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {areaData.map((entry, index) => (
                        <Cell key={index} fill={AREA_COLORS[entry.areaId] || "#c9a84c"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* By hour */}
            {hourData.length > 0 && (
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-sm font-semibold mb-5" style={{ color: "#f5f0e8" }}>Nach Uhrzeit</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={hourData} barSize={20}>
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "#6b6b6b", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{
                        background: "#181818",
                        border: "1px solid rgba(201,168,76,0.2)",
                        borderRadius: "8px",
                        color: "#f5f0e8",
                        fontSize: "12px",
                      }}
                      cursor={{ fill: "rgba(201,168,76,0.05)" }}
                    />
                    <Bar dataKey="count" fill="rgba(201,168,76,0.4)" radius={[4, 4, 0, 0]}>
                      {hourData.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={entry.count === Math.max(...hourData.map(h => h.count)) ? "#c9a84c" : "rgba(201,168,76,0.3)"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
