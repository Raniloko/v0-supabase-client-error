"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { RecurringReservation, Area, Table } from "@/lib/types"
import { useToast } from "@/lib/toast-context"
import { RefreshCw, Plus, Trash2, ToggleLeft, ToggleRight, ChevronDown, ChevronUp } from "lucide-react"

const WEEKDAYS_DE = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"]
const FREQ_LABELS = { weekly: "Wöchentlich", biweekly: "Zweiwöchentlich" }

export default function WiederkehrendPage() {
  const supabase = createClient()
  const { addToast } = useToast()
  const [entries, setEntries] = useState<RecurringReservation[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  // Form state
  const [guestName, setGuestName] = useState("")
  const [guestEmail, setGuestEmail] = useState("")
  const [guestPhone, setGuestPhone] = useState("")
  const [areaId, setAreaId] = useState("")
  const [tableId, setTableId] = useState("")
  const [weekday, setWeekday] = useState(1)
  const [startTime, setStartTime] = useState("18:00")
  const [endTime, setEndTime] = useState("20:00")
  const [persons, setPersons] = useState(2)
  const [frequency, setFrequency] = useState<"weekly" | "biweekly">("weekly")
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0])
  const [saving, setSaving] = useState(false)

  const fetchAll = async () => {
    const [{ data: recData }, { data: arData }, { data: tbData }] = await Promise.all([
      supabase.from("recurring_reservations").select("*, table:tables(*), area:areas(*)").order("weekday"),
      supabase.from("areas").select("*").eq("enabled", true).order("sort_order"),
      supabase.from("tables").select("*").order("number"),
    ])
    setEntries((recData as RecurringReservation[]) || [])
    setAreas((arData as Area[]) || [])
    setTables((tbData as Table[]) || [])
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const handleCreate = async () => {
    if (!guestName || !areaId || !tableId) return
    setSaving(true)
    const { error } = await supabase.from("recurring_reservations").insert({
      guest_name: guestName,
      guest_email: guestEmail || null,
      guest_phone: guestPhone || null,
      area_id: areaId,
      table_id: tableId,
      weekday,
      start_time: startTime,
      end_time: endTime,
      persons,
      frequency,
      start_date: startDate,
      active: true,
    })
    setSaving(false)
    if (!error) {
      addToast("success", "Erstellt", `Wiederkehrende Reservierung für ${guestName} gespeichert.`)
      setShowForm(false)
      setGuestName(""); setGuestEmail(""); setGuestPhone("")
      setAreaId(""); setTableId("")
      fetchAll()
    } else {
      addToast("error", "Fehler", "Konnte nicht gespeichert werden.")
    }
  }

  const handleToggleActive = async (id: string, active: boolean, name: string) => {
    await supabase.from("recurring_reservations").update({ active: !active }).eq("id", id)
    addToast("info", !active ? "Aktiviert" : "Pausiert", `${name}`)
    fetchAll()
  }

  const handleDelete = async (id: string, name: string) => {
    await supabase.from("recurring_reservations").delete().eq("id", id)
    addToast("error", "Gelöscht", `${name} wurde entfernt.`)
    fetchAll()
  }

  const areaTables = tables.filter(t => t.area_id === areaId)

  return (
    <div className="flex flex-col gap-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: "#f5f0e8" }}>Wiederkehrende Reservierungen</h2>
          <p className="text-sm mt-1" style={{ color: "#6b6b6b" }}>
            {entries.filter(e => e.active).length} aktive Stammgäste
          </p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
          style={{ background: "#c9a84c", color: "#0a0a0a" }}
        >
          <Plus className="w-4 h-4" />
          Neu anlegen
          {showForm ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold mb-5" style={{ color: "#f5f0e8" }}>Neue Stammreservierung</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "Name *", val: guestName, set: setGuestName, ph: "Max Mustermann" },
              { label: "E-Mail", val: guestEmail, set: setGuestEmail, ph: "gast@email.de" },
              { label: "Telefon", val: guestPhone, set: setGuestPhone, ph: "+49 151 ..." },
            ].map(f => (
              <div key={f.label}>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: "#9a9a9a" }}>{f.label}</label>
                <input
                  value={f.val}
                  onChange={e => f.set(e.target.value)}
                  placeholder={f.ph}
                  className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
                  style={{ background: "#111111", border: "1px solid rgba(201,168,76,0.15)", color: "#f5f0e8" }}
                />
              </div>
            ))}
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "#9a9a9a" }}>Wochentag</label>
              <select
                value={weekday}
                onChange={e => setWeekday(Number(e.target.value))}
                className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
                style={{ background: "#111111", border: "1px solid rgba(201,168,76,0.15)", color: "#f5f0e8" }}
              >
                {WEEKDAYS_DE.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "#9a9a9a" }}>Bereich</label>
              <select
                value={areaId}
                onChange={e => { setAreaId(e.target.value); setTableId("") }}
                className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
                style={{ background: "#111111", border: "1px solid rgba(201,168,76,0.15)", color: "#f5f0e8" }}
              >
                <option value="">Bereich wählen...</option>
                {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "#9a9a9a" }}>Tisch</label>
              <select
                value={tableId}
                onChange={e => setTableId(e.target.value)}
                disabled={!areaId}
                className="w-full rounded-lg px-4 py-2.5 text-sm outline-none disabled:opacity-40"
                style={{ background: "#111111", border: "1px solid rgba(201,168,76,0.15)", color: "#f5f0e8" }}
              >
                <option value="">Tisch wählen...</option>
                {areaTables.map(t => <option key={t.id} value={t.id}>Tisch {t.number} ({t.capacity}P)</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "#9a9a9a" }}>Von – Bis</label>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="flex-1 rounded-lg px-3 py-2.5 text-sm outline-none"
                  style={{ background: "#111111", border: "1px solid rgba(201,168,76,0.15)", color: "#f5f0e8" }}
                />
                <span style={{ color: "#6b6b6b" }}>–</span>
                <input
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="flex-1 rounded-lg px-3 py-2.5 text-sm outline-none"
                  style={{ background: "#111111", border: "1px solid rgba(201,168,76,0.15)", color: "#f5f0e8" }}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "#9a9a9a" }}>Häufigkeit</label>
              <select
                value={frequency}
                onChange={e => setFrequency(e.target.value as "weekly" | "biweekly")}
                className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
                style={{ background: "#111111", border: "1px solid rgba(201,168,76,0.15)", color: "#f5f0e8" }}
              >
                <option value="weekly">Wöchentlich</option>
                <option value="biweekly">Zweiwöchentlich</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "#9a9a9a" }}>Personen</label>
              <div className="flex items-center gap-3">
                <button onClick={() => setPersons(p => Math.max(1, p-1))} className="w-8 h-8 rounded-lg text-lg font-bold" style={{ background: "#1a1a1a", color: "#9a9a9a" }}>-</button>
                <span className="w-8 text-center font-bold" style={{ color: "#f5f0e8" }}>{persons}</span>
                <button onClick={() => setPersons(p => Math.min(20, p+1))} className="w-8 h-8 rounded-lg text-lg font-bold" style={{ background: "#1a1a1a", color: "#9a9a9a" }}>+</button>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "#9a9a9a" }}>Start-Datum</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
                style={{ background: "#111111", border: "1px solid rgba(201,168,76,0.15)", color: "#f5f0e8" }}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-5">
            <button
              onClick={() => setShowForm(false)}
              className="px-5 py-2.5 rounded-xl text-sm"
              style={{ background: "#111111", color: "#9a9a9a" }}
            >
              Abbrechen
            </button>
            <button
              onClick={handleCreate}
              disabled={saving || !guestName || !areaId || !tableId}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40 hover:scale-105 transition-all"
              style={{ background: "#c9a84c", color: "#0a0a0a" }}
            >
              {saving ? "Speichern..." : "Speichern"}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(201,168,76,0.2)", borderTopColor: "#c9a84c" }} />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <RefreshCw className="w-8 h-8" style={{ color: "#3a3a3a" }} />
            <p className="text-sm" style={{ color: "#6b6b6b" }}>Keine Stammreservierungen</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(201,168,76,0.06)" }}>
                  {["Gast", "Tag / Zeit", "Bereich", "Tisch", "Pers.", "Häufigkeit", "Status", ""].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-medium" style={{ color: "#6b6b6b" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((e, i) => (
                  <tr
                    key={e.id}
                    style={{
                      borderBottom: i < entries.length - 1 ? "1px solid rgba(201,168,76,0.04)" : "none",
                      opacity: e.active ? 1 : 0.4,
                    }}
                  >
                    <td className="px-5 py-3.5">
                      <div className="font-medium" style={{ color: "#f5f0e8" }}>{e.guest_name}</div>
                      <div className="text-xs" style={{ color: "#9a9a9a" }}>{e.guest_email || e.guest_phone || ""}</div>
                    </td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: "#9a9a9a" }}>
                      <div>{WEEKDAYS_DE[e.weekday]}</div>
                      <div className="font-mono">{e.start_time.slice(0,5)} – {e.end_time.slice(0,5)}</div>
                    </td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: "#9a9a9a" }}>{(e.area as any)?.name || e.area_id}</td>
                    <td className="px-5 py-3.5 font-mono text-xs" style={{ color: "#c9a84c" }}>#{(e.table as any)?.number || e.table_id}</td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: "#9a9a9a" }}>{e.persons}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: "rgba(201,168,76,0.1)", color: "#c9a84c" }}>
                        {FREQ_LABELS[e.frequency]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs"
                        style={{
                          background: e.active ? "rgba(42,157,92,0.12)" : "rgba(107,107,107,0.12)",
                          color: e.active ? "#2a9d5c" : "#6b6b6b",
                        }}
                      >
                        {e.active ? "Aktiv" : "Pausiert"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleActive(e.id, e.active, e.guest_name)}
                          title={e.active ? "Pausieren" : "Aktivieren"}
                          className="p-1.5 rounded-lg transition-all"
                          style={{
                            background: e.active ? "rgba(212,137,42,0.1)" : "rgba(42,157,92,0.12)",
                            color: e.active ? "#d4892a" : "#2a9d5c",
                          }}
                        >
                          {e.active ? <ToggleLeft className="w-3.5 h-3.5" /> : <ToggleRight className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleDelete(e.id, e.guest_name)}
                          title="Löschen"
                          className="p-1.5 rounded-lg transition-all"
                          style={{ background: "rgba(204,34,34,0.1)", color: "#cc2222" }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
