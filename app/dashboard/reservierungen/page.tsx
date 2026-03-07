"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Reservation } from "@/lib/types"
import { ChevronLeft, ChevronRight, Plus, Search, UserCheck, XCircle, Filter } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/lib/toast-context"

const STATUS_COLORS = {
  confirmed: "#c9a84c",
  occupied:  "#2a9d5c",
  cancelled: "#cc2222",
  completed: "#6b6b6b",
  waitlist:  "#d4892a",
}
const STATUS_LABELS = {
  confirmed: "Bestätigt",
  occupied:  "Anwesend",
  cancelled: "Storniert",
  completed: "Abgeschlossen",
  waitlist:  "Warteliste",
}

const WEEKDAYS_DE = ["So.", "Mo.", "Di.", "Mi.", "Do.", "Fr.", "Sa."]
const MONTHS_DE = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"]

function formatDate(d: Date) {
  return d.toISOString().split("T")[0]
}

type TabType = "jetzt" | "bevorstehend" | "warteliste"

export default function ReservierungenPage() {
  const supabase = createClient()
  const { addToast } = useToast()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [tab, setTab] = useState<TabType>("bevorstehend")
  const [search, setSearch] = useState("")

  const dateStr = formatDate(selectedDate)

  const fetchReservations = async () => {
    const { data } = await supabase
      .from("reservations")
      .select("*, table:tables(*), area:areas(*)")
      .eq("reservation_date", dateStr)
      .order("start_time", { ascending: true })
    setReservations((data as Reservation[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    setLoading(true)
    fetchReservations()
  }, [dateStr])

  useEffect(() => {
    const channel = supabase
      .channel("reservations-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, fetchReservations)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [dateStr])

  const prevDay = () => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() - 1)
    setSelectedDate(d)
  }
  const nextDay = () => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + 1)
    setSelectedDate(d)
  }

  const handleCheckIn = async (r: Reservation) => {
    await supabase.from("reservations").update({ status: "occupied", checked_in_at: new Date().toISOString() }).eq("id", r.id)
    await supabase.from("tables").update({ status: "occupied" }).eq("id", r.table_id)
    addToast("success", "Eingecheckt", `${r.guest_name} ist jetzt anwesend.`)
    fetchReservations()
  }

  const handleCancel = async (r: Reservation) => {
    await supabase.from("reservations").update({ status: "cancelled" }).eq("id", r.id)
    await supabase.from("tables").update({ status: "free" }).eq("id", r.table_id)
    addToast("error", "Storniert", `${r.guest_name} wurde storniert.`)
    fetchReservations()
  }

  const nowStr = new Date().toTimeString().slice(0, 5)
  const filtered = reservations.filter(r => {
    if (search && !r.guest_name.toLowerCase().includes(search.toLowerCase())) return false
    if (tab === "jetzt") return r.status === "occupied" || (r.status === "confirmed" && r.start_time <= nowStr && r.end_time >= nowStr)
    if (tab === "bevorstehend") return ["confirmed", "completed"].includes(r.status)
    if (tab === "warteliste") return r.status === "waitlist"
    return true
  })

  const totalGuests = filtered.filter(r => r.status !== "cancelled").reduce((s, r) => s + r.persons, 0)
  const dateLabel = `${WEEKDAYS_DE[selectedDate.getDay()]} ${selectedDate.getDate()}. ${MONTHS_DE[selectedDate.getMonth()]}`
  const isToday = dateStr === formatDate(new Date())

  const tabItems: { key: TabType; label: string; count: number }[] = [
    { key: "jetzt", label: "Jetzt", count: reservations.filter(r => r.status === "occupied").length },
    { key: "bevorstehend", label: "Bevorstehend", count: reservations.filter(r => r.status === "confirmed").length },
    { key: "warteliste", label: "Warteliste", count: reservations.filter(r => r.status === "waitlist").length },
  ]

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Date nav */}
        <div className="flex items-center gap-3">
          <button onClick={prevDay} className="p-1.5 rounded-lg transition-all hover:bg-[#1a1a1a]" style={{ color: "#9a9a9a" }}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <div className="font-semibold" style={{ color: "#f5f0e8" }}>{dateLabel}</div>
            {isToday && <div className="text-xs" style={{ color: "#c9a84c" }}>Heute</div>}
          </div>
          <button onClick={nextDay} className="p-1.5 rounded-lg transition-all hover:bg-[#1a1a1a]" style={{ color: "#9a9a9a" }}>
            <ChevronRight className="w-5 h-5" />
          </button>
          {!isToday && (
            <button onClick={() => setSelectedDate(new Date())} className="text-xs px-3 py-1.5 rounded-lg" style={{ background: "rgba(201,168,76,0.1)", color: "#c9a84c" }}>
              Heute
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#6b6b6b" }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Gast suchen..."
              className="pl-9 pr-4 py-2 rounded-lg text-sm outline-none"
              style={{ background: "#111111", border: "1px solid rgba(201,168,76,0.12)", color: "#f5f0e8", width: "200px" }}
            />
          </div>

          {/* Guest count */}
          <div className="text-sm px-3 py-1.5 rounded-lg" style={{ background: "#111111", color: "#9a9a9a" }}>
            Gesamt <span style={{ color: "#c9a84c" }}>{totalGuests}</span> Gäste
          </div>

          <Link
            href="/dashboard/reservierungen/neu"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
            style={{ background: "#c9a84c", color: "#0a0a0a" }}
          >
            <Plus className="w-4 h-4" />
            Neu
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1" style={{ borderBottom: "1px solid rgba(201,168,76,0.08)" }}>
        {tabItems.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all relative"
            style={{ color: tab === t.key ? "#c9a84c" : "#6b6b6b" }}
          >
            {t.label}
            {t.count > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-xs" style={{ background: "rgba(201,168,76,0.12)", color: "#c9a84c" }}>
                {t.count}
              </span>
            )}
            {tab === t.key && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full" style={{ background: "#c9a84c" }} />
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(201,168,76,0.2)", borderTopColor: "#c9a84c" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Filter className="w-8 h-8" style={{ color: "#3a3a3a" }} />
            <p className="text-sm" style={{ color: "#6b6b6b" }}>Keine Einträge</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(201,168,76,0.06)" }}>
                  {["Uhrzeit", "Name", "Kontakt", "Bereich", "Tisch", "Pers.", "Status", "Aktionen"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-medium" style={{ color: "#6b6b6b" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr
                    key={r.id}
                    className="group transition-colors"
                    style={{
                      borderBottom: i < filtered.length - 1 ? "1px solid rgba(201,168,76,0.04)" : "none",
                      background: r.status === "occupied" ? "rgba(42,157,92,0.04)" : "transparent",
                    }}
                  >
                    <td className="px-5 py-3.5 font-mono text-xs" style={{ color: "#9a9a9a" }}>
                      {r.start_time.slice(0,5)} – {r.end_time.slice(0,5)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium" style={{ color: "#f5f0e8" }}>{r.guest_name}</div>
                      {r.staff_notes && <div className="text-xs italic mt-0.5" style={{ color: "#c9a84c" }}>{r.staff_notes}</div>}
                    </td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: "#9a9a9a" }}>
                      <div>{r.guest_email || "–"}</div>
                      <div>{r.guest_phone || ""}</div>
                    </td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: "#9a9a9a" }}>{(r.area as any)?.name || r.area_id}</td>
                    <td className="px-5 py-3.5 font-mono text-xs" style={{ color: "#c9a84c" }}>#{(r.table as any)?.number || r.table_id}</td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: "#9a9a9a" }}>{r.persons}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: `${STATUS_COLORS[r.status]}18`, color: STATUS_COLORS[r.status] }}
                      >
                        {STATUS_LABELS[r.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {r.status === "confirmed" && (
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleCheckIn(r)}
                            title="Einchecken"
                            className="p-1.5 rounded-lg transition-all"
                            style={{ background: "rgba(42,157,92,0.12)", color: "#2a9d5c" }}
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleCancel(r)}
                            title="Stornieren"
                            className="p-1.5 rounded-lg transition-all"
                            style={{ background: "rgba(204,34,34,0.1)", color: "#cc2222" }}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
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
