"use client"
import { useEffect, useRef, useState } from "react"

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
  free:    { fill: "#d0d0d8", stroke: "#b0b0c0", text: "#333" },
  reserved:{ fill: "#c9a84c", stroke: "#a8883a", text: "#111" },
  present: { fill: "#2a8a2a", stroke: "#1e6e1e", text: "#fff" },
  booked:  { fill: "#3a7bd5", stroke: "#2a62b8", text: "#fff" },
  blocked: { fill: "#922",    stroke: "#611",    text: "#fff" },
}

// ─── Topbar ────────────────────────────────────────────────────────────────────

function Topbar({ currentTime }: { currentTime: string }) {
  const SEP = "1px solid #2a2a2a"
  const iconBtn = {
    width: 32, height: 32, borderRadius: 5, display: "flex", alignItems: "center",
    justifyContent: "center", cursor: "pointer", color: "#888", background: "transparent",
    border: "none", fontSize: 16,
  } as const

  return (
    <div
      className="flex items-stretch flex-shrink-0"
      style={{ height: 52, background: "#111111", borderBottom: SEP, userSelect: "none" }}
    >
      {/* A – Logo */}
      <div className="flex items-center gap-2 px-3" style={{ borderRight: SEP }}>
        <button style={{ ...iconBtn, fontSize: 18 }}>☰</button>
        <div style={{
          width: 32, height: 32, borderRadius: 6, background: "#f5a623",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 900, color: "#fff", fontSize: 18,
        }}>Q</div>
      </div>

      {/* B – Jetzt */}
      <div className="flex items-center gap-1.5 px-3" style={{ borderRight: SEP, cursor: "pointer" }}>
        <span style={{ fontSize: 16 }}>📅</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>Jetzt</span>
        <span style={{ color: "#888", fontSize: 14, marginLeft: 2 }}>‹</span>
      </div>

      {/* C – Date nav */}
      <div className="flex items-center" style={{ borderRight: SEP }}>
        <button className="flex items-center justify-center" style={{ ...iconBtn, width: 30 }}>‹</button>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#fff", padding: "0 8px", whiteSpace: "nowrap" }}>Sa., 7 März</span>
        <button className="flex items-center justify-center" style={{ ...iconBtn, width: 30 }}>›</button>
      </div>

      {/* D – Meal period */}
      <div className="flex items-center" style={{ borderRight: SEP }}>
        <button className="flex items-center justify-center" style={{ ...iconBtn, width: 20, fontSize: 13 }}>‹</button>
        <span style={{ fontSize: 13, fontWeight: 500, color: "#fff", padding: "0 6px", whiteSpace: "nowrap" }}>Abendessen</span>
        <button className="flex items-center justify-center" style={{ ...iconBtn, width: 20, fontSize: 13 }}>›</button>
      </div>

      {/* E – Time */}
      <div className="flex items-center" style={{ borderRight: SEP }}>
        <button className="flex items-center justify-center" style={{ ...iconBtn, width: 30 }}>‹</button>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", padding: "0 10px", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
          {currentTime}
        </span>
        <button className="flex items-center justify-center" style={{ ...iconBtn, width: 30 }}>›</button>
      </div>

      {/* F – Right icons */}
      <div className="flex items-stretch ml-auto">
        {[
          { icon: "☁",  label: "Sync" },
          { icon: "📈", label: "Stats" },
        ].map(g => (
          <button key={g.label} className="flex items-center justify-center"
            style={{ ...iconBtn, height: "100%", padding: "0 12px", borderLeft: SEP, borderRadius: 0 }}>
            <span style={{ fontSize: 16 }}>{g.icon}</span>
          </button>
        ))}
        <div className="flex items-center gap-1 px-3" style={{ borderLeft: SEP }}>
          <span style={{ fontSize: 12, color: "#ccc" }}>👥</span>
          <span style={{ fontSize: 12, color: "#ccc" }}>37/<span style={{ fontWeight: 700, color: "#fff" }}>68</span></span>
        </div>
        {["👤", "⏱", "🕐", "📋"].map(icon => (
          <button key={icon} className="flex items-center justify-center"
            style={{ ...iconBtn, height: "100%", padding: "0 10px", borderLeft: SEP, borderRadius: 0 }}>
            <span style={{ fontSize: 15 }}>{icon}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Area Tabs Bar ─────────────────────────────────────────────────────────────

function AreaTabsBar({ activeArea, setActiveArea }: { activeArea: string; setActiveArea: (id: string) => void }) {
  const SEP = "1px solid #2a2a2a"
  return (
    <div
      className="flex items-stretch flex-shrink-0"
      style={{ height: 44, background: "#1e1e1e", borderBottom: SEP, overflow: "hidden" }}
    >
      {/* Scrollable tabs */}
      <div className="flex items-stretch flex-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
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
                borderBottom: active ? "2px solid #fff" : "2px solid transparent",
                borderRight: SEP,
                whiteSpace: "nowrap",
                flexShrink: 0,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.color = "#ccc"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)" }}}
              onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.color = "#888"; (e.currentTarget as HTMLButtonElement).style.background = "transparent" }}}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      {/* Ansicht toggle */}
      <div className="flex items-center px-3" style={{ borderLeft: SEP, flexShrink: 0 }}>
        <button style={{
          fontSize: 12, color: "#888", padding: "6px 10px",
          border: "1px solid #333", borderRadius: 5, background: "transparent", cursor: "pointer",
          whiteSpace: "nowrap",
        }}>
          👁 Ansicht ändern
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
          { key: "platziert" as const,    label: "Platziert",   badge: "👥 29", badgeBg: "#2a7a2a" },
          { key: "bevorstehend" as const, label: "Bevorsteh.",  badge: "👥 31", badgeBg: "#333" },
          { key: "achtung" as const,      label: "Achtung",     badge: "2",     badgeBg: "#cc5500" },
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
              <span style={{ background: t.badgeBg, color: "#fff", fontSize: 10, fontWeight: 800, padding: "1px 6px", borderRadius: 10 }}>
                {t.badge}
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
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {["⚙", "?", "🔔"].map(icon => (
            <span key={icon} style={{ fontSize: 13, color: "#666", cursor: "pointer" }}>{icon}</span>
          ))}
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
        <span style={{ fontSize: 11, color: "#666" }}>👥 31</span>
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
                  <span style={{ color: "#2a7a2a", fontSize: 15, fontWeight: 800 }}>✓✓</span>
                )}
                {row.status === "check" && (
                  <span style={{ color: "#2a7a2a", fontSize: 15, fontWeight: 800 }}>✓</span>
                )}
                {row.status === "check-pause" && (
                  <>
                    <span style={{ color: "#2a7a2a", fontSize: 15, fontWeight: 800 }}>✓</span>
                    <span style={{ background: "#555", color: "#fff", fontSize: 9, fontWeight: 800, padding: "2px 5px", borderRadius: 4 }}>⏸</span>
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

      {pax !== undefined && (
        <>
          <rect x={cx - hw / 2 + 2} y={cy - vh / 2 + 2} width={16} height={11} rx={2.5} fill="rgba(0,0,0,0.55)" />
          <text x={cx - hw / 2 + 10} y={cy - vh / 2 + 10} textAnchor="middle" fill="#fff" fontSize={7} fontWeight="bold">{pax}</text>
        </>
      )}

      <text x={cx} y={cy + 4} textAnchor="middle" fontSize={10} fontWeight="bold"
        fontFamily="'DM Sans', sans-serif" fill={sc.text}>{label}</text>

      {name && (
        <>
          <rect x={tx} y={cy + vh / 2 + 5} width={tw} height={13} rx={2.5} fill={sc.stroke} opacity={0.92} />
          <text x={cx} y={cy + vh / 2 + 15} textAnchor="middle" fill="#fff" fontSize={8} fontWeight="bold">{name}</text>
          {time && (
            <>
              <rect x={tx} y={cy + vh / 2 + 19} width={tw} height={11} rx={2.5} fill="rgba(0,0,0,0.35)" />
              <text x={cx} y={cy + vh / 2 + 28} textAnchor="middle" fill={status === "free" ? "#aaa" : "#fff"} fontSize={7.5} opacity={0.9}>{time}</text>
            </>
          )}
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

// ─── Billiard Table ───────────────────────────────────────────────────────────

function BTable({
  id, x, y, w, h, status, label, name, time, sel, onClick, transform,
}: {
  id: string; x: number; y: number; w: number; h: number
  status: TableStatus; label: string; name?: string; time?: string
  sel: string | null; onClick: (id: string) => void; transform?: string
}) {
  const selected = sel === id
  const pocketColor = "#040404"
  const pockets = [
    [x + 8, y + 8], [x + w / 2, y + 7], [x + w - 8, y + 8],
    [x + 8, y + h - 8], [x + w / 2, y + h - 7], [x + w - 8, y + h - 8],
  ]
  const strokeC = selected ? "#f0c060" : status === "reserved" ? "#3a6adb" : "#8B5E2A"

  return (
    <g transform={transform} onClick={() => onClick(id)} style={{ cursor: "pointer" }}>
      <text x={x + w / 2} y={y - 7} textAnchor="middle"
        fill="#3a3a52" fontSize={8} fontFamily="'Bebas Neue', cursive" letterSpacing="0.1em">{label}</text>

      <rect x={x} y={y} width={w} height={h} rx={6}
        fill="#1a6b2a" stroke={strokeC} strokeWidth={selected ? 3.5 : 3.5}
      />
      {status === "reserved" && (
        <rect x={x} y={y} width={w} height={h} rx={6} fill="rgba(58,106,219,0.07)" />
      )}

      {/* Center line */}
      <line x1={x + 10} y1={y + h / 2} x2={x + w - 10} y2={y + h / 2}
        stroke="rgba(255,255,255,0.12)" strokeWidth={1} />

      {/* Pockets */}
      {pockets.map(([px, py], i) => (
        <circle key={i} cx={px} cy={py} r={5.5} fill={pocketColor} />
      ))}

      {/* Balls */}
      <circle cx={x + w * 0.38} cy={y + h * 0.42} r={5} fill="#e74c3c" opacity={0.85} />
      <circle cx={x + w * 0.52} cy={y + h * 0.52} r={5} fill="#f0f0f0" opacity={0.85} />
      <circle cx={x + w * 0.65} cy={y + h * 0.42} r={5} fill="#f39c12" opacity={0.85} />

      {/* Guest name tag */}
      {name && (
        <>
          <rect x={x} y={y + h + 6} width={w} height={14} rx={3} fill="#3a6adb" opacity={0.9} />
          <text x={x + w / 2} y={y + h + 17} textAnchor="middle" fill="#fff" fontSize={9} fontWeight="bold">{name}</text>
          {time && (
            <>
              <rect x={x} y={y + h + 21} width={w} height={12} rx={3} fill="rgba(0,0,0,0.4)" />
              <text x={x + w / 2} y={y + h + 31} textAnchor="middle" fill="#aaccff" fontSize={8}>{time}</text>
            </>
          )}
        </>
      )}
    </g>
  )
}

// ─── Floor Plan SVG ────────────────────────────────────────────────────────────

function FloorPlan({ selId, onTableClick }: { selId: string | null; onTableClick: (id: string) => void }) {
  const T = (id: string) => ({ ...TABLE_DATA[id], tableStatus: (Object.entries({
    t10:"free", t30:"free", t50:"free", t51:"free", t52:"free", t53:"free", t54:"free",
    t58:"free", t59:"free", t60:"free",
    t61:"booked", t62:"booked", t63:"booked",
    t64:"present", t65:"present",
    t66:"free", t67:"free",
    b1:"free", b2:"reserved", b3:"free",
  }).find(([k]) => k === id)?.[1] ?? "free") as TableStatus })

  const tStatus = (id: string): TableStatus => {
    const map: Record<string, TableStatus> = {
      t10:"free", t30:"free", t50:"free", t51:"free", t52:"free", t53:"free", t54:"free",
      t58:"free", t59:"free", t60:"free",
      t61:"booked", t62:"booked", t63:"booked",
      t64:"present", t65:"present",
      t66:"free", t67:"free",
      b1:"free", b2:"reserved", b3:"free",
    }
    return map[id] ?? "free"
  }
  const d = TABLE_DATA

  const tt = (id: string, cx: number, cy: number, vw: number, vh: number, hw: number, hh: number,
    cT = 2, cB = 2, cL = 1, cR = 1) => (
    <TTable id={id} cx={cx} cy={cy} vw={vw} vh={vh} hw={hw} hh={hh}
      status={tStatus(id)} label={d[id]?.title.replace("Tisch ", "") ?? id}
      pax={d[id]?.pax ? parseInt(d[id].pax!) : undefined}
      name={d[id]?.guest} time={d[id]?.startTime}
      sel={selId} onClick={onTableClick}
      cT={cT} cB={cB} cL={cL} cR={cR}
    />
  )

  return (
    <svg viewBox="0 0 860 560" preserveAspectRatio="xMidYMid meet" className="w-full h-full" style={{ display: "block" }}>
      <defs>
        <radialGradient id="glow" cx="60%" cy="45%" r="40%">
          <stop offset="0%" stopColor="rgba(255,160,50,0.06)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>

      {/* Background */}
      <rect x={0} y={0} width={860} height={560} fill="#1a1a1a" />
      <rect x={0} y={0} width={860} height={560} fill="url(#glow)" />

      {/* Top-left dark zone (bar/entrance) */}
      <rect x={8} y={8} width={300} height={270} rx={4}
        fill="rgba(16,16,16,0.9)" stroke="#282828" strokeWidth={1.5} />

      {/* Diagonal wall lines */}
      <line x1={308} y1={278} x2={308} y2={400} stroke="#2a2a2a" strokeWidth={1.5} />
      <line x1={308} y1={400} x2={20} y2={540} stroke="#2a2a2a" strokeWidth={1.5} />

      {/* 3 screen boxes top-right */}
      <rect x={430} y={8} width={130} height={100} rx={4} fill="rgba(10,10,14,0.95)" stroke="#1e1e1e" strokeWidth={1} />
      <text x={495} y={62} textAnchor="middle" fill="#1e1e1e" fontSize={12} fontFamily="'Bebas Neue', cursive" letterSpacing="0.1em">SCREEN</text>
      <rect x={580} y={8} width={130} height={100} rx={4} fill="rgba(10,10,14,0.95)" stroke="#1e1e1e" strokeWidth={1} />
      <text x={645} y={62} textAnchor="middle" fill="#1e1e1e" fontSize={12} fontFamily="'Bebas Neue', cursive" letterSpacing="0.1em">SCREEN</text>
      <rect x={730} y={8} width={120} height={100} rx={4} fill="rgba(10,10,14,0.95)" stroke="#1e1e1e" strokeWidth={1} />
      <text x={790} y={62} textAnchor="middle" fill="#1e1e1e" fontSize={12} fontFamily="'Bebas Neue', cursive" letterSpacing="0.1em">SCREEN</text>

      {/* Rondo logo box */}
      <rect x={20} y={420} width={250} height={120} rx={6} fill="rgba(12,12,12,0.95)" />
      <text x={95} y={476} textAnchor="middle" fill="#c8b830" fontSize={28}
        fontFamily="'Bebas Neue', cursive" letterSpacing={3}>RONDO</text>
      <text x={95} y={492} textAnchor="middle" fill="#5a5a3a" fontSize={10} letterSpacing="0.15em">GOOD TIMES</text>
      <text x={282} y={508} fontSize={22} opacity={0.55}>🌿</text>

      {/* Table 10 – free, top-left */}
      {tt("t10", 59, 44, 18, 48, 52, 20, 2, 2, 1, 1)}

      {/* Table 30 – free, top-center */}
      {tt("t30", 184, 44, 18, 48, 52, 20, 2, 2, 1, 1)}

      {/* Center: Row 1 → T52, T53, T54 */}
      {tt("t52", 339, 157, 18, 48, 52, 20, 2, 2, 1, 1)}
      {tt("t53", 429, 157, 18, 48, 52, 20, 2, 2, 1, 1)}
      {tt("t54", 521, 153, 22, 66, 68, 30, 3, 3, 2, 2)}

      {/* Center: Row 2 → T51, T50, T58, T59 */}
      {tt("t51", 339, 255, 18, 48, 52, 20, 2, 2, 1, 1)}
      {tt("t50", 430, 258, 20, 54, 58, 22, 3, 3, 1, 1)}
      {tt("t58", 589, 255, 18, 48, 52, 20, 2, 2, 1, 1)}
      {tt("t59", 729, 255, 18, 48, 52, 20, 2, 2, 1, 1)}

      {/* T64 – present (Licata) */}
      <TTable id="t64" cx={310} cy={492} vw={20} vh={52} hw={58} hh={20}
        status="present" label="64" pax={2} name="Licata" time="19:30"
        sel={selId} onClick={onTableClick} cT={2} cB={2} cL={1} cR={1} />

      {/* T65 – present (Gutsch) */}
      <TTable id="t65" cx={400} cy={492} vw={20} vh={52} hw={58} hh={20}
        status="present" label="65" pax={4} name="Gutsch" time="20:00"
        sel={selId} onClick={onTableClick} cT={2} cB={2} cL={1} cR={1} />

      {/* Enclosed box (bottom-right) */}
      <rect x={640} y={310} width={210} height={242} rx={4}
        fill="rgba(14,14,18,0.85)" stroke="#2a2a2a" strokeWidth={1.5} />

      {/* T61 – booked (Guido) */}
      <TTable id="t61" cx={661} cy={353} vw={18} vh={46} hw={52} hh={18}
        status="booked" label="61" pax={2} name="Guido" time="01:30"
        sel={selId} onClick={onTableClick} cT={2} cB={2} cL={1} cR={1} />
      {/* T60 – free */}
      <TTable id="t60" cx={751} cy={353} vw={18} vh={46} hw={52} hh={18}
        status="free" label="60"
        sel={selId} onClick={onTableClick} cT={2} cB={2} cL={1} cR={1} />
      {/* T67 – free */}
      <TTable id="t67" cx={661} cy={441} vw={18} vh={46} hw={52} hh={18}
        status="free" label="67"
        sel={selId} onClick={onTableClick} cT={2} cB={2} cL={1} cR={1} />
      {/* T66 – free */}
      <TTable id="t66" cx={751} cy={441} vw={18} vh={46} hw={52} hh={18}
        status="free" label="66"
        sel={selId} onClick={onTableClick} cT={2} cB={2} cL={1} cR={1} />
      {/* T62 – booked (Lentino) */}
      <TTable id="t62" cx={661} cy={508} vw={20} vh={52} hw={58} hh={20}
        status="booked" label="62" pax={3} name="Lentino" time="19:30"
        sel={selId} onClick={onTableClick} cT={2} cB={0} cL={1} cR={1} />
      {/* T63 – booked (Santos d.) */}
      <TTable id="t63" cx={751} cy={508} vw={20} vh={52} hw={58} hh={20}
        status="booked" label="63" pax={4} name="Santos d." time="20:00"
        sel={selId} onClick={onTableClick} cT={2} cB={0} cL={1} cR={1} />

      {/* Billiard 1 – free, top-right */}
      <BTable id="b1" x={430} y={120} w={108} h={170}
        status="free" label="BILLARD 1"
        sel={selId} onClick={onTableClick} />

      {/* Billiard 2 – reserved (Michelik), next to B1 */}
      <BTable id="b2" x={580} y={120} w={108} h={170}
        status="reserved" label="BILLARD 2"
        name="Michelik" time="19:15 – 21:15"
        sel={selId} onClick={onTableClick} />

      {/* Billiard 3 – free, diagonal bottom-right */}
      <BTable id="b3" x={500} y={330} w={148} h={94}
        status="free" label="BILLARD 3"
        sel={selId} onClick={onTableClick}
        transform="rotate(-38, 574, 377)" />

      {/* Decorative plants */}
      <text x={820} y={320} fontSize={28} opacity={0.6}>🌿</text>
      <text x={305} y={305} fontSize={20} opacity={0.5}>🌿</text>
    </svg>
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
              <span style={{ fontSize: 12, fontWeight: 600, color: "#333" }}>📅 Samstag, 8. März 2026</span>
              <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, ...statusPillStyle(data.status) }}>
                {data.status}
              </span>
            </div>

            {/* Body */}
            <div style={{ padding: "14px 18px", flex: 1 }}>
              {!data.guest ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#aaa" }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>📅</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#666" }}>Keine Reservierungen heute</div>
                  <div style={{ fontSize: 12, color: "#aaa", marginTop: 6 }}>Dieser Tisch ist frei verfügbar</div>
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
                    {[{ label: "✏ Bearbeiten", hoverC: "#333" }, { label: "✉ Mail", hoverC: "#333" }, { label: "✕ Stornieren", hoverC: "#cc2222" }].map(b => (
                      <button key={b.label}
                        style={{ flex: 1, padding: 7, borderRadius: 6, border: "1px solid #ddd", background: "#fff", fontSize: 10, fontWeight: 700, color: "#666", cursor: "pointer" }}>
                        {b.label}
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
                {["✓ Einchecken", "🔒 Sperren", "✉ Mail"].map(label => (
                  <button key={label}
                    style={{ flex: 1, padding: "7px 0", borderRadius: 6, background: "#fff", border: "1px solid #ddd", fontSize: 10, fontWeight: 700, color: "#666", cursor: "pointer" }}>
                    {label}
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RaumplanPage() {
  const [activeArea, setActiveArea] = useState("billard")
  const [panelData, setPanelData] = useState<PanelData | null>(null)
  const [selTableId, setSelTableId] = useState<string | null>(null)
  const [selRowIdx, setSelRowIdx] = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState("")

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
    const d = TABLE_DATA[id]
    if (!d) return
    setSelTableId(id)
    setSelRowIdx(null)
    setPanelData(d)
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
      <AreaTabsBar activeArea={activeArea} setActiveArea={setActiveArea} />

      {/* Body */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <ReservationPanel selectedRow={selRowIdx} onRowClick={openRow} />
        <div style={{ flex: 1, background: "#1a1a1a", overflow: "hidden" }}>
          <FloorPlan selId={selTableId} onTableClick={openTable} />
        </div>
      </div>

      <SlidePanel data={panelData} onClose={closePanel} />
    </div>
  )
}
