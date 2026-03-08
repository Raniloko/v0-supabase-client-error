"use client"
import { useState } from "react"
import { X, Plus, UserCheck, Lock, Mail, XCircle, Clock, Users, StickyNote } from "lucide-react"
import type { Area, Table, Reservation } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/lib/toast-context"
import { useRouter } from "next/navigation"

const STATUS_COLORS = {
  free:     { color: "#6b6b6b",  bg: "rgba(107,107,107,0.12)",  label: "Frei" },
  reserved: { color: "#c9a84c",  bg: "rgba(201,168,76,0.12)",   label: "Reserviert" },
  occupied: { color: "#2a9d5c",  bg: "rgba(42,157,92,0.12)",    label: "Anwesend" },
  blocked:  { color: "#cc2222",  bg: "rgba(204,34,34,0.12)",    label: "Gesperrt" },
}

const RES_STATUS_COLORS = {
  confirmed: "#c9a84c",
  occupied:  "#2a9d5c",
  cancelled: "#cc2222",
  completed: "#6b6b6b",
  waitlist:  "#d4892a",
}
const RES_STATUS_LABELS = {
  confirmed: "Bestätigt",
  occupied:  "Anwesend",
  cancelled: "Storniert",
  completed: "Abgeschlossen",
  waitlist:  "Warteliste",
}

const MONTHS_DE = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"]
const WEEKDAYS_LONG_DE = ["Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag"]

