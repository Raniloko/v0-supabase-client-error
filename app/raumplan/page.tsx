"use client"
import dynamic from "next/dynamic"
import { useEffect, useRef, useState } from "react"
import { RoomGeometry, AREA_TABLE_DEFS, AREA_CANVAS } from "@/lib/floor-geometry"
import {
  CalendarDays, ChevronLeft, ChevronRight, Cloud, BarChart2,
  Users, User, Timer, Clock, ClipboardList, Settings, HelpCircle,
  Bell, Menu, PencilRuler, X, CheckCheck, Check, PauseCircle,
  AlertCircle, MapPin, Pencil, Mail, Ban, LogIn, Lock,
} from "lucide-react"

// Dynamic import prevents SSR crash – the editor uses browser-only APIs
const EmbeddedEditor = dynamic(
  () => import("./editor/page").then(m => ({ default: m.EmbeddedEditor })),
  { ssr: false, loading: () => (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100%", color:"#555", fontSize:13 }}>
      Editor wird geladen…
    </div>
  )},
)

// ─── Types ────────────────────────────────────────────────────────────────────

type TableStatus = "free" | "reserved" | "present" | "booked" | "blocked"

interface PanelData {
  title: string
  area: string
  guest?: string
  startTime?: string
  endTime?: string
  pax?: string
  status: "Frei" | "Reserviert" | "Anwesend" | "Belegt"
}

// ─── Static Data ──────────────────────────────────────────────────────────────

const RESERVATION_ROWS = [
  { time: "19:00", offset: "01:00", guests: 4, name: ". Jana",            table: "1. / 3",  status: "ob",           highlighted: false },
  { time: "19:15", offset: "01:15", guests: 4, name: "Michelik",          table: "1. / 2",  status: "none",         highlighted: false },
  { time: "19:30", offset: "01:30", guests: 2, name: "Licata, Francesco", table: "3. / 64", status: "double-check", highlighted: true  },
  { time: "19:30", offset: "01:30", guests: 3, name: "Lenga, Dennis",     table: "1. / 6",  status: "double-check", highlighted: true  },
  { time: "20:00", offset: "02:00", guests: 4, name: "Gutsch, Fabian",    table: "3. / 65", status: "check-pause",  highlighted: false },
  { time: "20:00", offset: "02:00", guests: 4, name: "Hantal",            table: "1. / 1",  status: "check",        highlighted: false },
  { time: "20:00", offset: "02:00", guests: 4, name: "Kewelo",            table: "1. / 8",  status: "none",         highlighted: false },
]

const TABLE_DATA: Record<string, PanelData> = {
  t10: { title: "Tisch 10",  area: "Billard Tisch",        status: "Frei" },
  t30: { title: "Tisch 30",  area: "Billard Tisch",        status: "Frei" },
  t50: { title: "Tisch 50",  area: "Restaurant 140 Zoll",  status: "Frei" },
  t51: { title: "Tisch 51",  area: "Restaurant 140 Zoll",  status: "Frei" },
  t52: { title: "Tisch 52",  area: "Restaurant 140 Zoll",  status: "Frei" },
  t53: { title: "Tisch 53",  area: "Restaurant 140 Zoll",  status: "Frei" },
  t54: { title: "Tisch 54",  area: "Restaurant 140 Zoll",  status: "Frei" },
  t58: { title: "Tisch 58",  area: "Restaurant 140 Zoll",  status: "Frei" },
  t59: { title: "Tisch 59",  area: "Restaurant 140 Zoll",  status: "Frei" },
  t60: { title: "Tisch 60",  area: "Restaurant 140 Zoll",  status: "Frei" },
  t61: { title: "Tisch 61",  area: "Restaurant 140 Zoll",  status: "Reserviert", guest: "Guido",     startTime: "01:30", endTime: "03:00", pax: "2" },
  t62: { title: "Tisch 62",  area: "Restaurant 140 Zoll",  status: "Reserviert", guest: "Lentino",   startTime: "19:30", endTime: "21:00", pax: "3" },
  t63: { title: "Tisch 63",  area: "Restaurant 140 Zoll",  status: "Reserviert", guest: "Santos d.", startTime: "20:00", endTime: "22:00", pax: "4" },
  t64: { title: "Tisch 64",  area: "Restaurant 140 Zoll",  status: "Anwesend",   guest: "Licata",    startTime: "19:30", endTime: "21:30", pax: "2" },
  t65: { title: "Tisch 65",  area: "Restaurant 140 Zoll",  status: "Anwesend",   guest: "Gutsch",    startTime: "20:00", endTime: "22:00", pax: "4" },
  t66: { title: "Tisch 66",  area: "Restaurant 140 Zoll",  status: "Frei" },
  t67: { title: "Tisch 67",  area: "Restaurant 140 Zoll",  status: "Frei" },
  b1:  { title: "Billard 1", area: "Billard Tisch",        status: "Frei" },
  b2:  { title: "Billard 2", area: "Billard Tisch",        status: "Reserviert", guest: "Michelik",  startTime: "19:15", endTime: "21:15", pax: "4" },
  b3:  { title: "Billard 3", area: "Billard Tisch",        status: "Frei" },
}

const AREA_TABS = [
  { id: "billard", label: "1. Billard Tisch" },
  { id: "salitos", label: "2. Salitos Lounge / Outdoor" },
  { id: "rest140", label: "3. Restaurant 140 Zoll" },
  { id: "rest75",  label: "4. Restaurant 75 Zoll / Sport" },
  { id: "vip",     label: "5. VIP Raum / Sport" },
]

const STATUS_COLOR: Record<TableStatus, { fill: string; stroke: string; text: string }> = {
  free:    { fill: "#d8d8e0", stroke: "#b8b8cc", text: "#222" },
  reserved:{ fill: "#c9a84c", stroke: "#a8883a", text: "#111" },
  present: { fill: "#2a9a3a", stroke: "#1e7a2e", text: "#fff" },
  booked:  { fill: "#2a6ad8", stroke: "#1a52b8", text: "#fff" },
  blocked: { fill: "#aa2222", stroke: "#881111", text: "#fff" },
}

// ─── Topbar ────────────────────────────────────────────────────────────────────

