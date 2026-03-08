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
        <div style={{
          width: 32, height: 32, borderRadius: 6, background: "#f5a623",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 900, color: "#fff", fontSize: 18,
        }}>R</div>
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

function AreaTabsBar({ activeArea, setActiveArea, onEditClick }: {
  activeArea: string
  setActiveArea: (id: string) => void
  onEditClick: () => void
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

      {/* Edit button */}
      <div className="flex items-center px-3" style={{ borderLeft: SEP, flexShrink: 0 }}>
        <button
          onClick={onEditClick}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            fontSize: 12, color: "#c9a84c", padding: "6px 10px",
            border: "1px solid rgba(201,168,76,0.35)", borderRadius: 5,
            background: "rgba(201,168,76,0.08)", cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          <PencilRuler size={12} /> Grundriss bearbeiten
        </button>
      </div>
    </div>
  )
}

// ─── Reservation List Panel ────────────────────────────────────────────────────

function ReservationPanel({
  selectedRow,
  onRowClick,
}: {
  selectedRow: number | null
  onRowClick: (idx: number, row: typeof RESERVATION_ROWS[0]) => void
}) {
  const [resTab, setResTab] = useState<"reservierungsliste" | "warteliste">("reservierungsliste")
  const [subTab, setSubTab] = useState<"platziert" | "bevorstehend" | "achtung">("bevorstehend")

  return (
    <div style={{ width: 390, minWidth: 390, background: "#f2f2f2", borderRight: "1px solid #ddd", display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* Sub-header tabs: Reservierungsliste / Warteliste */}
      <div style={{ height: 42, background: "#1e1e1e", borderBottom: "1px solid #2a2a2a", display: "flex", alignItems: "center", padding: "0 12px", gap: 4, flexShrink: 0 }}>
        {[
          { key: "reservierungsliste" as const, label: "Reservierungsliste", badge: "18", badgeBg: "#3a8c3a" },
          { key: "warteliste" as const,         label: "Warteliste",         badge: null, badgeBg: "" },
        ].map(t => {
          const active = resTab === t.key
          return (
            <button key={t.key} onClick={() => setResTab(t.key)}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 6,
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                background: active ? "rgba(255,255,255,0.12)" : "transparent",
                color: active ? "#fff" : "#888", border: "none",
              }}>
              {t.badge && (
                <span style={{ background: t.badgeBg, color: "#fff", fontSize: 10, fontWeight: 800, padding: "1px 6px", borderRadius: 10 }}>
                  {t.badge}
                </span>
              )}
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Sub-tabs: Platziert / Bevorsteh. / Achtung */}
      <div style={{ display: "flex", borderBottom: "2px solid #ddd", padding: "0 12px", flexShrink: 0, background: "#f2f2f2" }}>
        {[
          { key: "platziert" as const,    label: "Platziert",  count: "29", badgeBg: "#2a7a2a", icon: <Users size={11} /> },
          { key: "bevorstehend" as const, label: "Bevorsteh.", count: "31", badgeBg: "#333",    icon: <Users size={11} /> },
          { key: "achtung" as const,      label: "Achtung",    count: "2",  badgeBg: "#cc5500", icon: <AlertCircle size={11} /> },
        ].map(t => {
          const active = subTab === t.key
          return (
            <button key={t.key} onClick={() => setSubTab(t.key)}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "10px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                color: active ? "#111" : "#888", background: "transparent", border: "none",
                borderBottom: active ? "2px solid #111" : "2px solid transparent",
                marginBottom: -2,
              }}>
              <span style={{ background: t.badgeBg, color: "#fff", fontSize: 10, fontWeight: 800, padding: "1px 5px", borderRadius: 10, display: "flex", alignItems: "center", gap: 3 }}>
                {t.icon} {t.count}
              </span>
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Column headers */}
      <div style={{
        display: "flex", alignItems: "center", padding: "8px 14px", gap: 8,
        background: "#f2f2f2", borderBottom: "1px solid #ddd", flexShrink: 0,
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#333", textTransform: "uppercase", letterSpacing: "0.04em" }}>UHRZEIT</span>
        <span style={{ fontSize: 11, color: "#888" }}>↓</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#333", textTransform: "uppercase", letterSpacing: "0.04em" }}>GAST</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#333", textTransform: "uppercase", letterSpacing: "0.04em", marginLeft: 8 }}>NAME</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <Settings size={14} color="#666" style={{ cursor: "pointer" }} />
          <HelpCircle size={14} color="#666" style={{ cursor: "pointer" }} />
          <Bell size={14} color="#666" style={{ cursor: "pointer" }} />
        </div>
      </div>

      {/* Group label */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "8px 14px", borderBottom: "1px solid #e0e0e0",
        background: "#f2f2f2", flexShrink: 0,
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#333", textTransform: "uppercase", letterSpacing: "0.04em" }}>ABENDESSEN</span>
        <span style={{ fontSize: 11, color: "#666" }}>Gesamt 8</span>
        <span style={{ fontSize: 11, color: "#666", display: "flex", alignItems: "center", gap: 3 }}><Users size={11} /> 31</span>
      </div>

      {/* Rows */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {RESERVATION_ROWS.map((row, idx) => {
          const isSelected = selectedRow === idx
          const isHighlighted = row.highlighted
          return (
            <div
              key={idx}
              onClick={() => onRowClick(idx, row)}
              style={{
                display: "grid",
                gridTemplateColumns: "80px 32px 1fr auto",
                alignItems: "center",
                gap: 8,
                padding: "0 14px",
                minHeight: 62,
                borderBottom: "1px solid #e0e0e0",
                borderLeft: isHighlighted ? "3px solid #2a7a2a" : isSelected ? "3px solid #999" : "3px solid transparent",
                background: isSelected ? "#eaeaea" : isHighlighted ? "#e8f0e8" : "#fff",
                cursor: "pointer",
                transition: "background 0.12s",
              }}
              onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = "#eaeaea" }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.background = isSelected ? "#eaeaea" : isHighlighted ? "#e8f0e8" : "#fff"
              }}
            >
              {/* Col 1: Time */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{row.time}</div>
                <div style={{ fontSize: 11, color: "#888" }}>{row.offset}</div>
              </div>

              {/* Col 2: Guest count */}
              <div style={{ fontSize: 13, fontWeight: 700, color: "#111", textAlign: "center" }}>{row.guests}</div>

              {/* Col 3: Name + table */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#111" }}>{row.name}</div>
                <div style={{ fontSize: 11, color: "#888" }}>{row.table}</div>
              </div>

              {/* Col 4: Status */}
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {row.status === "ob" && (
                  <span style={{ background: "#e07820", color: "#fff", fontSize: 9, fontWeight: 800, padding: "2px 5px", borderRadius: 4 }}>OB</span>
                )}
                {row.status === "double-check" && (
                  <CheckCheck size={15} color="#2a7a2a" strokeWidth={2.5} />
                )}
                {row.status === "check" && (
                  <Check size={15} color="#2a7a2a" strokeWidth={2.5} />
                )}
                {row.status === "check-pause" && (
                  <>
                    <Check size={14} color="#2a7a2a" strokeWidth={2.5} />
                    <PauseCircle size={13} color="#888" strokeWidth={2} />
                  </>
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

// Chair helper used by cross-tables
function Chair({ x, y, w, h, fill, opacity }: { x: number; y: number; w: number; h: number; fill: string; opacity: number }) {
  return <rect x={x} y={y} width={w} height={h} rx={3} fill={fill} opacity={opacity} />
}

// Cross-shaped restaurant table
function CrossTable({
  id, vx, vy, vw, vh, hx, hy, hw, hh,
  fill, opacity, numColor, numLabel, numX, numY,
  chairs, onTableClick, sel,
  nameTag, timeBadge,
}: {
  id: string
  vx: number; vy: number; vw: number; vh: number
  hx: number; hy: number; hw: number; hh: number
  fill: string; opacity: number; numColor: string; numLabel: string
  numX: number; numY: number
  chairs: { x: number; y: number; w: number; h: number }[]
  onTableClick: (id: string) => void
  sel: string | null
  nameTag?: { text: string; rx: number; ry: number; rw: number; rh: number; fill: string }
  timeBadge?: { text: string; rx: number; ry: number; rw: number; rh: number; color: string }
}) {
  const selected = sel === id
  return (
    <g
      onClick={() => onTableClick(id)}
      style={{ cursor: "pointer" }}
      filter={selected ? "brightness(1.25)" : undefined}
    >
      {chairs.map((c, i) => (
        <Chair key={i} x={c.x} y={c.y} w={c.w} h={c.h} fill={fill} opacity={opacity * 0.55} />
      ))}
      {selected && (
        <rect x={hx - 8} y={vy - 8} width={hw + 16} height={vh + 16} rx={6}
          fill="none" stroke="rgba(240,192,96,0.65)" strokeWidth={2} strokeDasharray="5 3" />
      )}
      <rect x={vx} y={vy} width={vw} height={vh} rx={5} fill={fill} opacity={opacity} />
      <rect x={hx} y={hy} width={hw} height={hh} rx={5} fill={fill} opacity={opacity} />
      {timeBadge && (
        <>
          <rect x={timeBadge.rx} y={timeBadge.ry} width={timeBadge.rw} height={timeBadge.rh} rx={3} fill="rgba(0,0,0,0.6)" />
          <text x={timeBadge.rx + timeBadge.rw / 2} y={timeBadge.ry + 9} textAnchor="middle"
            fill={timeBadge.color} fontSize={9} fontWeight="bold" fontFamily="'DM Sans',sans-serif">{timeBadge.text}</text>
        </>
      )}
      <text x={numX} y={numY} textAnchor="middle" dominantBaseline="middle"
        fill={numColor} fontSize={13} fontWeight="bold" fontFamily="'DM Sans',sans-serif">{numLabel}</text>
      {nameTag && (
        <>
          <rect x={nameTag.rx} y={nameTag.ry} width={nameTag.rw} height={nameTag.rh} rx={3} fill={nameTag.fill} />
          <text x={nameTag.rx + nameTag.rw / 2} y={nameTag.ry + 10} textAnchor="middle"
            fill="#fff" fontSize={10} fontWeight="bold" fontFamily="'DM Sans',sans-serif">{nameTag.text}</text>
        </>
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
  const FREE_FILL   = "#d4d4dc"; const FREE_OP   = 0.88; const FREE_NUM   = "#222"
  const RES_FILL    = "#3a7bd5"; const RES_OP    = 0.92; const RES_NUM    = "#fff"
  const PRES_FILL   = "#1e8a38"; const PRES_OP   = 0.95; const PRES_NUM   = "#fff"

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

        {/* ── TABLE 10 – free, top-left ── */}
        <CrossTable id="t10"
          vx={88} vy={28} vw={28} vh={76} hx={62} hy={50} hw={80} hh={32}
          fill={FREE_FILL} opacity={FREE_OP} numColor={FREE_NUM} numLabel="10" numX={102} numY={71}
          chairs={[{x:60,y:55,w:10,h:14},{x:134,y:55,w:10,h:14},{x:94,y:20,w:16,h:8},{x:94,y:102,w:16,h:8}]}
          onTableClick={onTableClick} sel={selId} />

        {/* ── TABLE 52 – free ── */}
        <CrossTable id="t52"
          vx={158} vy={278} vw={26} vh={60} hx={130} hy={296} hw={82} hh={24}
          fill={FREE_FILL} opacity={FREE_OP} numColor={FREE_NUM} numLabel="52" numX={171} numY={312}
          chairs={[{x:128,y:300,w:10,h:12},{x:206,y:300,w:10,h:12},{x:165,y:270,w:14,h:8},{x:165,y:336,w:14,h:8}]}
          onTableClick={onTableClick} sel={selId} />

        {/* ── TABLE 53 – free (wider) ── */}
        <CrossTable id="t53"
          vx={330} vy={278} vw={28} vh={60} hx={296} hy={296} hw={96} hh={24}
          fill={FREE_FILL} opacity={FREE_OP} numColor={FREE_NUM} numLabel="53" numX={344} numY={312}
          chairs={[
            {x:293,y:299,w:10,h:12},{x:382,y:299,w:10,h:12},
            {x:306,y:270,w:14,h:8},{x:334,y:270,w:14,h:8},{x:362,y:270,w:14,h:8},
            {x:306,y:336,w:14,h:8},{x:334,y:336,w:14,h:8},{x:362,y:336,w:14,h:8},
          ]}
          onTableClick={onTableClick} sel={selId} />

        {/* ── TABLE 54 – free (largest) ── */}
        <CrossTable id="t54"
          vx={522} vy={272} vw={34} vh={72} hx={480} hy={292} hw={118} hh={32}
          fill={FREE_FILL} opacity={FREE_OP} numColor={FREE_NUM} numLabel="54" numX={539} numY={312}
          chairs={[
            {x:476,y:296,w:10,h:12},{x:476,y:314,w:10,h:12},
            {x:592,y:296,w:10,h:12},{x:592,y:314,w:10,h:12},
            {x:492,y:264,w:14,h:8},{x:514,y:264,w:14,h:8},{x:536,y:264,w:14,h:8},{x:558,y:264,w:14,h:8},
            {x:492,y:342,w:14,h:8},{x:514,y:342,w:14,h:8},{x:536,y:342,w:14,h:8},{x:558,y:342,w:14,h:8},
          ]}
          onTableClick={onTableClick} sel={selId} />

        {/* ── TABLE 51 – free ── */}
        <CrossTable id="t51"
          vx={158} vy={388} vw={26} vh={60} hx={130} hy={406} hw={82} hh={24}
          fill={FREE_FILL} opacity={FREE_OP} numColor={FREE_NUM} numLabel="51" numX={171} numY={422}
          chairs={[{x:128,y:410,w:10,h:12},{x:206,y:410,w:10,h:12},{x:165,y:380,w:14,h:8},{x:165,y:446,w:14,h:8}]}
          onTableClick={onTableClick} sel={selId} />

        {/* ── TABLE 50 – free ── */}
        <CrossTable id="t50"
          vx={330} vy={388} vw={26} vh={60} hx={302} hy={406} hw={82} hh={24}
          fill={FREE_FILL} opacity={FREE_OP} numColor={FREE_NUM} numLabel="50" numX={343} numY={422}
          chairs={[{x:300,y:410,w:10,h:12},{x:378,y:410,w:10,h:12},{x:338,y:380,w:14,h:8},{x:338,y:446,w:14,h:8}]}
          onTableClick={onTableClick} sel={selId} />

        {/* ── TABLE 58 – free (wider) ── */}
        <CrossTable id="t58"
          vx={516} vy={388} vw={28} vh={60} hx={482} hy={406} hw={96} hh={24}
          fill={FREE_FILL} opacity={FREE_OP} numColor={FREE_NUM} numLabel="58" numX={530} numY={422}
          chairs={[
            {x:480,y:409,w:10,h:12},{x:572,y:409,w:10,h:12},
            {x:492,y:380,w:14,h:8},{x:514,y:380,w:14,h:8},{x:536,y:380,w:14,h:8},
            {x:492,y:446,w:14,h:8},{x:514,y:446,w:14,h:8},{x:536,y:446,w:14,h:8},
          ]}
          onTableClick={onTableClick} sel={selId} />

        {/* ── TABLE 59 – free (far right) ── */}
        <CrossTable id="t59"
          vx={720} vy={400} vw={22} vh={48} hx={698} hy={416} hw={66} hh={20}
          fill={FREE_FILL} opacity={FREE_OP} numColor={FREE_NUM} numLabel="59" numX={731} numY={430}
          chairs={[{x:696,y:419,w:9,h:10},{x:759,y:419,w:9,h:10},{x:726,y:393,w:12,h:7},{x:726,y:446,w:12,h:7}]}
          onTableClick={onTableClick} sel={selId} />

        {/* ── TABLE 30 – free, bottom-left, outside box ── */}
        <CrossTable id="t30"
          vx={72} vy={460} vw={26} vh={60} hx={46} hy={478} hw={78} hh={24}
          fill={FREE_FILL} opacity={FREE_OP} numColor={FREE_NUM} numLabel="30" numX={85} numY={494}
          chairs={[{x:44,y:482,w:10,h:12},{x:118,y:482,w:10,h:12},{x:78,y:452,w:14,h:8},{x:78,y:518,w:14,h:8}]}
          onTableClick={onTableClick} sel={selId} />

        {/* ── Plant ── */}
        <text x={272} y={540} fontSize={38} textAnchor="middle">🌿</text>

        {/* ── Enclosed bottom box ── */}
        <rect x={330} y={490} width={638} height={184} rx={5}
          fill="rgba(14,14,16,0.88)" stroke="#2a2a2a" strokeWidth={2} />

        {/* BOX ROW 1 – tables 61, 60, 67, 66 */}

        {/* TABLE 61 – reserved (Guido) */}
        <CrossTable id="t61"
          vx={366} vy={506} vw={24} vh={58} hx={338} hy={524} hw={80} hh={22}
          fill={RES_FILL} opacity={RES_OP} numColor={RES_NUM} numLabel="61" numX={378} numY={538}
          chairs={[{x:336,y:528,w:10,h:10},{x:412,y:528,w:10,h:10},{x:371,y:498,w:14,h:8},{x:371,y:562,w:14,h:8}]}
          nameTag={{ text: "2 | Guido", rx: 338, ry: 572, rw: 80, rh: 15, fill: RES_FILL }}
          onTableClick={onTableClick} sel={selId} />

        {/* TABLE 60 – free */}
        <CrossTable id="t60"
          vx={518} vy={506} vw={24} vh={58} hx={490} hy={524} hw={80} hh={22}
          fill={FREE_FILL} opacity={FREE_OP} numColor={FREE_NUM} numLabel="60" numX={530} numY={538}
          chairs={[{x:488,y:528,w:10,h:10},{x:564,y:528,w:10,h:10},{x:524,y:498,w:14,h:8},{x:524,y:562,w:14,h:8}]}
          onTableClick={onTableClick} sel={selId} />

        {/* TABLE 67 – free */}
        <CrossTable id="t67"
          vx={668} vy={506} vw={24} vh={58} hx={640} hy={524} hw={80} hh={22}
          fill={FREE_FILL} opacity={FREE_OP} numColor={FREE_NUM} numLabel="67" numX={680} numY={538}
          chairs={[{x:638,y:528,w:10,h:10},{x:714,y:528,w:10,h:10},{x:674,y:498,w:14,h:8},{x:674,y:562,w:14,h:8}]}
          onTableClick={onTableClick} sel={selId} />

        {/* TABLE 66 – free */}
        <CrossTable id="t66"
          vx={820} vy={506} vw={24} vh={58} hx={792} hy={524} hw={80} hh={22}
          fill={FREE_FILL} opacity={FREE_OP} numColor={FREE_NUM} numLabel="66" numX={832} numY={538}
          chairs={[{x:790,y:528,w:10,h:10},{x:866,y:528,w:10,h:10},{x:826,y:498,w:14,h:8},{x:826,y:562,w:14,h:8}]}
          onTableClick={onTableClick} sel={selId} />

        {/* BOX ROW 2 – tables 62, 63, 64, 65 */}

        {/* TABLE 62 – reserved (Lentino) */}
        <CrossTable id="t62"
          vx={366} vy={618} vw={24} vh={42} hx={338} hy={632} hw={80} hh={20}
          fill={RES_FILL} opacity={RES_OP} numColor={RES_NUM} numLabel="62" numX={378} numY={645}
          chairs={[{x:336,y:636,w:10,h:9},{x:412,y:636,w:10,h:9},{x:371,y:612,w:14,h:6},{x:371,y:658,w:14,h:6}]}
          nameTag={{ text: "3 | Lentino", rx: 338, ry: 666, rw: 80, rh: 15, fill: RES_FILL }}
          onTableClick={onTableClick} sel={selId} />

        {/* TABLE 63 – reserved (Santos d.) */}
        <CrossTable id="t63"
          vx={518} vy={618} vw={24} vh={42} hx={490} hy={632} hw={80} hh={20}
          fill={RES_FILL} opacity={RES_OP} numColor={RES_NUM} numLabel="63" numX={530} numY={645}
          chairs={[{x:488,y:636,w:10,h:9},{x:564,y:636,w:10,h:9},{x:524,y:612,w:14,h:6},{x:524,y:658,w:14,h:6}]}
          nameTag={{ text: "4 | Santos d.", rx: 490, ry: 666, rw: 80, rh: 15, fill: RES_FILL }}
          onTableClick={onTableClick} sel={selId} />

        {/* TABLE 64 – present (Licata, 19:30) */}
        <CrossTable id="t64"
          vx={668} vy={615} vw={24} vh={44} hx={640} hy={630} hw={80} hh={22}
          fill={PRES_FILL} opacity={PRES_OP} numColor={PRES_NUM} numLabel="64" numX={680} numY={644}
          chairs={[{x:638,y:634,w:10,h:10},{x:714,y:634,w:10,h:10},{x:674,y:608,w:14,h:7},{x:674,y:657,w:14,h:7}]}
          timeBadge={{ text: "19:30", rx: 652, ry: 606, rw: 46, rh: 13, color: "#5de88a" }}
          nameTag={{ text: "2 | Licata", rx: 640, ry: 665, rw: 80, rh: 15, fill: PRES_FILL }}
          onTableClick={onTableClick} sel={selId} />

        {/* TABLE 65 – present (Gutsch, 20:00) */}
        <CrossTable id="t65"
          vx={820} vy={615} vw={24} vh={44} hx={792} hy={630} hw={80} hh={22}
          fill={PRES_FILL} opacity={PRES_OP} numColor={PRES_NUM} numLabel="65" numX={832} numY={644}
          chairs={[{x:790,y:634,w:10,h:10},{x:866,y:634,w:10,h:10},{x:826,y:608,w:14,h:7},{x:826,y:657,w:14,h:7}]}
          timeBadge={{ text: "20:00", rx: 806, ry: 606, rw: 46, rh: 13, color: "#5de88a" }}
          nameTag={{ text: "4 | Gutsch", rx: 792, ry: 665, rw: 80, rh: 15, fill: PRES_FILL }}
          onTableClick={onTableClick} sel={selId} />

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

// ─── Slide-in Panel ───────────────────────────────────────────────────────────

function SlidePanel({ data, onClose }: { data: PanelData | null; onClose: () => void }) {
  const open = data !== null

  const statusPillStyle = (s: PanelData["status"]): React.CSSProperties => {
    if (s === "Frei")       return { background: "#e8f5e8", color: "#2a7a2a", border: "1px solid #b8d8b8" }
    if (s === "Reserviert") return { background: "#fff3e0", color: "#e07820", border: "1px solid #f0c88a" }
    if (s === "Anwesend")   return { background: "#e8f5e8", color: "#2a7a2a", border: "1px solid #b8d8b8" }
    return { background: "#eee", color: "#666", border: "1px solid #ddd" }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
          zIndex: 199, opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.3s",
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: "fixed", top: 0, bottom: 0,
          right: open ? 0 : -440,
          width: 420,
          background: "#fff",
          borderLeft: "1px solid #ddd",
          zIndex: 200,
          transition: "right 0.3s cubic-bezier(0.25,0.46,0.45,0.94)",
          display: "flex", flexDirection: "column",
          overflowY: "auto",
        }}
      >
        {data && (
          <>
            {/* Header */}
            <div style={{ background: "#f8f8f8", borderBottom: "1px solid #eee", padding: "16px 18px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#111" }}>{data.title}</div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{data.area}</div>
              </div>
              <button onClick={onClose}
                style={{ width: 28, height: 28, borderRadius: 6, background: "#eee", border: "1px solid #ddd", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#666" }}>
                ✕
              </button>
            </div>

            {/* Date row */}
            <div style={{ padding: "10px 18px", borderBottom: "1px solid #eee", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#333", display: "flex", alignItems: "center", gap: 5 }}><CalendarDays size={13} /> Samstag, 8. März 2026</span>
              <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, ...statusPillStyle(data.status) }}>
                {data.status}
              </span>
            </div>

            {/* Body */}
            <div style={{ padding: "14px 18px", flex: 1 }}>
              {!data.guest ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#aaa", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                  <CalendarDays size={36} color="#ccc" />
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#666" }}>Keine Reservierungen heute</div>
                  <div style={{ fontSize: 12, color: "#aaa" }}>Dieser Tisch ist frei verfügbar</div>
                </div>
              ) : (
                <div style={{ background: "#f8f8f8", border: "1px solid #e8e8e8", borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: "#111" }}>{data.startTime} – {data.endTime}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 12, ...statusPillStyle(data.status) }}>{data.status}</span>
                      <span style={{ fontSize: 11, color: "#888" }}>{data.pax} Pers.</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>{data.guest}</div>
                  <div style={{ fontSize: 11, color: "#999", marginTop: 3 }}>RND-{Math.floor(Math.random() * 9000 + 1000)}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                    {[
                      { label: "Bearbeiten", icon: <Pencil size={11} /> },
                      { label: "Mail",       icon: <Mail size={11} /> },
                      { label: "Stornieren", icon: <Ban size={11} /> },
                    ].map(b => (
                      <button key={b.label}
                        style={{ flex: 1, padding: 7, borderRadius: 6, border: "1px solid #ddd", background: "#fff", fontSize: 10, fontWeight: 700, color: "#666", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                        {b.icon} {b.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ background: "#f8f8f8", borderTop: "1px solid #eee", padding: "14px 18px", flexShrink: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              <button style={{ width: "100%", padding: "10px 0", borderRadius: 7, background: "#2a2a2a", color: "#fff", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>
                + Neue Reservierung
              </button>
              <div style={{ display: "flex", gap: 6 }}>
                {[
                  { label: "Einchecken", icon: <LogIn size={11} /> },
                  { label: "Sperren",    icon: <Lock size={11} /> },
                  { label: "Mail",       icon: <Mail size={11} /> },
                ].map(b => (
                  <button key={b.label}
                    style={{ flex: 1, padding: "7px 0", borderRadius: 6, background: "#fff", border: "1px solid #ddd", fontSize: 10, fontWeight: 700, color: "#666", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                    {b.icon} {b.label}
                  </button>
                ))}
              </div>
              <textarea
                placeholder="Interne Notiz (nicht für Gäste sichtbar)..."
                style={{ width: "100%", height: 52, padding: "8px 10px", fontSize: 11, border: "1px solid #ddd", borderRadius: 6, resize: "none", outline: "none", boxSizing: "border-box" }}
              />
            </div>
          </>
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
    // Map table ref to panel data
    const tableKey = row.table.includes("64") ? "t64"
      : row.table.includes("65") ? "t65"
      : row.table.includes("2") ? "t61"
      : row.table.includes("3") ? "t63"
      : row.table.includes("6") ? "t58"
      : row.table.includes("1") ? "t51"
      : "t50"
    setPanelData(TABLE_DATA[tableKey] ?? {
      title: `Tisch ${row.table}`,
      area: "Restaurant 140 Zoll",
      status: "Reserviert",
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
        <ReservationPanel selectedRow={selRowIdx} onRowClick={openRow} />

        {/* Right: area tabs bar + floor plan stacked */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <AreaTabsBar activeArea={activeArea} setActiveArea={setActiveArea} onEditClick={() => setEditorOpen(true)} />
          <div style={{ flex: 1, background: "#111111", overflow: "hidden" }}>
            <FloorPlan selId={selTableId} onTableClick={openTable} activeArea={activeArea} />
          </div>
        </div>

      </div>

      <SlidePanel data={panelData} onClose={closePanel} />

      {/* Full-screen editor modal */}
      {editorOpen && (
        <EditorModal areaId={activeArea} onClose={() => setEditorOpen(false)} />
      )}
    </div>
  )
}