export default function TableSidePanel({
  table,
  area,
  reservations,
  onClose,
  onRefresh,
}: {
  table: Table
  area: Area | null
  reservations: Reservation[]
  onClose: () => void
  onRefresh: () => void
}) {
  const supabase = createClient()
  const { addToast } = useToast()
  const router = useRouter()
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)

  const status = STATUS_COLORS[table.status] || STATUS_COLORS.free
  const today = new Date()
  const dateLabel = `${WEEKDAYS_LONG_DE[today.getDay()]}, ${today.getDate()}. ${MONTHS_DE[today.getMonth()]} ${today.getFullYear()}`

  const handleCheckIn = async (reservation: Reservation) => {
    await supabase.from("reservations").update({
      status: "occupied",
      checked_in_at: new Date().toISOString(),
    }).eq("id", reservation.id)
    await supabase.from("tables").update({ status: "occupied" }).eq("id", table.id)
    addToast("success", "Gast eingecheckt", `${reservation.guest_name} ist jetzt anwesend.`)
    onRefresh()
  }

  const handleCancel = async (reservation: Reservation) => {
    await supabase.from("reservations").update({ status: "cancelled" }).eq("id", reservation.id)
    await supabase.from("tables").update({ status: "free" }).eq("id", table.id)
    addToast("error", "Reservierung storniert", `${reservation.guest_name} wurde storniert.`)
    onRefresh()
  }

  const handleToggleBlock = async () => {
    const newStatus = table.status === "blocked" ? "free" : "blocked"
    await supabase.from("tables").update({ status: newStatus }).eq("id", table.id)
    addToast("info", newStatus === "blocked" ? "Tisch gesperrt" : "Tisch freigegeben", `Tisch ${table.number}`)
    onRefresh()
  }

  const handleSaveNote = async () => {
    setSaving(true)
    await supabase.from("table_notes").insert({ table_id: table.id, note, created_by: "Admin" })
    setSaving(false)
    addToast("success", "Notiz gespeichert", `Tisch ${table.number}`)
  }

  const handleNewReservation = () => {
    router.push(`/dashboard/reservierungen/neu?table=${table.id}&area=${table.area_id}`)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        style={{ background: "rgba(0,0,0,0.4)" }}
      />

      {/* Panel */}
      <div
        className="fixed top-14 right-0 bottom-0 z-50 flex flex-col overflow-hidden"
        style={{
          width: "420px",
          background: "rgba(13,13,13,0.98)",
          backdropFilter: "blur(24px)",
          borderLeft: "3px solid #c9a84c",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5" style={{ borderBottom: "1px solid rgba(201,168,76,0.1)" }}>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-2xl font-bold" style={{ color: "#f5f0e8" }}>Tisch {table.number}</span>
              <span
                className="px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ background: status.bg, color: status.color }}
              >
                {status.label}
              </span>
            </div>
            <p className="text-xs" style={{ color: "#6b6b6b" }}>
              {area?.name} · {dateLabel}
            </p>
          </div>
          <button onClick={onClose} className="transition-colors" style={{ color: "#6b6b6b" }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          {/* Table info */}
          <div className="flex items-center gap-4 text-sm" style={{ color: "#9a9a9a" }}>
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>{table.capacity} Plätze</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>{reservations.length} Reservierung{reservations.length !== 1 ? "en" : ""} heute</span>
            </div>
          </div>

          {/* Today's reservations */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#6b6b6b" }}>
              Heutige Reservierungen
            </h3>
            {reservations.length === 0 ? (
              <div
                className="rounded-xl p-4 text-sm text-center"
                style={{ background: "#111111", border: "1px solid rgba(201,168,76,0.06)", color: "#6b6b6b" }}
              >
                Keine Reservierungen für heute
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {reservations.map(r => (
                  <div
                    key={r.id}
                    className="rounded-xl p-4 flex flex-col gap-3"
                    style={{
                      background: "#111111",
                      border: `1px solid ${RES_STATUS_COLORS[r.status]}25`,
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm" style={{ color: "#f5f0e8" }}>{r.guest_name}</p>
                        <p className="text-xs mt-0.5 font-mono" style={{ color: "#9a9a9a" }}>
                          {r.start_time.slice(0,5)} – {r.end_time.slice(0,5)} · {r.party_size} Pers.
                        </p>
                        {r.internal_note && (
                          <p className="text-xs mt-1 italic" style={{ color: "#c9a84c" }}>{r.internal_note}</p>
                        )}
                      </div>
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0"
                        style={{
                          background: `${RES_STATUS_COLORS[r.status]}18`,
                          color: RES_STATUS_COLORS[r.status],
                        }}
                      >
                        {RES_STATUS_LABELS[r.status]}
                      </span>
                    </div>

                    {/* Row actions */}
                    {r.status === "confirmed" && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCheckIn(r)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105"
                          style={{ background: "rgba(42,157,92,0.15)", color: "#2a9d5c", border: "1px solid rgba(42,157,92,0.2)" }}
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          Einchecken
                        </button>
                        <button
                          onClick={() => handleCancel(r)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                          style={{ background: "rgba(204,34,34,0.1)", color: "#cc2222", border: "1px solid rgba(204,34,34,0.15)" }}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Stornieren
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Staff note */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: "#6b6b6b" }}>
              <StickyNote className="w-3.5 h-3.5" />
              Interne Notiz
            </h3>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
              placeholder="Interne Notiz für diesen Tisch..."
              className="w-full rounded-lg px-4 py-3 text-sm resize-none outline-none"
              style={{
                background: "#111111",
                border: "1px solid rgba(201,168,76,0.15)",
                color: "#f5f0e8",
              }}
            />
            <button
              onClick={handleSaveNote}
              disabled={saving}
              className="mt-2 w-full py-2 rounded-lg text-xs font-medium transition-all duration-200"
              style={{ background: "rgba(201,168,76,0.1)", color: "#c9a84c", border: "1px solid rgba(201,168,76,0.2)" }}
            >
              {saving ? "Speichern..." : "Notiz speichern"}
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="px-6 py-5 flex flex-col gap-2" style={{ borderTop: "1px solid rgba(201,168,76,0.1)" }}>
          <button
            onClick={handleNewReservation}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.02]"
            style={{ background: "#c9a84c", color: "#0a0a0a", boxShadow: "0 0 16px rgba(201,168,76,0.2)" }}
          >
            <Plus className="w-4 h-4" />
            Neue Reservierung
          </button>
          <button
            onClick={handleToggleBlock}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
            style={{
              background: table.status === "blocked" ? "rgba(42,157,92,0.1)" : "rgba(204,34,34,0.1)",
              color: table.status === "blocked" ? "#2a9d5c" : "#cc2222",
              border: `1px solid ${table.status === "blocked" ? "rgba(42,157,92,0.2)" : "rgba(204,34,34,0.2)"}`,
            }}
          >
            <Lock className="w-4 h-4" />
            {table.status === "blocked" ? "Tisch freigeben" : "Tisch sperren"}
          </button>
        </div>
      </div>
    </>
  )
}