function Topbar({ currentTime }: { currentTime: string }) {
  const SEP = "1px solid #2a2a2a"
  const iconBtn: React.CSSProperties = {
    width: 36, height: 36, borderRadius: 5, display: "flex", alignItems: "center",
    justifyContent: "center", cursor: "pointer", color: "#888", background: "transparent",
    border: "none", flexShrink: 0,
  }
  const sepBtn: React.CSSProperties = { ...iconBtn, height: "100%", padding: "0 12px", borderLeft: SEP, borderRadius: 0, width: "auto" }

  return (
    <div
      className="flex items-stretch flex-shrink-0"
      style={{ height: 52, background: "#111111", borderBottom: SEP, userSelect: "none" }}
    >
      {/* A – Menu + Logo */}
      <div className="flex items-center gap-2 px-3" style={{ borderRight: SEP }}>
        <button style={iconBtn}><Menu size={18} /></button>
        <img src="/rondo-logo.png" alt="Rondo" style={{ height: 28, width: "auto", objectFit: "contain", filter: "brightness(0) invert(1)", opacity: 0.85 }} />
      </div>

      {/* B – Jetzt */}
      <div className="flex items-center gap-1.5 px-3" style={{ borderRight: SEP, cursor: "pointer" }}>
        <CalendarDays size={15} color="#888" />
        <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>Jetzt</span>
        <ChevronLeft size={13} color="#888" style={{ marginLeft: 2 }} />
      </div>

      {/* C – Date nav */}
      <div className="flex items-center" style={{ borderRight: SEP }}>
        <button style={iconBtn}><ChevronLeft size={15} /></button>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#fff", padding: "0 8px", whiteSpace: "nowrap" }}>Sa., 7 März</span>
        <button style={iconBtn}><ChevronRight size={15} /></button>
      </div>

      {/* D – Meal period */}
      <div className="flex items-center" style={{ borderRight: SEP }}>
        <button style={iconBtn}><ChevronLeft size={13} /></button>
        <span style={{ fontSize: 13, fontWeight: 500, color: "#fff", padding: "0 6px", whiteSpace: "nowrap" }}>Abendessen</span>
        <button style={iconBtn}><ChevronRight size={13} /></button>
      </div>

      {/* E – Time nav */}
      <div className="flex items-center" style={{ borderRight: SEP }}>
        <button style={iconBtn}><ChevronLeft size={15} /></button>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", padding: "0 10px", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
          {currentTime}
        </span>
        <button style={iconBtn}><ChevronRight size={15} /></button>
      </div>

      {/* F – Right icons */}
      <div className="flex items-stretch ml-auto">
        <button style={sepBtn}><Cloud size={16} /></button>
        <button style={sepBtn}><BarChart2 size={16} /></button>
        <div className="flex items-center gap-1.5 px-3" style={{ borderLeft: SEP }}>
          <Users size={13} color="#ccc" />
          <span style={{ fontSize: 12, color: "#ccc" }}>37/<span style={{ fontWeight: 700, color: "#fff" }}>68</span></span>
        </div>
        <button style={sepBtn}><User size={15} /></button>
        <button style={sepBtn}><Timer size={15} /></button>
        <button style={sepBtn}><Clock size={15} /></button>
        <button style={sepBtn}><ClipboardList size={15} /></button>
      </div>
    </div>
  )
}

// ─── Area Tabs Bar ─────────────────────────────────────────────────────────────

function AreaTabsBar({ activeArea, setActiveArea }: {
  activeArea: string
  setActiveArea: (id: string) => void
}) {
  const SEP = "1px solid #2a2a2a"
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir === "left" ? -160 : 160, behavior: "smooth" })
  }

  return (
    <div
      className="flex items-stretch flex-shrink-0"
      style={{ height: 44, background: "#1e1e1e", borderBottom: SEP, overflow: "hidden" }}
    >
      {/* Left scroll arrow */}
      <button
        onClick={() => scroll("left")}
        style={{
          width: 32, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
          background: "transparent", border: "none", borderRight: SEP, cursor: "pointer", color: "#666",
        }}
      >
        <ChevronLeft size={15} />
      </button>

      {/* Scrollable tabs */}
      <div
        ref={scrollRef}
        className="flex items-stretch flex-1"
        style={{ overflowX: "auto", scrollbarWidth: "none" }}
      >
        <style>{`.area-scroll::-webkit-scrollbar{display:none}`}</style>
        {AREA_TABS.map(tab => {
          const active = activeArea === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveArea(tab.id)}
              style={{
                padding: "0 22px",
                fontSize: 13,
                fontWeight: 600,
                color: active ? "#fff" : "#888",
                background: active ? "rgba(255,255,255,0.08)" : "transparent",
                borderBottom: active ? "2px solid #c9a84c" : "2px solid transparent",
                borderRight: SEP,
                whiteSpace: "nowrap",
                flexShrink: 0,
                cursor: "pointer",
                transition: "all 0.15s",
                border: "none",
                borderBottomWidth: 2,
                borderBottomStyle: "solid",
                borderBottomColor: active ? "#c9a84c" : "transparent",
              }}
              onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.color = "#ccc"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)" }}}
              onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.color = "#888"; (e.currentTarget as HTMLButtonElement).style.background = "transparent" }}}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Right scroll arrow */}
      <button
        onClick={() => scroll("right")}
        style={{
          width: 32, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
          background: "transparent", border: "none", borderLeft: SEP, cursor: "pointer", color: "#666",
        }}
      >
        <ChevronRight size={15} />
      </button>


    </div>
  )
}

// Per-tab filtering helpers
const PLATZIERT_ROWS   = RESERVATION_ROWS.filter(r => r.status === "double-check" || r.status === "check" || r.status === "check-pause")
const BEVORSTEHEND_ROWS = RESERVATION_ROWS.filter(r => r.status === "none" || r.status === "ob")
const ACHTUNG_ROWS     = RESERVATION_ROWS.filter(r => r.highlighted && r.status !== "double-check")

// ─── Reservation List Panel ────────────────────────────────────────────────────

