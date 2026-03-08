"use client"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { Area, Table } from "@/lib/types"
import { useToast } from "@/lib/toast-context"
import { ChevronLeft, ChevronRight, Check, User, MapPin, Clock, StickyNote, Sparkles } from "lucide-react"

const STEPS = ["Gast", "Bereich & Tisch", "Zeit", "Notiz", "Bestätigung"]

const MONTHS_DE = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"]
const WEEKDAYS_DE = ["So.","Mo.","Di.","Mi.","Do.","Fr.","Sa."]

function timeOptions() {
  const opts = []
  for (let h = 15; h <= 24; h++) {
    for (const m of [0, 30]) {
      if (h === 24 && m > 0) break
      const hh = String(h === 24 ? 0 : h).padStart(2, "0")
      const mm = String(m).padStart(2, "0")
      opts.push(`${hh}:${mm}`)
    }
  }
  for (let h = 1; h <= 3; h++) {
    for (const m of [0, 30]) {
      opts.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`)
    }
  }
  return opts
}
const TIME_OPTS = timeOptions()

export default function NeueReservierungPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const { addToast } = useToast()

  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)

  // Data
  const [areas, setAreas] = useState<Area[]>([])
  const [tables, setTables] = useState<Table[]>([])

  // Form
  const [guestName, setGuestName] = useState("")
  const [guestEmail, setGuestEmail] = useState("")
  const [guestPhone, setGuestPhone] = useState("")
  const [selectedAreaId, setSelectedAreaId] = useState(searchParams.get("area") || "")
  const [selectedTableId, setSelectedTableId] = useState(searchParams.get("table") || "")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [startTime, setStartTime] = useState("18:00")
  const [duration, setDuration] = useState(120)
  const [persons, setPersons] = useState(2)
  const [staffNote, setStaffNote] = useState("")

  const endTime = (() => {
    const [h, m] = startTime.split(":").map(Number)
    const totalMin = h * 60 + m + duration
    const eh = Math.floor(totalMin / 60) % 24
    const em = totalMin % 60
    return `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`
  })()

  useEffect(() => {
    const loadData = async () => {
      const [{ data: areasData }, { data: tablesData }] = await Promise.all([
        supabase.from("areas").select("*").eq("enabled", true).order("sort_order"),
        supabase.from("tables").select("*").order("number"),
      ])
      if (areasData) setAreas(areasData as Area[])
      if (tablesData) setTables(tablesData as Table[])
    }
    loadData()
  }, [])

  const areaTables = tables.filter(t => t.area_id === selectedAreaId && t.status === "free")
  const selectedArea = areas.find(a => a.id === selectedAreaId)
  const selectedTable = tables.find(t => t.id === selectedTableId)
  const dateObj = new Date(date + "T12:00:00")
  const dateLabel = `${WEEKDAYS_DE[dateObj.getDay()]} ${dateObj.getDate()}. ${MONTHS_DE[dateObj.getMonth()]} ${dateObj.getFullYear()}`

  const canNext = () => {
    if (step === 0) return guestName.trim().length > 0
    if (step === 1) return selectedAreaId && selectedTableId
    if (step === 2) return date && startTime
    return true
  }

  const handleSubmit = async () => {
    if (!guestName || !selectedAreaId || !selectedTableId || !date || !startTime) return
    setLoading(true)
    const { error } = await supabase.from("reservations").insert({
      guest_name: guestName,
      guest_email: guestEmail || null,
      guest_phone: guestPhone || null,
      area_id: selectedAreaId,
      table_id: selectedTableId,
      reservation_date: date,
      start_time: startTime,
      end_time: endTime,
      party_size: persons,
      status: "confirmed",
      internal_note: staffNote || null,
    })
    if (!error) {
      await supabase.from("tables").update({ status: "reserved" }).eq("id", selectedTableId)
      addToast("success", "Reservierung erstellt", `${guestName} – ${dateLabel} ${startTime}`)
      router.push("/dashboard/reservierungen")
    } else {
      addToast("error", "Fehler", "Reservierung konnte nicht erstellt werden.")
      setLoading(false)
    }
  }

  const AREA_ICONS: Record<string, string> = {
    billard: "B",
    salitos: "S",
    rest140: "140",
    rest75:  "75",
    vip:     "VIP",
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="p-2 rounded-lg transition-all hover:bg-[#1a1a1a]" style={{ color: "#9a9a9a" }}>
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold" style={{ color: "#f5f0e8" }}>Neue Reservierung</h2>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div
              className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold flex-shrink-0 transition-all"
              style={{
                background: i < step ? "#c9a84c" : i === step ? "rgba(201,168,76,0.2)" : "#111111",
                border: i <= step ? "2px solid #c9a84c" : "2px solid #2a2a2a",
                color: i <= step ? (i < step ? "#0a0a0a" : "#c9a84c") : "#6b6b6b",
              }}
            >
              {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span className="text-xs hidden sm:block" style={{ color: i === step ? "#c9a84c" : "#6b6b6b" }}>{s}</span>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-px" style={{ background: i < step ? "#c9a84c" : "#1a1a1a" }} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="glass-card rounded-2xl p-6 flex flex-col gap-5">

        {/* Step 0 – Gast */}
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-1">
              <User className="w-5 h-5" style={{ color: "#c9a84c" }} />
              <h3 className="font-semibold" style={{ color: "#f5f0e8" }}>Gastdaten</h3>
            </div>
            {[
              { label: "Name *", val: guestName, set: setGuestName, placeholder: "Max Mustermann", type: "text", required: true },
              { label: "E-Mail", val: guestEmail, set: setGuestEmail, placeholder: "gast@email.de", type: "email", required: false },
              { label: "Telefon", val: guestPhone, set: setGuestPhone, placeholder: "+49 151 ...", type: "tel", required: false },
            ].map(field => (
              <div key={field.label}>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: "#9a9a9a" }}>{field.label}</label>
                <input
                  type={field.type}
                  value={field.val}
                  onChange={e => field.set(e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
                  style={{ background: "#111111", border: "1px solid rgba(201,168,76,0.15)", color: "#f5f0e8" }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Step 1 – Bereich & Tisch */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-5 h-5" style={{ color: "#c9a84c" }} />
              <h3 className="font-semibold" style={{ color: "#f5f0e8" }}>Bereich & Tisch</h3>
            </div>
            <div>
              <label className="text-xs font-medium mb-2 block" style={{ color: "#9a9a9a" }}>Bereich</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {areas.map(a => (
                  <button
                    key={a.id}
                    onClick={() => { setSelectedAreaId(a.id); setSelectedTableId("") }}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl text-xs font-medium transition-all"
                    style={{
                      background: selectedAreaId === a.id ? "rgba(201,168,76,0.12)" : "#111111",
                      border: `1px solid ${selectedAreaId === a.id ? "#c9a84c" : "rgba(201,168,76,0.08)"}`,
                      color: selectedAreaId === a.id ? "#c9a84c" : "#9a9a9a",
                    }}
                  >
                    <span className="font-bold">{AREA_ICONS[a.id]}</span>
                    <span className="text-center leading-tight" style={{ fontSize: "9px" }}>{a.name.split(" ")[0]}</span>
                  </button>
                ))}
              </div>
            </div>
            {selectedAreaId && (
              <div>
                <label className="text-xs font-medium mb-2 block" style={{ color: "#9a9a9a" }}>
                  Tisch (nur freie Tische)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {areaTables.length === 0 ? (
                    <p className="col-span-4 text-sm text-center py-4" style={{ color: "#6b6b6b" }}>Keine freien Tische</p>
                  ) : areaTables.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTableId(t.id)}
                      className="flex flex-col items-center gap-1 p-3 rounded-xl text-xs font-medium transition-all"
                      style={{
                        background: selectedTableId === t.id ? "rgba(201,168,76,0.12)" : "#111111",
                        border: `1px solid ${selectedTableId === t.id ? "#c9a84c" : "rgba(201,168,76,0.08)"}`,
                        color: selectedTableId === t.id ? "#c9a84c" : "#9a9a9a",
                      }}
                    >
                      <span className="font-bold">#{t.number}</span>
                      <span style={{ color: "#6b6b6b" }}>{t.capacity}P</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2 – Zeit */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-5 h-5" style={{ color: "#c9a84c" }} />
              <h3 className="font-semibold" style={{ color: "#f5f0e8" }}>Zeit & Personen</h3>
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "#9a9a9a" }}>Datum</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
                style={{ background: "#111111", border: "1px solid rgba(201,168,76,0.15)", color: "#f5f0e8" }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: "#9a9a9a" }}>Uhrzeit</label>
                <select
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
                  style={{ background: "#111111", border: "1px solid rgba(201,168,76,0.15)", color: "#f5f0e8" }}
                >
                  {TIME_OPTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: "#9a9a9a" }}>Dauer</label>
                <select
                  value={duration}
                  onChange={e => setDuration(Number(e.target.value))}
                  className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
                  style={{ background: "#111111", border: "1px solid rgba(201,168,76,0.15)", color: "#f5f0e8" }}
                >
                  {[60,90,120,150,180,240].map(d => <option key={d} value={d}>{d} Min.</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "#9a9a9a" }}>Ende: <span style={{ color: "#c9a84c" }}>{endTime} Uhr</span></label>
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "#9a9a9a" }}>Personenanzahl</label>
              <div className="flex items-center gap-3">
                <button onClick={() => setPersons(p => Math.max(1, p - 1))} className="w-8 h-8 rounded-lg font-bold text-lg transition-all" style={{ background: "#1a1a1a", color: "#9a9a9a" }}>-</button>
                <span className="w-10 text-center font-bold text-xl" style={{ color: "#f5f0e8" }}>{persons}</span>
                <button onClick={() => setPersons(p => Math.min(20, p + 1))} className="w-8 h-8 rounded-lg font-bold text-lg transition-all" style={{ background: "#1a1a1a", color: "#9a9a9a" }}>+</button>
                <span className="text-sm ml-2" style={{ color: "#9a9a9a" }}>Personen</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 3 – Notiz */}
        {step === 3 && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-1">
              <StickyNote className="w-5 h-5" style={{ color: "#c9a84c" }} />
              <h3 className="font-semibold" style={{ color: "#f5f0e8" }}>Interne Notiz</h3>
            </div>
            <p className="text-sm" style={{ color: "#6b6b6b" }}>Diese Notiz ist nur für das Personal sichtbar, nicht für den Gast.</p>
            <textarea
              value={staffNote}
              onChange={e => setStaffNote(e.target.value)}
              rows={5}
              placeholder="z.B. Geburtstag, VIP-Gast, Allergien, Sonderwünsche..."
              className="w-full rounded-lg px-4 py-3 text-sm resize-none outline-none"
              style={{ background: "#111111", border: "1px solid rgba(201,168,76,0.15)", color: "#f5f0e8" }}
            />
          </div>
        )}

        {/* Step 4 – Bestätigung */}
        {step === 4 && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5" style={{ color: "#c9a84c" }} />
              <h3 className="font-semibold" style={{ color: "#f5f0e8" }}>Zusammenfassung</h3>
            </div>
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(201,168,76,0.12)" }}>
              {[
                { label: "Gast", value: guestName },
                { label: "E-Mail", value: guestEmail || "–" },
                { label: "Telefon", value: guestPhone || "–" },
                { label: "Bereich", value: selectedArea?.name || "–" },
                { label: "Tisch", value: selectedTable ? `#${selectedTable.number}` : "–" },
                { label: "Datum", value: dateLabel },
                { label: "Zeit", value: `${startTime} – ${endTime} Uhr (${duration} Min.)` },
                { label: "Personen", value: `${persons} Personen` },
                { label: "Notiz", value: staffNote || "–" },
              ].map((row, i, arr) => (
                <div
                  key={row.label}
                  className="flex items-center gap-4 px-5 py-3"
                  style={{ borderBottom: i < arr.length - 1 ? "1px solid rgba(201,168,76,0.06)" : "none" }}
                >
                  <span className="text-xs w-20 flex-shrink-0" style={{ color: "#6b6b6b" }}>{row.label}</span>
                  <span className="text-sm font-medium" style={{ color: "#f5f0e8" }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={() => step > 0 ? setStep(s => s - 1) : router.back()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{ background: "#111111", color: "#9a9a9a", border: "1px solid rgba(201,168,76,0.1)" }}
        >
          <ChevronLeft className="w-4 h-4" />
          {step === 0 ? "Abbrechen" : "Zurück"}
        </button>

        {step < STEPS.length - 1 ? (
          <button
            onClick={() => canNext() && setStep(s => s + 1)}
            disabled={!canNext()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105 disabled:opacity-40 disabled:scale-100"
            style={{ background: "#c9a84c", color: "#0a0a0a" }}
          >
            Weiter
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 disabled:opacity-60"
            style={{ background: "#c9a84c", color: "#0a0a0a", boxShadow: "0 0 20px rgba(201,168,76,0.25)" }}
          >
            <Check className="w-4 h-4" />
            {loading ? "Speichern..." : "Reservierung erstellen"}
          </button>
        )}
      </div>
    </div>
  )
}