function ReservationPanel({
  selectedRow,
  onRowClick,
  onNewReservation,
}: {
  selectedRow: number | null
  onRowClick: (idx: number, row: typeof RESERVATION_ROWS[0]) => void
  onNewReservation: () => void
}) {
  const [resTab, setResTab] = useState<"reservierungsliste" | "warteliste">("reservierungsliste")
  const [subTab, setSubTab] = useState<"platziert" | "bevorstehend" | "achtung">("platziert")

  const visibleRows =
    subTab === "platziert"    ? PLATZIERT_ROWS
    : subTab === "bevorstehend" ? BEVORSTEHEND_ROWS
    : ACHTUNG_ROWS

  const SUBTABS = [
    { key: "platziert" as const,    label: "Platziert",  count: PLATZIERT_ROWS.length,    badgeBg: "#2a7a2a", icon: <Users size={11} /> },
    { key: "bevorstehend" as const, label: "Bevorsteh.", count: BEVORSTEHEND_ROWS.length,  badgeBg: "#555",    icon: <Users size={11} /> },
    { key: "achtung" as const,      label: "Achtung",    count: ACHTUNG_ROWS.length,       badgeBg: "#cc5500", icon: <AlertCircle size={11} /> },
  ]

  return (
    <div style={{ width: 390, minWidth: 390, background: "#f2f2f2", borderRight: "1px solid #ddd", display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* Top dark bar: Reservierungsliste / Warteliste + New button */}
      <div style={{ height: 44, background: "#1e1e1e", borderBottom: "1px solid #2a2a2a", display: "flex", alignItems: "center", padding: "0 10px", gap: 4, flexShrink: 0 }}>
        {[
          { key: "reservierungsliste" as const, label: "Reservierungen", badge: String(RESERVATION_ROWS.length), badgeBg: "#2a7a2a" },
          { key: "warteliste" as const,         label: "Warteliste",     badge: null, badgeBg: "" },
        ].map(t => {
          const active = resTab === t.key
          return (
            <button key={t.key} onClick={() => setResTab(t.key)}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 5,
                fontSize: 11, fontWeight: 600, cursor: "pointer",
                background: active ? "rgba(255,255,255,0.12)" : "transparent",
                color: active ? "#fff" : "#666", border: "none", whiteSpace: "nowrap",
              }}>
              {t.badge && (
                <span style={{ background: t.badgeBg, color: "#fff", fontSize: 9, fontWeight: 800, padding: "1px 5px", borderRadius: 8 }}>
                  {t.badge}
                </span>
              )}
              {t.label}
            </button>
          )
        })}
        <div style={{ flex: 1 }} />
        <button
          onClick={onNewReservation}
          style={{
            display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 5,
            fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
            background: "#c9a84c", color: "#111", border: "none",
          }}
        >
          + Neu
        </button>
      </div>

      {/* Sub-tabs: Platziert / Bevorsteh. / Achtung */}
      <div style={{ display: "flex", borderBottom: "2px solid #ddd", padding: "0 10px", flexShrink: 0, background: "#f2f2f2" }}>
        {SUBTABS.map(t => {
          const active = subTab === t.key
          return (
            <button key={t.key} onClick={() => setSubTab(t.key)}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "9px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer",
                color: active ? "#111" : "#888", background: "transparent", border: "none",
                borderBottom: active ? "2px solid #111" : "2px solid transparent",
                marginBottom: -2, whiteSpace: "nowrap",
              }}>
              <span style={{ background: t.badgeBg, color: "#fff", fontSize: 9, fontWeight: 800, padding: "1px 5px", borderRadius: 8, display: "flex", alignItems: "center", gap: 2 }}>
                {t.icon} {t.count}
              </span>
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Column headers */}
      <div style={{
        display: "grid", gridTemplateColumns: "70px 28px 1fr 36px",
        alignItems: "center", padding: "6px 14px", gap: 8,
        background: "#f2f2f2", borderBottom: "1px solid #ddd", flexShrink: 0,
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.04em" }}>UHRZEIT</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#555", textTransform: "uppercase", textAlign: "center" }}>P</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.04em" }}>NAME / TISCH</span>
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
          <Bell size={13} color="#888" style={{ cursor: "pointer" }} />
        </div>
      </div>

      {/* Group label */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", borderBottom: "1px solid #e0e0e0", background: "#f5f5f5", flexShrink: 0 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#444", textTransform: "uppercase", letterSpacing: "0.04em" }}>ABENDESSEN</span>
        <span style={{ fontSize: 10, color: "#777", marginLeft: "auto", display: "flex", alignItems: "center", gap: 3 }}><Users size={10} /> {RESERVATION_ROWS.reduce((s, r) => s + r.guests, 0)}</span>
      </div>

      {/* Rows */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {visibleRows.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 8, color: "#bbb" }}>
            <Users size={28} color="#ccc" />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#aaa" }}>Keine Einträge</span>
          </div>
        ) : visibleRows.map((row, idx) => {
          const globalIdx = RESERVATION_ROWS.indexOf(row)
          const isSelected = selectedRow === globalIdx
          const isHighlighted = row.highlighted
          return (
            <div
              key={idx}
              onClick={() => onRowClick(globalIdx, row)}
              style={{
                display: "grid",
                gridTemplateColumns: "70px 28px 1fr 36px",
                alignItems: "center",
                gap: 8,
                padding: "0 14px",
                minHeight: 58,
                borderBottom: "1px solid #e8e8e8",
                borderLeft: isHighlighted ? "3px solid #2a7a2a" : isSelected ? "3px solid #c9a84c" : "3px solid transparent",
                background: isSelected ? "#eaeaea" : isHighlighted ? "#edf4ed" : "#fff",
                cursor: "pointer",
                transition: "background 0.12s",
              }}
              onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = "#f0f0f0" }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.background = isSelected ? "#eaeaea" : isHighlighted ? "#edf4ed" : "#fff"
              }}
            >
              {/* Time */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{row.time}</div>
                <div style={{ fontSize: 10, color: "#999" }}>{row.offset}</div>
              </div>
              {/* Pax */}
              <div style={{ fontSize: 13, fontWeight: 700, color: "#333", textAlign: "center" }}>{row.guests}</div>
              {/* Name + table */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#111" }}>{row.name}</div>
                <div style={{ fontSize: 10, color: "#999" }}>{row.table}</div>
              </div>
              {/* Status icon */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>
                {row.status === "ob" && (
                  <span style={{ background: "#e07820", color: "#fff", fontSize: 8, fontWeight: 800, padding: "2px 4px", borderRadius: 3 }}>OB</span>
                )}
                {row.status === "double-check" && <CheckCheck size={14} color="#2a7a2a" strokeWidth={2.5} />}
                {row.status === "check"         && <Check size={14} color="#2a7a2a" strokeWidth={2.5} />}
                {row.status === "check-pause"   && (
                  <><Check size={13} color="#2a7a2a" strokeWidth={2.5} /><PauseCircle size={12} color="#aaa" strokeWidth={2} /></>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── SVG Table (cross shape) ──────────────────────────────────────────────────

function TTable({
  id, cx, cy, vw, vh, hw, hh, status, label, pax, name, time, sel, onClick,
  cT = 2, cB = 2, cL = 1, cR = 1,
}: {
  id: string; cx: number; cy: number; vw: number; vh: number; hw: number; hh: number
  status: TableStatus; label: string; pax?: number; name?: string; time?: string
  sel: string | null; onClick: (id: string) => void
  cT?: number; cB?: number; cL?: number; cR?: number
}) {
  const sc = STATUS_COLOR[status]
  const selected = sel === id
  const W = 7; const H = 5; const GAP = 4

  const chairs = (n: number, axis: "h" | "v", ox: number, oy: number) => {
    if (!n) return null
    const total = n * W + (n - 1) * GAP
    return Array.from({ length: n }).map((_, i) => {
      const off = -total / 2 + i * (W + GAP) + W / 2
      return (
        <rect key={i}
          x={axis === "h" ? ox + off - W / 2 : ox}
          y={axis === "h" ? oy : oy + off - W / 2}
          width={axis === "h" ? W : H}
          height={axis === "h" ? H : W}
          rx={1.5} fill={sc.fill} stroke={sc.stroke} strokeWidth={0.8} opacity={0.7}
        />
      )
    })
  }

  const tw = hw + 6
  const tx = cx - tw / 2

  return (
    <g onClick={() => onClick(id)} style={{ cursor: "pointer" }}>
      {chairs(cT, "h", cx, cy - vh / 2 - H - 3)}
      {chairs(cB, "h", cx, cy + vh / 2 + 3)}
      {chairs(cL, "v", cx - hw / 2 - H - 3, cy)}
      {chairs(cR, "v", cx + hw / 2 + 3, cy)}

      <rect x={cx - vw / 2} y={cy - vh / 2} width={vw} height={vh} rx={4}
        fill={sc.fill} stroke={selected ? "#f0c060" : sc.stroke}
        strokeWidth={selected ? 2.5 : 1.5}
      />
      <rect x={cx - hw / 2} y={cy - hh / 2} width={hw} height={hh} rx={4}
        fill={sc.fill} stroke={selected ? "#f0c060" : sc.stroke}
        strokeWidth={selected ? 2.5 : 1.5}
      />

      {pax !== undefined && pax > 0 && (
        <>
          <rect x={cx - hw / 2 + 1} y={cy - vh / 2 + 1} width={17} height={12} rx={2.5} fill="rgba(0,0,0,0.62)" />
          <text x={cx - hw / 2 + 9.5} y={cy - vh / 2 + 10} textAnchor="middle" fill="#e0e0e0" fontSize={7.5} fontWeight="bold">{pax}</text>
        </>
      )}

      <text x={cx} y={cy + 4} textAnchor="middle" fontSize={10} fontWeight="bold"
        fontFamily="'DM Sans', sans-serif" fill={sc.text}>{label}</text>

      {name && (
        <>
          {time && (
            <text x={cx} y={cy + vh / 2 + 13} textAnchor="middle"
              fill={sc.text === "#fff" ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.55)"}
              fontSize={7} fontWeight="600">{time}</text>
          )}
          <text x={cx} y={cy + vh / 2 + (time ? 22 : 13)} textAnchor="middle"
            fill={sc.text === "#fff" ? "#fff" : "#111"}
            fontSize={7.5} fontWeight="bold">{name}</text>
        </>
      )}

      {selected && (
        <rect x={cx - hw / 2 - 6} y={cy - vh / 2 - 6}
          width={hw + 12} height={vh + 12} rx={6}
          fill="none" stroke="rgba(240,192,96,0.5)" strokeWidth={1.5} strokeDasharray="4 3"
        />
      )}
    </g>
  )
}

// ─── Billiard Table ─────────���────────────────────────────────���────────────────

function BTable({
  id, x, y, w, h, status, label, name, time, sel, onClick, transform,
}: {
  id: string; x: number; y: number; w: number; h: number
  status: TableStatus; label: string; name?: string; time?: string
  sel: string | null; onClick: (id: string) => void; transform?: string
}) {
  const selected = sel === id
  const railColor   = selected ? "#f0c060" : status === "reserved" ? "#c9a84c" : "#5a5a5a"
  const railWidth   = selected ? 3.5 : status === "reserved" ? 3 : 3

  // 6 pockets: 4 corners + 2 side midpoints (landscape: mid on long/top+bottom sides)
  const pockets: [number, number][] = [
    [x + 9,     y + 9    ],
    [x + w / 2, y + 8    ],
    [x + w - 9, y + 9    ],
    [x + 9,     y + h - 9],
    [x + w / 2, y + h - 8],
    [x + w - 9, y + h - 9],
  ]

  return (
    <g transform={transform} onClick={() => onClick(id)} style={{ cursor: "pointer" }}>
      {/* Label above */}
      <text x={x + w / 2} y={y - 6} textAnchor="middle"
        fill="#3a3a3a" fontSize={8} fontFamily="'Bebas Neue', cursive" letterSpacing="0.12em">{label}</text>

      {/* Outer rail – grey metal border */}
      <rect x={x - 4} y={y - 4} width={w + 8} height={h + 8} rx={5}
        fill="none" stroke={railColor} strokeWidth={railWidth} />

      {/* Green felt surface */}
      <rect x={x} y={y} width={w} height={h} rx={3} fill="#1a7a2e" />

      {/* Gold tint overlay if reserved */}
      {status === "reserved" && (
        <rect x={x} y={y} width={w} height={h} rx={3} fill="rgba(201,168,76,0.06)" />
      )}

      {/* Center line (horizontal, landscape) */}
      <line x1={x + 12} y1={y + h / 2} x2={x + w - 12} y2={y + h / 2}
        stroke="rgba(255,255,255,0.13)" strokeWidth={1} />

      {/* Pockets */}
      {pockets.map(([px, py], i) => (
        <circle key={i} cx={px} cy={py} r={5.5} fill="#060606" />
      ))}

      {/* Billiard balls */}
      <circle cx={x + w * 0.36} cy={y + h * 0.40} r={5} fill="#e03030" opacity={0.88} />
      <circle cx={x + w * 0.50} cy={y + h * 0.58} r={5} fill="#f0f0f0" opacity={0.88} />
      <circle cx={x + w * 0.64} cy={y + h * 0.40} r={5} fill="#e8a020" opacity={0.88} />
      <circle cx={x + w * 0.44} cy={y + h * 0.72} r={4} fill="#3060d0" opacity={0.80} />
      <circle cx={x + w * 0.58} cy={y + h * 0.72} r={4} fill="#1a8030" opacity={0.80} />

      {/* Guest name tag (below table) */}
      {name && (
        <>
          <rect x={x} y={y + h + 7} width={w} height={14} rx={3}
            fill={status === "reserved" ? "#a07820" : "#2a6a2a"} opacity={0.92} />
          <text x={x + w / 2} y={y + h + 18} textAnchor="middle"
            fill="#fff" fontSize={9} fontWeight="bold">{name}</text>
          {time && (
            <>
              <rect x={x} y={y + h + 22} width={w} height={12} rx={3} fill="rgba(0,0,0,0.45)" />
              <text x={x + w / 2} y={y + h + 32} textAnchor="middle"
                fill={status === "reserved" ? "#f0d070" : "#a0e8a0"} fontSize={8}>{time}</text>
            </>
          )}
        </>
      )}

      {/* Selection ring */}
      {selected && (
        <rect x={x - 8} y={y - 8} width={w + 16} height={h + 16} rx={7}
          fill="none" stroke="rgba(240,192,96,0.55)" strokeWidth={1.5} strokeDasharray="5 3" />
      )}
    </g>
  )
}

// ─── Floor Plan SVG ────────────────────────────────────────────────────────────
// Pixel-perfect implementation per canvas.md spec.

const CANVAS_TABLE_DATA: Record<string, { title: string; status: string; guest?: string; startTime?: string; endTime?: string; pax?: string }> = {
  t10: { title: "Tisch 10",  status: "Frei" },
  t30: { title: "Tisch 30",  status: "Frei" },
  t50: { title: "Tisch 50",  status: "Frei" },
  t51: { title: "Tisch 51",  status: "Frei" },
  t52: { title: "Tisch 52",  status: "Frei" },
  t53: { title: "Tisch 53",  status: "Frei" },
  t54: { title: "Tisch 54",  status: "Frei" },
  t58: { title: "Tisch 58",  status: "Frei" },
  t59: { title: "Tisch 59",  status: "Frei" },
  t60: { title: "Tisch 60",  status: "Frei" },
  t61: { title: "Tisch 61",  status: "Reserviert", guest: "Guido",     startTime: "01:30", endTime: "03:00", pax: "2" },
  t62: { title: "Tisch 62",  status: "Reserviert", guest: "Lentino",   startTime: "19:30", endTime: "21:00", pax: "3" },
  t63: { title: "Tisch 63",  status: "Reserviert", guest: "Santos d.", startTime: "20:00", endTime: "22:00", pax: "4" },
  t64: { title: "Tisch 64",  status: "Anwesend",   guest: "Licata",    startTime: "19:30", endTime: "21:30", pax: "2" },
  t65: { title: "Tisch 65",  status: "Anwesend",   guest: "Gutsch",    startTime: "20:00", endTime: "22:00", pax: "4" },
  t66: { title: "Tisch 66",  status: "Frei" },
  t67: { title: "Tisch 67",  status: "Frei" },
  b1:  { title: "Billard 1", status: "Frei" },
  b2:  { title: "Billard 2", status: "Reserviert", guest: "Michelik",  startTime: "19:15", endTime: "21:15", pax: "4" },
  b3:  { title: "Billard 3", status: "Frei" },
}

// Modern restaurant table: clean rounded rectangle with evenly-spaced seat circles around it
// cx,cy = center; tw,th = table width/height; seats = number per side (top, right, bottom, left)
function ModernTable({
  id, cx, cy, tw, th,
  fill, stroke, textColor,
  label, sublabel,
  sel, onTableClick,
  seatTop = 2, seatRight = 1, seatBottom = 2, seatLeft = 1,
}: {
  id: string; cx: number; cy: number; tw: number; th: number
  fill: string; stroke: string; textColor: string
  label: string; sublabel?: string
  sel: string | null; onTableClick: (id: string) => void
  seatTop?: number; seatRight?: number; seatBottom?: number; seatLeft?: number
}) {
  const selected = sel === id
  const SR = 5.5   // seat circle radius
  const GAP = 7    // gap between table edge and seat center
  const SEAT_FILL = fill
  const SEAT_STROKE = stroke
  const SEAT_OP = 0.55

  // Generate evenly distributed seat positions along each edge
  const seatsAlong = (n: number, along: number, fixed: number, horiz: boolean): [number,number][] => {
    if (n === 0) return []
    const spacing = along / (n + 1)
    return Array.from({ length: n }, (_, i) => {
      const pos = -along / 2 + spacing * (i + 1)
      return horiz ? [cx + pos, fixed] : [fixed, cy + pos]
    }) as [number,number][]
  }

  const tSeats = seatsAlong(seatTop,    tw, cy - th / 2 - GAP, true)
  const bSeats = seatsAlong(seatBottom, tw, cy + th / 2 + GAP, true)
  const lSeats = seatsAlong(seatLeft,   th, cx - tw / 2 - GAP, false)
  const rSeats = seatsAlong(seatRight,  th, cx + tw / 2 + GAP, false)
  const allSeats = [...tSeats, ...bSeats, ...lSeats, ...rSeats]

  return (
    <g onClick={() => onTableClick(id)} style={{ cursor: "pointer" }}>
      {/* Selection ring */}
      {selected && (
        <rect
          x={cx - tw / 2 - SR - GAP - 4} y={cy - th / 2 - SR - GAP - 4}
          width={tw + (SR + GAP + 4) * 2} height={th + (SR + GAP + 4) * 2}
          rx={10} fill="none" stroke="rgba(240,192,96,0.7)" strokeWidth={2} strokeDasharray="5 3"
        />
      )}
      {/* Seat circles */}
      {allSeats.map(([sx, sy], i) => (
        <circle key={i} cx={sx} cy={sy} r={SR} fill={SEAT_FILL} stroke={SEAT_STROKE} strokeWidth={1} opacity={SEAT_OP} />
      ))}
      {/* Table surface */}
      <rect
        x={cx - tw / 2} y={cy - th / 2} width={tw} height={th} rx={7}
        fill={fill} stroke={selected ? "#f0c060" : stroke} strokeWidth={selected ? 2 : 1.5}
      />
      {/* Table number */}
      <text x={cx} y={cy + (sublabel ? -5 : 4)} textAnchor="middle" dominantBaseline="middle"
        fill={textColor} fontSize={12} fontWeight="700" fontFamily="'DM Sans',sans-serif">{label}</text>
      {/* Sublabel (guest name) */}
      {sublabel && (
        <text x={cx} y={cy + 9} textAnchor="middle" dominantBaseline="middle"
          fill={textColor} fontSize={8} fontFamily="'DM Sans',sans-serif" opacity={0.8}>{sublabel}</text>
      )}
    </g>
  )
}

// Billiard table
function BilliardTable({
  id, x, y, w, h, transform,
  strokeColor, strokeWidth,
  overlay,
  pockets, balls, centerLineX,
  label, labelY,
  nameTagY, nameTagText,
  timeTagY, timeTagText,
  onTableClick, sel,
}: {
  id: string; x: number; y: number; w: number; h: number
  transform?: string
  strokeColor: string; strokeWidth: number
  overlay?: string
  pockets: [number, number][]
  balls: { cx: number; cy: number; r: number; fill: string; op: number }[]
  centerLineX: number
  label: string; labelY: number
  nameTagY?: number; nameTagText?: string
  timeTagY?: number; timeTagText?: string
  onTableClick: (id: string) => void; sel: string | null
}) {
  const selected = sel === id
  return (
    <g transform={transform} onClick={() => onTableClick(id)} style={{ cursor: "pointer" }}
      filter={selected ? "brightness(1.2)" : undefined}>
      <text x={x + w / 2} y={labelY} textAnchor="middle"
        fill="rgba(255,255,255,0.10)" fontSize={10} fontFamily="'DM Sans',sans-serif" letterSpacing="0.12em">{label}</text>
      {selected && (
        <rect x={x - 10} y={y - 10} width={w + 20} height={h + 20} rx={7}
          fill="none" stroke="rgba(240,192,96,0.6)" strokeWidth={2} strokeDasharray="5 3" />
      )}
      <rect x={x} y={y} width={w} height={h} rx={6} fill="#1c6e2a" stroke={strokeColor} strokeWidth={strokeWidth} />
      <rect x={x + 5} y={y + 5} width={w - 10} height={h - 10} rx={4} fill="#1e7830" opacity={0.6} />
      {overlay && <rect x={x + 5} y={y + 5} width={w - 10} height={h - 10} rx={4} fill={overlay} />}
      <line x1={centerLineX} y1={y + 5} x2={centerLineX} y2={y + h - 5}
        stroke="rgba(255,255,255,0.12)" strokeWidth={1.5} />
      {pockets.map(([px, py], i) => <circle key={i} cx={px} cy={py} r={7} fill="#0a0a0a" />)}
      {balls.map((b, i) => <circle key={i} cx={b.cx} cy={b.cy} r={b.r} fill={b.fill} opacity={b.op} />)}
      <ellipse cx={x + w / 2} cy={y + h / 2} rx={30} ry={18} fill="rgba(255,200,80,0.06)" />
      {nameTagText && nameTagY && (
        <>
          <rect x={x} y={nameTagY} width={w} height={16} rx={3} fill="#3a6adb" />
          <text x={x + w / 2} y={nameTagY + 11} textAnchor="middle"
            fill="#fff" fontSize={10} fontWeight="bold" fontFamily="'DM Sans',sans-serif">{nameTagText}</text>
        </>
      )}
      {timeTagText && timeTagY && (
        <>
          <rect x={x} y={timeTagY} width={w} height={13} rx={3} fill="rgba(0,0,0,0.45)" />
          <text x={x + w / 2} y={timeTagY + 9} textAnchor="middle"
            fill="#7aadff" fontSize={9} fontFamily="'DM Sans',sans-serif">{timeTagText}</text>
        </>
      )}
    </g>
  )
}

function FloorPlan({
  selId, onTableClick,
}: {
  selId: string | null
  onTableClick: (id: string) => void
  activeArea: string
}) {
  const FREE_FILL = "#d4d4dc"; const FREE_STR = "#b0b0c0"; const FREE_NUM = "#1a1a1a"
  const RES_FILL  = "#3a7bd5"; const RES_STR  = "#2a62b8"; const RES_NUM  = "#fff"
  const PRES_FILL = "#1e8a38"; const PRES_STR = "#166a2a"; const PRES_NUM = "#fff"
  // keep old vars for BilliardTable usage
  const FREE_OP = 1; const RES_OP = 1; const PRES_OP = 1

  const B_BALLS_1 = [
    { cx: 350, cy: 75,  r: 7, fill: "#f0f0f0", op: 0.75 },
    { cx: 380, cy: 90,  r: 6, fill: "#cc2222", op: 0.80 },
    { cx: 330, cy: 105, r: 6, fill: "#f5c842", op: 0.75 },
    { cx: 420, cy: 80,  r: 6, fill: "#1a4adc", op: 0.75 },
    { cx: 440, cy: 120, r: 6, fill: "#f0f0f0", op: 0.55 },
    { cx: 360, cy: 130, r: 5, fill: "#cc2222", op: 0.60 },
    { cx: 410, cy: 110, r: 5, fill: "#f5c842", op: 0.60 },
  ]
  const B_BALLS_2 = B_BALLS_1.map(b => ({ ...b, cx: b.cx + 235 }))
  const B_BALLS_3 = [
    { cx: 820, cy: 200, r: 7, fill: "#f0f0f0", op: 0.75 },
    { cx: 850, cy: 220, r: 6, fill: "#cc2222", op: 0.80 },
    { cx: 800, cy: 240, r: 6, fill: "#f5c842", op: 0.75 },
    { cx: 920, cy: 195, r: 6, fill: "#1a4adc", op: 0.75 },
    { cx: 940, cy: 250, r: 6, fill: "#f0f0f0", op: 0.55 },
    { cx: 870, cy: 260, r: 5, fill: "#cc2222", op: 0.60 },
    { cx: 890, cy: 210, r: 5, fill: "#f5c842", op: 0.60 },
  ]

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <svg
        viewBox="0 0 1000 680"
        preserveAspectRatio="xMidYMid meet"
        width="100%" height="100%"
        style={{
          display: "block", position: "absolute", inset: 0,
          background: "radial-gradient(ellipse 40% 35% at 52% 38%, rgba(255,150,40,0.07) 0%, transparent 65%), #111111",
        }}
      >
        {/* Room border */}
        <rect x={6} y={6} width={988} height={668} rx={5} fill="none" stroke="#222" strokeWidth={1.5} />

        {/* Atmospheric glow */}
        <ellipse cx={430} cy={230} rx={80} ry={40} fill="rgba(255,160,50,0.06)" opacity={0.7} />

        {/* ── BILLARD 1 – Free ── */}
        <BilliardTable id="b1" x={290} y={30} w={210} h={135}
          strokeColor="#7a4e1a" strokeWidth={5}
          pockets={[[294,34],[496,34],[294,162],[496,162],[294,98],[496,98]]}
          balls={B_BALLS_1} centerLineX={395}
          label="BILLARD 1" labelY={22}
          onTableClick={onTableClick} sel={selId} />

        {/* ── BILLARD 2 – Reserved (Michelik) ── */}
        <BilliardTable id="b2" x={525} y={30} w={210} h={135}
          strokeColor="#3a6adb" strokeWidth={4}
          overlay="rgba(58,106,219,0.06)"
          pockets={[[529,34],[731,34],[529,162],[731,162],[529,98],[731,98]]}
          balls={B_BALLS_2} centerLineX={630}
          label="BILLARD 2" labelY={22}
          nameTagY={170} nameTagText="Michelik"
          timeTagY={187} timeTagText="19:15 - 21:15"
          onTableClick={onTableClick} sel={selId} />

        {/* ── BILLARD 3 – Free, diagonal ── */}
        <BilliardTable id="b3" x={755} y={160} w={230} h={130}
          transform="rotate(-32, 870, 270)"
          strokeColor="#7a4e1a" strokeWidth={5}
          pockets={[[759,164],[981,164],[759,290],[981,290],[759,227],[981,227]]}
          balls={B_BALLS_3} centerLineX={870}
          label="BILLARD 3" labelY={155}
          onTableClick={onTableClick} sel={selId} />

        {/* ── Scattered upper area tables ── */}
        {/* TABLE 10 */}
        <ModernTable id="t10" cx={102} cy={67} tw={72} th={38}
          fill={FREE_FILL} stroke={FREE_STR} textColor={FREE_NUM} label="10"
          seatTop={2} seatBottom={2} seatLeft={1} seatRight={1}
          sel={selId} onTableClick={onTableClick} />

        {/* TABLE 52 */}
        <ModernTable id="t52" cx={172} cy={308} tw={72} th={38}
          fill={FREE_FILL} stroke={FREE_STR} textColor={FREE_NUM} label="52"
          seatTop={2} seatBottom={2} seatLeft={1} seatRight={1}
          sel={selId} onTableClick={onTableClick} />

        {/* TABLE 53 */}
        <ModernTable id="t53" cx={344} cy={308} tw={88} th={38}
          fill={FREE_FILL} stroke={FREE_STR} textColor={FREE_NUM} label="53"
          seatTop={3} seatBottom={3} seatLeft={1} seatRight={1}
          sel={selId} onTableClick={onTableClick} />

        {/* TABLE 54 */}
        <ModernTable id="t54" cx={540} cy={308} tw={108} th={44}
          fill={FREE_FILL} stroke={FREE_STR} textColor={FREE_NUM} label="54"
          seatTop={4} seatBottom={4} seatLeft={2} seatRight={2}
          sel={selId} onTableClick={onTableClick} />

        {/* TABLE 50 */}
        <ModernTable id="t50" cx={344} cy={418} tw={72} th={38}
          fill={FREE_FILL} stroke={FREE_STR} textColor={FREE_NUM} label="50"
          seatTop={2} seatBottom={2} seatLeft={1} seatRight={1}
          sel={selId} onTableClick={onTableClick} />

        {/* TABLE 59 */}
        <ModernTable id="t59" cx={726} cy={418} tw={60} th={32}
          fill={FREE_FILL} stroke={FREE_STR} textColor={FREE_NUM} label="59"
          seatTop={2} seatBottom={2} seatLeft={1} seatRight={1}
          sel={selId} onTableClick={onTableClick} />

        {/* TABLE 30 – standalone bottom-left */}
        <ModernTable id="t30" cx={85} cy={490} tw={72} th={38}
          fill={FREE_FILL} stroke={FREE_STR} textColor={FREE_NUM} label="30"
          seatTop={2} seatBottom={2} seatLeft={1} seatRight={1}
          sel={selId} onTableClick={onTableClick} />

        {/* ── Enclosed bottom box ── */}
        <rect x={330} y={490} width={638} height={184} rx={8}
          fill="rgba(18,18,22,0.92)" stroke="#2a2a2a" strokeWidth={1.5} />

        {/* BOX ROW 1 – 61, 60, 67, 66 */}
        <ModernTable id="t61" cx={378} cy={534} tw={68} th={36}
          fill={RES_FILL} stroke={RES_STR} textColor={RES_NUM} label="61" sublabel="Guido"
          seatTop={2} seatBottom={2} seatLeft={1} seatRight={1}
          sel={selId} onTableClick={onTableClick} />
        <ModernTable id="t60" cx={530} cy={534} tw={68} th={36}
          fill={FREE_FILL} stroke={FREE_STR} textColor={FREE_NUM} label="60"
          seatTop={2} seatBottom={2} seatLeft={1} seatRight={1}
          sel={selId} onTableClick={onTableClick} />
        <ModernTable id="t67" cx={681} cy={534} tw={68} th={36}
          fill={FREE_FILL} stroke={FREE_STR} textColor={FREE_NUM} label="67"
          seatTop={2} seatBottom={2} seatLeft={1} seatRight={1}
          sel={selId} onTableClick={onTableClick} />
        <ModernTable id="t66" cx={833} cy={534} tw={68} th={36}
          fill={FREE_FILL} stroke={FREE_STR} textColor={FREE_NUM} label="66"
          seatTop={2} seatBottom={2} seatLeft={1} seatRight={1}
          sel={selId} onTableClick={onTableClick} />

        {/* BOX ROW 2 – 62, 63, 64, 65 */}
        <ModernTable id="t62" cx={378} cy={638} tw={68} th={36}
          fill={RES_FILL} stroke={RES_STR} textColor={RES_NUM} label="62" sublabel="Lentino"
          seatTop={2} seatBottom={2} seatLeft={1} seatRight={1}
          sel={selId} onTableClick={onTableClick} />
        <ModernTable id="t63" cx={530} cy={638} tw={68} th={36}
          fill={RES_FILL} stroke={RES_STR} textColor={RES_NUM} label="63" sublabel="Santos"
          seatTop={2} seatBottom={2} seatLeft={1} seatRight={1}
          sel={selId} onTableClick={onTableClick} />
        <ModernTable id="t64" cx={681} cy={638} tw={68} th={36}
          fill={PRES_FILL} stroke={PRES_STR} textColor={PRES_NUM} label="64" sublabel="Licata"
          seatTop={2} seatBottom={2} seatLeft={1} seatRight={1}
          sel={selId} onTableClick={onTableClick} />
        <ModernTable id="t65" cx={833} cy={638} tw={68} th={36}
          fill={PRES_FILL} stroke={PRES_STR} textColor={PRES_NUM} label="65" sublabel="Gutsch"
          seatTop={2} seatBottom={2} seatLeft={1} seatRight={1}
          sel={selId} onTableClick={onTableClick} />

        {/* ── Rondo logo box ── */}
        <rect x={14} y={545} width={222} height={126} rx={6}
          fill="rgba(10,10,10,0.96)" stroke="#2a2a2a" strokeWidth={1.5} />
        <image
          href="/rondo-logo.png"
          x={20} y={552} width={210} height={112}
          preserveAspectRatio="xMidYMid meet"
        />
      </svg>
    </div>
  )
}

// ─── Booking Form ─────────────────────────────────────────────────────────────

function BookingForm({ tableTitle, onClose }: {
  tableTitle: string
  onClose: () => void
}) {
  const [guest, setGuest]         = useState("")
  const [pax, setPax]             = useState("2")
  const [date, setDate]           = useState("2026-03-08")
  const [startTime, setStartTime] = useState("19:00")
  const [endTime, setEndTime]     = useState("21:00")
  const [note, setNote]           = useState("")
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [error, setError]         = useState("")

  const inp: React.CSSProperties = {
    width: "100%", padding: "8px 10px", fontSize: 13, border: "1px solid #ddd",
    borderRadius: 6, outline: "none", background: "#fff", boxSizing: "border-box", color: "#111",
  }
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: "#555", marginBottom: 4, display: "block" }

  const handleSave = async () => {
    if (!guest || saving) return
    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guest, pax, date, startTime, endTime, note, tableLabel: tableTitle }),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error ?? "Fehler beim Speichern")
      setSaved(true)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (saved) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 12, padding: 24 }}>
      <div style={{ width: 52, height: 52, borderRadius: 26, background: "#e8f5e8", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CheckCheck size={26} color="#2a7a2a" />
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>Reservierung gespeichert!</div>
      <div style={{ fontSize: 12, color: "#888" }}>{tableTitle} · {guest} · {pax} Pers. · {date}</div>
      <button onClick={onClose}
        style={{ marginTop: 8, padding: "9px 24px", borderRadius: 7, background: "#111", color: "#fff", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>
        Schliessen
      </button>
    </div>
  )

  return (
    <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14, flex: 1, overflowY: "auto" }}>
      <div>
        <label style={lbl}>Gastname *</label>
        <input style={inp} placeholder="z.B. Müller, Hans" value={guest} onChange={e => setGuest(e.target.value)} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <label style={lbl}>Personen</label>
          <select style={inp} value={pax} onChange={e => setPax(e.target.value)}>
            {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={String(n)}>{n} Pers.</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Datum</label>
          <input type="date" style={inp} value={date} onChange={e => setDate(e.target.value)} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <label style={lbl}>Von</label>
          <input type="time" style={inp} value={startTime} onChange={e => setStartTime(e.target.value)} />
        </div>
        <div>
          <label style={lbl}>Bis</label>
          <input type="time" style={inp} value={endTime} onChange={e => setEndTime(e.target.value)} />
        </div>
      </div>
      <div>
        <label style={lbl}>Interne Notiz</label>
        <textarea style={{ ...inp, height: 64, resize: "none" }} placeholder="Nicht für Gäste sichtbar..." value={note} onChange={e => setNote(e.target.value)} />
      </div>
      {error && (
        <div style={{ fontSize: 12, color: "#cc3333", background: "#fff5f5", border: "1px solid #ffcccc", borderRadius: 6, padding: "8px 10px" }}>
          {error}
        </div>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button onClick={onClose}
          style={{ flex: 1, padding: "9px 0", borderRadius: 7, background: "#f5f5f5", color: "#555", fontSize: 13, fontWeight: 600, border: "1px solid #ddd", cursor: "pointer" }}>
          Abbrechen
        </button>
        <button
          onClick={handleSave}
          disabled={!guest || saving}
          style={{ flex: 2, padding: "9px 0", borderRadius: 7, background: guest && !saving ? "#1a1a1a" : "#ccc", color: "#fff", fontSize: 13, fontWeight: 700, border: "none", cursor: guest && !saving ? "pointer" : "default" }}>
          {saving ? "Speichern…" : "Reservierung speichern"}
        </button>
      </div>
    </div>
  )
}

// ─── Slide-in Panel ───────────────────────────────────────────────────────────

function SlidePanel({
  data, onClose, showBookingForm, onNewReservation,
}: {
  data: PanelData | null
  onClose: () => void
  showBookingForm: boolean
  onNewReservation: () => void
}) {
  const [mode, setMode] = useState<"view" | "edit" | "book">("view")
  const [note, setNote] = useState("")
  const [checkedIn, setCheckedIn] = useState(false)
  const open = data !== null || showBookingForm

  // Reset mode when a new table is selected
  useEffect(() => { setMode("view"); setCheckedIn(false) }, [data?.title])

  const statusPillStyle = (s: PanelData["status"]): React.CSSProperties => {
    if (s === "Frei")       return { background: "#e8f5e8", color: "#2a7a2a", border: "1px solid #b8d8b8" }
    if (s === "Reserviert") return { background: "#fff3e0", color: "#c07010", border: "1px solid #f0c88a" }
    if (s === "Anwesend")   return { background: "#d4f0d4", color: "#1a6a1a", border: "1px solid #a8d8a8" }
    return { background: "#eee", color: "#666", border: "1px solid #ddd" }
  }

  return (
    <>
      <div onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
          zIndex: 199, opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.25s",
        }}
      />
      <div
        style={{
          position: "fixed", top: 0, bottom: 0,
          right: open ? 0 : -460,
          width: 430,
          background: "#fff",
          borderLeft: "1px solid #e0e0e0",
          zIndex: 200,
          transition: "right 0.3s cubic-bezier(0.25,0.46,0.45,0.94)",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
          boxShadow: open ? "-4px 0 24px rgba(0,0,0,0.12)" : "none",
        }}
      >
        {/* Header */}
        {(data || showBookingForm) && (
          <div style={{ background: "#f8f8f8", borderBottom: "1px solid #eee", padding: "14px 16px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexShrink: 0 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>
                {showBookingForm && !data ? "Neue Reservierung" : mode === "book" ? `${data?.title} – Reservierung` : data?.title}
              </div>
              <div style={{ fontSize: 11, color: "#999", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                <CalendarDays size={11} /> Samstag, 8. März 2026
                {data && (
                  <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 12, ...statusPillStyle(data.status) }}>
                    {checkedIn ? "Anwesend" : data.status}
                  </span>
                )}
              </div>
            </div>
            <button onClick={onClose}
              style={{ width: 28, height: 28, borderRadius: 6, background: "#eee", border: "1px solid #ddd", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#666", flexShrink: 0 }}>
              <X size={13} />
            </button>
          </div>
        )}

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
          {(mode === "book" || showBookingForm) ? (
            <BookingForm
              tableTitle={data?.title ?? "Tisch"}
              onClose={onClose}
            />
          ) : data && (
            <>
              {!data.guest ? (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: "40px 20px", textAlign: "center" }}>
                  <CalendarDays size={36} color="#ccc" />
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#666" }}>Dieser Tisch ist frei</div>
                  <div style={{ fontSize: 12, color: "#bbb" }}>Keine Reservierungen für heute</div>
                  <button onClick={() => setMode("book")}
                    style={{ marginTop: 8, padding: "9px 22px", borderRadius: 7, background: "#1a1a1a", color: "#fff", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>
                    + Reservierung anlegen
                  </button>
                </div>
              ) : (
                <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
                  {/* Reservation card */}
                  <div style={{ background: "#f8f8f8", border: "1px solid #e8e8e8", borderRadius: 8, padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>{data.startTime} – {data.endTime}</span>
                      <span style={{ fontSize: 11, color: "#888" }}>{data.pax} Pers.</span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>{data.guest}</div>
                    <div style={{ fontSize: 10, color: "#bbb", marginTop: 2 }}>RND-{(data.guest.charCodeAt(0) * 137 + 1000) % 9000 + 1000}</div>
                    {/* Action buttons */}
                    <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                      <button onClick={() => setMode("edit")}
                        style={{ flex: 1, padding: "7px 0", borderRadius: 6, border: "1px solid #ddd", background: "#fff", fontSize: 10, fontWeight: 700, color: "#444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                        <Pencil size={11} /> Bearbeiten
                      </button>
                      <button
                        style={{ flex: 1, padding: "7px 0", borderRadius: 6, border: "1px solid #ddd", background: "#fff", fontSize: 10, fontWeight: 700, color: "#444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                        <Mail size={11} /> Mail
                      </button>
                      <button
                        style={{ flex: 1, padding: "7px 0", borderRadius: 6, border: "1px solid #ffcccc", background: "#fff5f5", fontSize: 10, fontWeight: 700, color: "#cc3333", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                        <Ban size={11} /> Stornieren
                      </button>
                    </div>
                  </div>

                  {/* Checkin / Lock / Mail */}
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => setCheckedIn(v => !v)}
                      style={{ flex: 1, padding: "8px 0", borderRadius: 6, background: checkedIn ? "#e8f5e8" : "#fff", border: checkedIn ? "1px solid #a8d8a8" : "1px solid #ddd", fontSize: 10, fontWeight: 700, color: checkedIn ? "#2a7a2a" : "#555", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                      <LogIn size={11} /> {checkedIn ? "Anwesend" : "Einchecken"}
                    </button>
                    <button
                      style={{ flex: 1, padding: "8px 0", borderRadius: 6, background: "#fff", border: "1px solid #ddd", fontSize: 10, fontWeight: 700, color: "#555", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                      <Lock size={11} /> Sperren
                    </button>
                    <button
                      style={{ flex: 1, padding: "8px 0", borderRadius: 6, background: "#fff", border: "1px solid #ddd", fontSize: 10, fontWeight: 700, color: "#555", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                      <Mail size={11} /> Mail
                    </button>
                  </div>

                  {/* Note */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#666", display: "block", marginBottom: 4 }}>Interne Notiz</label>
                    <textarea
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      placeholder="Nicht für Gäste sichtbar..."
                      style={{ width: "100%", height: 60, padding: "8px 10px", fontSize: 11, border: "1px solid #ddd", borderRadius: 6, resize: "none", outline: "none", boxSizing: "border-box", color: "#333" }}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Edit form (inline) */}
          {mode === "edit" && data && (
            <div style={{ padding: "0 16px 16px" }}>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button onClick={() => setMode("view")}
                  style={{ flex: 1, padding: "9px 0", borderRadius: 7, background: "#f5f5f5", color: "#555", fontSize: 12, fontWeight: 600, border: "1px solid #ddd", cursor: "pointer" }}>
                  Abbrechen
                </button>
                <button onClick={() => setMode("view")}
                  style={{ flex: 2, padding: "9px 0", borderRadius: 7, background: "#1a1a1a", color: "#fff", fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer" }}>
                  Änderungen speichern
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer: + Neue Reservierung */}
        {data && mode === "view" && !showBookingForm && (
          <div style={{ background: "#f8f8f8", borderTop: "1px solid #eee", padding: "12px 16px", flexShrink: 0 }}>
            <button onClick={() => setMode("book")}
              style={{ width: "100%", padding: "10px 0", borderRadius: 7, background: "#1a1a1a", color: "#fff", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <CalendarDays size={14} /> + Neue Reservierung
            </button>
          </div>
        )}
      </div>
    </>
  )
}

// ─── Editor Modal Overlay ─────────────────────────────────────────────────────

function EditorModal({ areaId, onClose }: { areaId: string; onClose: () => void }) {
  // Map raumplan area tab id → editor area id
  const AREA_ID_MAP: Record<string, string> = {
    billard: "billard",
    salitos: "salitos",
    rest140: "restaurant140",
    rest75:  "restaurant75",
    vip:     "vip",
  }
  const editorArea = AREA_ID_MAP[areaId] ?? "restaurant140"

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", handler)
    }
  }, [onClose])

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "#0a0a10",
        display: "flex", flexDirection: "column",
        // Ensure full-screen on iPad
        width: "100dvw", height: "100dvh",
        overflow: "hidden",
      }}
    >
      {/* Editor title bar */}
      <div style={{
        height: 48, display: "flex", alignItems: "center",
        background: "#0c0c14", borderBottom: "1px solid rgba(201,168,76,0.12)",
        padding: "0 16px", gap: 12, flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: "#c9a84c", display: "flex", alignItems: "center",
            justifyContent: "center", fontWeight: 900, color: "#0a0a0a",
            fontSize: 15, fontFamily: "'Bebas Neue', cursive",
          }}>R</div>
          <span style={{ color: "#c9a84c", fontFamily: "'Bebas Neue', cursive", fontSize: 17, letterSpacing: "0.1em" }}>
            RONDO
          </span>
          <span style={{ color: "#444", fontSize: 11, marginLeft: 4 }}>/ Grundriss Editor</span>
        </div>
        <div style={{ flex: 1 }} />
        <button
          onClick={onClose}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px", borderRadius: 8,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#888", fontSize: 13, fontWeight: 600,
            cursor: "pointer", minWidth: 44, minHeight: 44,
          }}
        >
          <X size={14} /> Schliessen
        </button>
      </div>

      {/* Embedded editor */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        <EmbeddedEditor initialArea={editorArea} />
      </div>
    </div>
  )
}

// ─── Main Page ───────���────────────────────────────────────────────────────────

export default function RaumplanPage() {
  const [activeArea, setActiveArea] = useState("billard")
  const [panelData, setPanelData] = useState<PanelData | null>(null)
  const [selTableId, setSelTableId] = useState<string | null>(null)
  const [selRowIdx, setSelRowIdx] = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState("")
  const [editorOpen, setEditorOpen] = useState(false)
  const [showBookingForm, setShowBookingForm] = useState(false)

  useEffect(() => {
    const tick = () => {
      const n = new Date()
      setCurrentTime(`${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closePanel() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const closePanel = () => {
    setPanelData(null)
    setSelTableId(null)
    setSelRowIdx(null)
    setShowBookingForm(false)
  }

  const openNewReservation = () => {
    setPanelData(null)
    setShowBookingForm(true)
  }

  const openTable = (id: string) => {
    const d = CANVAS_TABLE_DATA[id] ?? TABLE_DATA[id]
    if (!d) return
    setPanelData({
      title:     d.title,
      area:      activeArea,
      status:    d.status as PanelData["status"],
      guest:     d.guest,
      startTime: d.startTime,
      endTime:   d.endTime,
      pax:       d.pax,
    })
    setSelTableId(id)
  }

  const openRow = (idx: number, row: typeof RESERVATION_ROWS[0]) => {
    setSelRowIdx(idx)
    setSelTableId(null)
    setShowBookingForm(false)
    // Build panel data directly from the row — no stale table key mapping
    const status: PanelData["status"] =
      row.status === "double-check" || row.status === "check" ? "Anwesend"
      : row.status === "check-pause" ? "Anwesend"
      : row.status === "ob" ? "Reserviert"
      : "Reserviert"
    setPanelData({
      title: `Tisch ${row.table}`,
      area: "Restaurant 140 Zoll",
      status,
      guest: row.name,
      startTime: row.time,
      endTime: row.offset,
      pax: String(row.guests),
    })
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", overflow: "hidden", fontFamily: "'DM Sans', sans-serif", background: "#111" }}>
      <Topbar currentTime={currentTime} />

      {/* Body — ReservationPanel stretches full height from Topbar down */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Left: reservation list — full height */}
        <ReservationPanel selectedRow={selRowIdx} onRowClick={openRow} onNewReservation={openNewReservation} />

        {/* Right: area tabs bar + floor plan stacked */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <AreaTabsBar activeArea={activeArea} setActiveArea={setActiveArea} />
          <div style={{ flex: 1, background: "#111111", overflow: "hidden" }}>
            <FloorPlan selId={selTableId} onTableClick={openTable} activeArea={activeArea} />
          </div>
        </div>

      </div>

      <SlidePanel data={panelData} onClose={closePanel} showBookingForm={showBookingForm} onNewReservation={openNewReservation} />

      {/* Full-screen editor modal */}
      {editorOpen && (
        <EditorModal areaId={activeArea} onClose={() => setEditorOpen(false)} />
      )}
    </div>
  )
}
