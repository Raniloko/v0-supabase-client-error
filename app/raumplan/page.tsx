"use client"
import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  Bell, Plus, X, UserCheck, Lock, Mail, XCircle,
  ChevronLeft, ChevronRight, Pencil, Users,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

type TableStatus = "free" | "reserved" | "present" | "booked" | "blocked"

interface TableData {
  id: string
  number: string
  area: string
  status: TableStatus
  guestName?: string
  startTime?: string
  endTime?: string
  pax?: number
}

interface ReservationRow {
  time: string
  guests: number
  name: string
  tableRef: string
  hasWaitlist: boolean
  hasWarning: boolean
  checkStatus: "double" | "single" | "info" | "warning" | "none"
  highlighted?: boolean
}

// ─── Static Data ──────────────────────────────────────────────────────────────

const RESERVATIONS: ReservationRow[] = [
  { time: "19:30", guests: 2, name: "Licata, Francesco", tableRef: "3/64", hasWaitlist: false, hasWarning: false, checkStatus: "double", highlighted: true },
  { time: "20:00", guests: 4, name: "Gutsch",            tableRef: "4/65", hasWaitlist: false, hasWarning: false, checkStatus: "double" },
  { time: "19:15", guests: 4, name: "Michelik",          tableRef: "1/2",  hasWaitlist: false, hasWarning: false, checkStatus: "single" },
  { time: "19:00", guests: 4, name: "Jana",              tableRef: "1/3",  hasWaitlist: false, hasWarning: true,  checkStatus: "info" },
  { time: "19:30", guests: 3, name: "Lenga, Dennis",     tableRef: "1/6",  hasWaitlist: false, hasWarning: false, checkStatus: "single" },
  { time: "01:30", guests: 3, name: "Gutsch, Fabian",    tableRef: "3/65", hasWaitlist: false, hasWarning: false, checkStatus: "single" },
  { time: "01:30", guests: 2, name: "Lcata, Francesco",  tableRef: "3/64", hasWaitlist: false, hasWarning: false, checkStatus: "single" },
  { time: "02:00", guests: 4, name: "Hantal",            tableRef: "1/1",  hasWaitlist: false, hasWarning: false, checkStatus: "single" },
  { time: "02:00", guests: 4, name: "Kewelo",            tableRef: "1/8",  hasWaitlist: false, hasWarning: false, checkStatus: "none" },
]

const TABLES: TableData[] = [
  { id: "t30",  number: "30",       area: "billard",  status: "free" },
  { id: "t10",  number: "10",       area: "billard",  status: "reserved", guestName: "Jana",      startTime: "19:00", endTime: "21:00", pax: 4 },
  { id: "t61",  number: "61",       area: "rest140",  status: "booked",   guestName: "Guido",     startTime: "01:30", endTime: "03:00", pax: 2 },
  { id: "t62",  number: "62",       area: "rest140",  status: "booked",   guestName: "Lentino",   startTime: "19:30", endTime: "21:00", pax: 3 },
  { id: "t63",  number: "63",       area: "rest140",  status: "booked",   guestName: "Santos d.", startTime: "20:00", endTime: "22:00", pax: 4 },
  { id: "t60",  number: "60",       area: "rest140",  status: "free" },
  { id: "t64",  number: "64",       area: "rest140",  status: "present",  guestName: "Licata",    startTime: "19:30", endTime: "21:30", pax: 2 },
  { id: "t65",  number: "65",       area: "rest140",  status: "present",  guestName: "Gutsch",    startTime: "20:00", endTime: "22:00", pax: 4 },
  { id: "t50",  number: "50",       area: "rest140",  status: "free" },
  { id: "t51",  number: "51",       area: "rest140",  status: "free" },
  { id: "t52",  number: "52",       area: "rest140",  status: "free" },
  { id: "t53",  number: "53",       area: "rest140",  status: "free" },
  { id: "t54",  number: "54",       area: "rest140",  status: "free" },
  { id: "t58",  number: "58",       area: "rest140",  status: "free" },
  { id: "t59",  number: "59",       area: "rest140",  status: "free" },
  { id: "t66",  number: "66",       area: "rest140",  status: "free" },
  { id: "t67",  number: "67",       area: "rest140",  status: "free" },
  { id: "b1",   number: "Billard 1", area: "billard", status: "free" },
  { id: "b2",   number: "Billard 2", area: "billard", status: "reserved", guestName: "Michelik", startTime: "19:15", endTime: "21:15", pax: 4 },
  { id: "b3",   number: "Billard 3", area: "billard", status: "free" },
]

const AREA_TABS = [
  { id: "billard",   label: "Billard Tisch" },
  { id: "salitos",   label: "Salitos Lounge / Outdoor" },
  { id: "rest140",   label: "Restaurant 140 Zoll" },
  { id: "rest75",    label: "Restaurant 75 Zoll / Sport" },
  { id: "vip",       label: "VIP Raum / Sport" },
]

const STATUS_COLOR: Record<TableStatus, { fill: string; stroke: string; textColor: string }> = {
  free:     { fill: "rgba(184,184,200,0.12)", stroke: "#b8b8c8", textColor: "#b8b8c8" },
  reserved: { fill: "rgba(201,168,76,0.18)",  stroke: "#c9a84c", textColor: "#c9a84c" },
  present:  { fill: "rgba(29,185,84,0.18)",   stroke: "#1db954", textColor: "#1db954" },
  booked:   { fill: "rgba(58,123,213,0.18)",  stroke: "#3a7bd5", textColor: "#3a7bd5" },
  blocked:  { fill: "rgba(204,34,34,0.15)",   stroke: "#cc2222", textColor: "#cc2222" },
}

// ─── Toast System ─────────────────────────────────────────────────────────────

interface Toast { id: number; type: "green" | "gold" | "red"; text: string; sub: string }

function ToastStack({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed bottom-5 right-4 z-50 flex flex-col gap-2 items-end" style={{ fontFamily: "var(--font-sans)" }}>
      <AnimatePresence>
        {toasts.map(t => {
          const borderColor = t.type === "green" ? "#1db954" : t.type === "gold" ? "#c9a84c" : "#cc2222"
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 60, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.93 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="flex items-start gap-3 px-4 py-3 rounded-xl"
              style={{
                background: "#13131a",
                border: "1px solid rgba(255,255,255,0.07)",
                borderLeft: `3px solid ${borderColor}`,
                minWidth: 240,
                maxWidth: 320,
                boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
              }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: "#f0ede6" }}>{t.text}</p>
                <p className="text-xs mt-0.5 truncate" style={{ color: "#666" }}>{t.sub}</p>
              </div>
              <button onClick={() => onRemove(t.id)} style={{ color: "#444", flexShrink: 0 }}>
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

// ─── Left Reservation Panel ───────────────────────────────────────────────────

const TABS_LEFT = [
  { key: "jetzt",     label: "Jetzt",     count: 18, color: "" },
  { key: "bevorsteh", label: "Bevorsteh.", count: 31, color: "" },
  { key: "warteliste",label: "Warteliste", count: 2,  color: "#e67e22" },
  { key: "achtung",   label: "Achtung",   count: 2,  color: "#e67e22" },
]

function LeftPanel({
  activeListTab,
  setActiveListTab,
  onRowClick,
  selectedRow,
}: {
  activeListTab: string
  setActiveListTab: (t: string) => void
  onRowClick: (r: ReservationRow) => void
  selectedRow: ReservationRow | null
}) {
  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ width: 268, minWidth: 268, background: "#f4f4f6", borderRight: "1px solid #ddd" }}
    >
      {/* Dark header */}
      <div style={{ background: "#1a1a2a", flexShrink: 0 }}>
        {/* Title row */}
        <div className="flex items-center gap-2 px-3 pt-2.5 pb-1.5">
          <span style={{ fontSize: 13 }}>📋</span>
          <span className="font-display tracking-wide text-sm" style={{ color: "#f0ede6" }}>Reservierungsliste</span>
          <span
            className="ml-1 px-1.5 py-0.5 rounded text-xs font-bold"
            style={{ background: "#c9a84c", color: "#0a0a0a" }}
          >18</span>
          <div className="ml-auto flex items-center gap-1">
            <span className="px-1.5 py-0.5 rounded text-xs font-semibold"
              style={{ background: "rgba(29,185,84,0.2)", color: "#1db954", border: "1px solid rgba(29,185,84,0.25)" }}>
              ✓ 31 Platziert
            </span>
          </div>
        </div>

        {/* Tabs row */}
        <div className="flex px-2 pb-1.5 gap-1">
          {TABS_LEFT.map(tab => {
            const isActive = activeListTab === tab.key
            const countColor = tab.color || (isActive ? "#c9a84c" : "#999")
            return (
              <button
                key={tab.key}
                onClick={() => setActiveListTab(tab.key)}
                className="flex-1 flex flex-col items-center py-1.5 rounded transition-all"
                style={{
                  background: isActive ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.06)",
                  border: isActive ? "1px solid rgba(201,168,76,0.35)" : "1px solid transparent",
                }}
              >
                <span
                  className="font-display text-base leading-none"
                  style={{ color: tab.color || (isActive ? "#c9a84c" : "#aaa") }}
                >
                  {tab.count}
                </span>
                <span className="text-xs mt-0.5" style={{ color: tab.color || (isActive ? "#c9a84c" : "#888"), fontSize: 9 }}>
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Date nav row */}
        <div
          className="flex items-center gap-1 px-2 py-2"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          <button className="w-6 h-6 flex items-center justify-center rounded" style={{ background: "rgba(255,255,255,0.06)", color: "#aaa" }}>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="flex-1 text-center text-xs font-semibold" style={{ color: "#f0ede6" }}>Sa. 7 März</span>
          <button className="w-6 h-6 flex items-center justify-center rounded" style={{ background: "rgba(255,255,255,0.06)", color: "#aaa" }}>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            className="ml-1 px-2 py-0.5 rounded text-xs font-medium"
            style={{ background: "rgba(201,168,76,0.12)", color: "#c9a84c", border: "1px solid rgba(201,168,76,0.2)" }}
          >
            Abendessen ▾
          </button>
          <span className="ml-1 text-xs font-bold" style={{ color: "#c9a84c", fontSize: 10 }}>8⟰31</span>
        </div>
      </div>

      {/* Column headers */}
      <div
        className="grid text-center"
        style={{
          gridTemplateColumns: "40px 22px 1fr 40px 18px 18px 26px",
          background: "#e8e8ee",
          borderBottom: "1px solid #d8d8e2",
          padding: "4px 6px",
          flexShrink: 0,
        }}
      >
        {["Uhrzeit", "G.", "Name", "Tisch", "🕐", "⚠", "✓"].map(h => (
          <span key={h} style={{ fontSize: 8, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</span>
        ))}
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto">
        {RESERVATIONS.map((r, i) => {
          const isSelected = selectedRow?.name === r.name && selectedRow?.time === r.time
          const isGreen = r.checkStatus === "double"
          return (
            <div
              key={i}
              onClick={() => onRowClick(r)}
              className="grid items-center transition-colors"
              style={{
                gridTemplateColumns: "40px 22px 1fr 40px 18px 18px 26px",
                padding: "5px 6px",
                borderBottom: "1px solid rgba(0,0,0,0.04)",
                background: isSelected
                  ? "rgba(201,168,76,0.08)"
                  : r.highlighted
                  ? "rgba(201,168,76,0.05)"
                  : isGreen
                  ? "rgba(29,185,84,0.03)"
                  : "transparent",
                borderLeft: r.highlighted ? "2px solid #c9a84c" : isSelected ? "2px solid rgba(201,168,76,0.5)" : "2px solid transparent",
                cursor: "pointer",
              }}
              onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = "#eeeef8" }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.background = isSelected
                  ? "rgba(201,168,76,0.08)"
                  : r.highlighted
                  ? "rgba(201,168,76,0.05)"
                  : isGreen
                  ? "rgba(29,185,84,0.03)"
                  : "transparent"
              }}
            >
              {/* Time */}
              <span style={{ fontSize: 10, fontWeight: 700, color: "#333", fontFamily: "monospace" }}>{r.time}</span>
              {/* Guests */}
              <span style={{ fontSize: 10, color: "#555", textAlign: "center" }}>{r.guests}</span>
              {/* Name */}
              <span style={{ fontSize: 10, color: "#222", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {r.name}
              </span>
              {/* Table */}
              <span style={{ fontSize: 9, color: "#666", textAlign: "center" }}>{r.tableRef}</span>
              {/* Clock */}
              <span style={{ fontSize: 9, color: "#999", textAlign: "center" }}></span>
              {/* Warning */}
              <span style={{ fontSize: 10, textAlign: "center" }}>
                {r.hasWarning ? <span style={{ color: "#e67e22" }}>⚠</span> : ""}
              </span>
              {/* Check */}
              <span style={{ fontSize: 9, textAlign: "center" }}>
                {r.checkStatus === "double"   && <span style={{ color: "#1db954", fontWeight: 700 }}>✓✓</span>}
                {r.checkStatus === "single"   && <span style={{ color: "#1db954", fontWeight: 700 }}>✓</span>}
                {r.checkStatus === "info"     && <span style={{ color: "#c9a84c", fontWeight: 700 }}>ℹ</span>}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Floor Plan SVG ────────────────────────────────────────────────────────────

function TableCross({
  id, cx, cy, vw, vh, hw, hh,
  status, number, pax, guestName, time,
  onClick, isSelected,
  chairT = 0, chairB = 0, chairL = 0, chairR = 0,
}: {
  id: string; cx: number; cy: number
  vw: number; vh: number; hw: number; hh: number
  status: TableStatus; number: string
  pax?: number; guestName?: string; time?: string
  onClick: () => void; isSelected: boolean
  chairT?: number; chairB?: number; chairL?: number; chairR?: number
}) {
  const sc = STATUS_COLOR[status]
  const hasInfo = !!guestName
  const chairGap = 5
  const chairW = 8; const chairH = 6

  const renderChairs = (count: number, axis: "h" | "v", x: number, y: number, perpOff: number) => {
    if (count === 0) return null
    const total = count * chairW + (count - 1) * chairGap
    const startX = axis === "h" ? x - total / 2 : x + perpOff
    const startY = axis === "h" ? y + perpOff : y - total / 2
    return Array.from({ length: count }).map((_, i) => (
      <rect
        key={i}
        x={axis === "h" ? startX + i * (chairW + chairGap) : startX}
        y={axis === "h" ? startY : startY + i * (chairW + chairGap)}
        width={axis === "h" ? chairW : chairH}
        height={axis === "h" ? chairH : chairW}
        rx={2}
        fill={sc.stroke}
        opacity={0.45}
      />
    ))
  }

  return (
    <g
      onClick={onClick}
      style={{ cursor: "pointer" }}
    >
      {/* Chair stubs */}
      {renderChairs(chairT, "h", cx, cy - vh / 2, -chairH - 2)}
      {renderChairs(chairB, "h", cx, cy + vh / 2, 2)}
      {renderChairs(chairL, "v", cx - hw / 2, cy, -chairH - 2)}
      {renderChairs(chairR, "v", cx + hw / 2, cy, 2)}

      {/* Cross shape – vertical bar */}
      <rect
        x={cx - vw / 2} y={cy - vh / 2}
        width={vw} height={vh}
        rx={4}
        fill={isSelected ? sc.stroke : sc.fill}
        stroke={isSelected ? "#c9a84c" : sc.stroke}
        strokeWidth={isSelected ? 2 : 1.5}
        opacity={0.92}
      />
      {/* Cross shape – horizontal bar */}
      <rect
        x={cx - hw / 2} y={cy - hh / 2}
        width={hw} height={hh}
        rx={4}
        fill={isSelected ? sc.stroke : sc.fill}
        stroke={isSelected ? "#c9a84c" : sc.stroke}
        strokeWidth={isSelected ? 2 : 1.5}
        opacity={0.92}
      />

      {/* Pax badge */}
      {pax !== undefined && (
        <g>
          <rect x={cx - hw / 2 + 2} y={cy - vh / 2 + 2} width={18} height={12} rx={3} fill="rgba(0,0,0,0.55)" />
          <text x={cx - hw / 2 + 11} y={cy - vh / 2 + 11} textAnchor="middle" fill="white" fontSize={7} fontWeight="bold">{pax}</text>
        </g>
      )}

      {/* Table number */}
      <text x={cx} y={cy + 4} textAnchor="middle" fill={sc.textColor} fontSize={10} fontWeight="bold"
        fontFamily="var(--font-display), 'Bebas Neue', cursive" letterSpacing="0.05em">
        {number}
      </text>

      {/* Name tag */}
      {hasInfo && guestName && (
        <g>
          <rect x={cx - hw / 2} y={cy + vh / 2 + 4} width={hw} height={14} rx={3} fill={sc.stroke} opacity={0.9} />
          <text x={cx} y={cy + vh / 2 + 14} textAnchor="middle" fill="white" fontSize={8} fontWeight="bold">{guestName}</text>
          {time && (
            <>
              <rect x={cx - hw / 2} y={cy + vh / 2 + 18} width={hw} height={12} rx={3} fill={sc.fill} opacity={0.95} />
              <text x={cx} y={cy + vh / 2 + 27} textAnchor="middle" fill={sc.textColor} fontSize={7.5}>{time}</text>
            </>
          )}
        </g>
      )}

      {/* Selected glow */}
      {isSelected && (
        <rect
          x={cx - hw / 2 - 4} y={cy - vh / 2 - 4}
          width={hw + 8} height={vh + 8}
          rx={6} fill="none"
          stroke="rgba(201,168,76,0.5)" strokeWidth={1.5}
          strokeDasharray="4 3"
        />
      )}
    </g>
  )
}

function BilliardTableSVG({
  id, x, y, w, h, status, label, guestName, time, onClick, isSelected, transform,
}: {
  id: string; x: number; y: number; w: number; h: number
  status: TableStatus; label: string
  guestName?: string; time?: string
  onClick: () => void; isSelected: boolean
  transform?: string
}) {
  const sc = STATUS_COLOR[status]
  const pockets = [
    [x + 7, y + 7], [x + w / 2, y + 7], [x + w - 7, y + 7],
    [x + 7, y + h - 7], [x + w / 2, y + h - 7], [x + w - 7, y + h - 7],
  ]
  const balls = [
    { cx: x + w * 0.35, cy: y + h * 0.38, fill: "#e74c3c" },
    { cx: x + w * 0.5,  cy: y + h * 0.5,  fill: "#f0f0f0" },
    { cx: x + w * 0.65, cy: y + h * 0.62, fill: "#f39c12" },
  ]
  const strokeColor = isSelected ? "#c9a84c" : status === "free" ? "#8B5E2A" : sc.stroke
  const strokeWidth = isSelected ? 3 : status === "reserved" ? 3 : 3.5

  return (
    <g transform={transform} onClick={onClick} style={{ cursor: "pointer" }}>
      {/* Label above */}
      <text x={x + w / 2} y={y - 5} textAnchor="middle"
        fill="#4a4a5a" fontSize={8} fontFamily="var(--font-display), 'Bebas Neue', cursive" letterSpacing="0.1em" opacity={0.7}>
        {label}
      </text>

      {/* Table felt */}
      <rect x={x} y={y} width={w} height={h} rx={6}
        fill={status === "reserved" ? "rgba(28,107,42,0.85)" : "#1a6b2a"}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
      {/* Gold tint overlay if reserved */}
      {status === "reserved" && (
        <rect x={x} y={y} width={w} height={h} rx={6}
          fill="rgba(201,168,76,0.07)"
        />
      )}
      {/* Center line */}
      <line x1={x + 8} y1={y + h / 2} x2={x + w - 8} y2={y + h / 2}
        stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
      {/* Balls */}
      {balls.map((b, i) => (
        <circle key={i} cx={b.cx} cy={b.cy} r={4} fill={b.fill} opacity={0.75} />
      ))}
      {/* Pockets */}
      {pockets.map(([px, py], i) => (
        <circle key={i} cx={px} cy={py} r={5.5} fill="#040404" stroke="rgba(255,255,255,0.08)" strokeWidth={0.5} />
      ))}

      {/* Number label */}
      <text x={x + w / 2} y={y + h / 2 + 5} textAnchor="middle"
        fill={status === "reserved" ? "#c9a84c" : "rgba(255,255,255,0.2)"}
        fontSize={13} fontFamily="var(--font-display), 'Bebas Neue', cursive">
        {label.replace("BILLARD ", "")}
      </text>

      {/* Name tag below */}
      {guestName && !transform && (
        <g>
          <rect x={x} y={y + h + 5} width={w} height={15} rx={3} fill="#c9a84c" opacity={0.9} />
          <text x={x + w / 2} y={y + h + 15} textAnchor="middle" fill="white" fontSize={8} fontWeight="bold">{guestName}</text>
          {time && (
            <>
              <rect x={x} y={y + h + 20} width={w} height={13} rx={3} fill="rgba(201,168,76,0.25)" />
              <text x={x + w / 2} y={y + h + 30} textAnchor="middle" fill="#c9a84c" fontSize={7.5}>{time}</text>
            </>
          )}
        </g>
      )}

      {/* Selected ring */}
      {isSelected && (
        <rect x={x - 4} y={y - 4} width={w + 8} height={h + 8} rx={9}
          fill="none" stroke="rgba(201,168,76,0.55)" strokeWidth={1.5} strokeDasharray="5 3" />
      )}
    </g>
  )
}

function FloorPlanSVG({
  tables, onTableClick, selectedId,
}: {
  tables: TableData[]
  onTableClick: (t: TableData) => void
  selectedId: string | null
}) {
  const findTable = (id: string) => tables.find(t => t.id === id)!
  const t = (id: string) => findTable(id)

  return (
    <svg
      viewBox="0 0 760 540"
      preserveAspectRatio="xMidYMid meet"
      className="w-full h-full"
      style={{ display: "block" }}
    >
      {/* Background radial glow */}
      <defs>
        <radialGradient id="centerGlow" cx="50%" cy="55%" r="45%">
          <stop offset="0%" stopColor="rgba(201,168,76,0.07)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
        <radialGradient id="bgGrad" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="#141420" />
          <stop offset="100%" stopColor="#0c0c10" />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={760} height={540} fill="url(#bgGrad)" />
      <rect x={0} y={0} width={760} height={540} fill="url(#centerGlow)" />

      {/* ── TOP-LEFT BOX: RONDO brand ── */}
      <rect x={6} y={6} width={218} height={148} rx={4}
        fill="rgba(16,16,24,0.92)" stroke="#28283a" strokeWidth={1.5} />
      {/* Bar counter */}
      <rect x={162} y={72} width={52} height={68} rx={3}
        fill="rgba(60,40,20,0.7)" stroke="rgba(201,168,76,0.15)" strokeWidth={1} />
      <text x={188} y={106} textAnchor="middle" fill="rgba(201,168,76,0.3)" fontSize={7}
        fontFamily="var(--font-display)">BAR</text>
      {/* RONDO text */}
      <text x={50} y={52} fill="#c9a84c" fontSize={22}
        fontFamily="var(--font-display), 'Bebas Neue', cursive" letterSpacing="0.12em" opacity={0.9}>
        RONDO
      </text>
      <text x={52} y={65} fill="#4a4a5a" fontSize={7} letterSpacing="0.2em" opacity={0.7}>GOOD TIMES</text>
      {/* Plant */}
      <text x={14} y={138} fontSize={26} opacity={0.75}>🌿</text>
      {/* Box walls */}
      <line x1={6} y1={152} x2={224} y2={152} stroke="#28283a" strokeWidth={1.5} />
      <line x1={224} y1={6} x2={224} y2={152} stroke="#28283a" strokeWidth={1.5} />

      {/* ── TWO SCREEN BOXES ── */}
      <rect x={448} y={6} width={148} height={82} rx={4}
        fill="rgba(10,10,16,0.95)" stroke="rgba(255,255,255,0.07)" strokeWidth={1.2} />
      <text x={522} y={50} textAnchor="middle" fill="#222230" fontSize={14}
        fontFamily="var(--font-display)" letterSpacing="0.1em">SCREEN</text>
      <rect x={612} y={6} width={140} height={82} rx={4}
        fill="rgba(10,10,16,0.95)" stroke="rgba(255,255,255,0.07)" strokeWidth={1.2} />
      <text x={682} y={50} textAnchor="middle" fill="#222230" fontSize={14}
        fontFamily="var(--font-display)" letterSpacing="0.1em">SCREEN</text>

      {/* ── HORIZONTAL DIVIDER ── */}
      <line x1={224} y1={152} x2={448} y2={152} stroke="#28283a" strokeWidth={1.5} />

      {/* ── LEFT ENCLOSED RESTAURANT BOX ── */}
      <rect x={6} y={152} width={218} height={382} rx={4}
        fill="rgba(14,14,22,0.88)" stroke="#28283a" strokeWidth={1.5} />

      {/* ── TABLES INSIDE LEFT BOX ── */}
      {/* T62 – BOOKED blue, left col top */}
      <TableCross id="t62" cx={59} cy={200} vw={28} vh={52} hw={54} hh={18}
        status={t("t62").status} number="62" pax={t("t62").pax}
        guestName={t("t62").guestName} time={t("t62").startTime}
        onClick={() => onTableClick(t("t62"))} isSelected={selectedId === "t62"}
        chairT={2} chairB={2} chairL={1} chairR={1} />
      {/* T61 – BOOKED blue, right col top */}
      <TableCross id="t61" cx={159} cy={200} vw={28} vh={52} hw={54} hh={18}
        status={t("t61").status} number="61" pax={t("t61").pax}
        guestName={t("t61").guestName} time={t("t61").startTime}
        onClick={() => onTableClick(t("t61"))} isSelected={selectedId === "t61"}
        chairT={2} chairB={2} chairL={1} chairR={1} />
      {/* T63 – BOOKED blue, left col mid */}
      <TableCross id="t63" cx={59} cy={297} vw={28} vh={52} hw={54} hh={18}
        status={t("t63").status} number="63" pax={t("t63").pax}
        guestName={t("t63").guestName} time={t("t63").startTime}
        onClick={() => onTableClick(t("t63"))} isSelected={selectedId === "t63"}
        chairT={2} chairB={2} chairL={1} chairR={1} />
      {/* T60 – FREE white, right col mid */}
      <TableCross id="t60" cx={159} cy={297} vw={28} vh={52} hw={54} hh={18}
        status={t("t60").status} number="60"
        onClick={() => onTableClick(t("t60"))} isSelected={selectedId === "t60"}
        chairT={2} chairB={2} chairL={1} chairR={1} />
      {/* T64 – PRESENT green, left col bottom */}
      <TableCross id="t64" cx={59} cy={400} vw={28} vh={52} hw={54} hh={18}
        status={t("t64").status} number="64" pax={t("t64").pax}
        guestName={t("t64").guestName} time={t("t64").startTime}
        onClick={() => onTableClick(t("t64"))} isSelected={selectedId === "t64"}
        chairT={2} chairB={2} chairL={1} chairR={1} />
      {/* T65 – PRESENT green, right col bottom */}
      <TableCross id="t65" cx={159} cy={400} vw={28} vh={52} hw={54} hh={18}
        status={t("t65").status} number="65" pax={t("t65").pax}
        guestName={t("t65").guestName} time={t("t65").startTime}
        onClick={() => onTableClick(t("t65"))} isSelected={selectedId === "t65"}
        chairT={2} chairB={2} chairL={1} chairR={1} />

      {/* ── TABLE 30 – top center FREE ── */}
      <TableCross id="t30" cx={265} cy={40} vw={20} vh={50} hw={56} hh={20}
        status={t("t30").status} number="30"
        onClick={() => onTableClick(t("t30"))} isSelected={selectedId === "t30"}
        chairT={2} chairB={2} chairL={1} chairR={1} />

      {/* ── TABLE 10 – top right GOLD reserved ── */}
      <TableCross id="t10" cx={412} cy={40} vw={20} vh={50} hw={56} hh={20}
        status={t("t10").status} number="10" pax={t("t10").pax}
        guestName={t("t10").guestName} time={t("t10").startTime}
        onClick={() => onTableClick(t("t10"))} isSelected={selectedId === "t10"}
        chairT={2} chairB={2} chairL={1} chairR={1} />

      {/* ── CENTER TABLES ── */}
      {/* T51 */}
      <TableCross id="t51" cx={280} cy={193} vw={20} vh={50} hw={56} hh={18}
        status={t("t51").status} number="51"
        onClick={() => onTableClick(t("t51"))} isSelected={selectedId === "t51"}
        chairT={2} chairB={2} chairL={1} chairR={1} />
      {/* T52 */}
      <TableCross id="t52" cx={370} cy={193} vw={20} vh={50} hw={56} hh={18}
        status={t("t52").status} number="52"
        onClick={() => onTableClick(t("t52"))} isSelected={selectedId === "t52"}
        chairT={2} chairB={2} chairL={1} chairR={1} />
      {/* T50 – slightly larger */}
      <TableCross id="t50" cx={278} cy={280} vw={24} vh={56} hw={64} hh={20}
        status={t("t50").status} number="50"
        onClick={() => onTableClick(t("t50"))} isSelected={selectedId === "t50"}
        chairT={3} chairB={3} chairL={1} chairR={1} />
      {/* T53 */}
      <TableCross id="t53" cx={366} cy={278} vw={20} vh={52} hw={56} hh={20}
        status={t("t53").status} number="53"
        onClick={() => onTableClick(t("t53"))} isSelected={selectedId === "t53"}
        chairT={2} chairB={2} chairL={1} chairR={1} />
      {/* T54 – LARGE */}
      <TableCross id="t54" cx={312} cy={366} vw={28} vh={68} hw={80} hh={28}
        status={t("t54").status} number="54"
        onClick={() => onTableClick(t("t54"))} isSelected={selectedId === "t54"}
        chairT={3} chairB={3} chairL={2} chairR={2} />
      {/* T58 */}
      <TableCross id="t58" cx={276} cy={455} vw={20} vh={50} hw={56} hh={18}
        status={t("t58").status} number="58"
        onClick={() => onTableClick(t("t58"))} isSelected={selectedId === "t58"}
        chairT={2} chairB={2} chairL={1} chairR={1} />
      {/* T67 */}
      <TableCross id="t67" cx={366} cy={435} vw={20} vh={50} hw={56} hh={18}
        status={t("t67").status} number="67"
        onClick={() => onTableClick(t("t67"))} isSelected={selectedId === "t67"}
        chairT={2} chairB={2} chairL={1} chairR={1} />
      {/* T59 – small */}
      <TableCross id="t59" cx={255} cy={508} vw={12} vh={28} hw={44} hh={14}
        status={t("t59").status} number="59"
        onClick={() => onTableClick(t("t59"))} isSelected={selectedId === "t59"}
        chairT={2} chairB={2} chairL={0} chairR={0} />
      {/* T66 – small */}
      <TableCross id="t66" cx={348} cy={488} vw={12} vh={28} hw={44} hh={14}
        status={t("t66").status} number="66"
        onClick={() => onTableClick(t("t66"))} isSelected={selectedId === "t66"}
        chairT={2} chairB={2} chairL={0} chairR={0} />

      {/* ── BILLIARD TABLES ── */}
      <BilliardTableSVG id="b1"
        x={472} y={100} w={108} h={170}
        status={t("b1").status} label="BILLARD 1"
        onClick={() => onTableClick(t("b1"))} isSelected={selectedId === "b1"} />
      <BilliardTableSVG id="b2"
        x={596} y={100} w={108} h={170}
        status={t("b2").status} label="BILLARD 2"
        guestName={t("b2").guestName} time={`${t("b2").startTime} – ${t("b2").endTime}`}
        onClick={() => onTableClick(t("b2"))} isSelected={selectedId === "b2"} />
      <BilliardTableSVG id="b3"
        x={488} y={385} w={148} h={94}
        status={t("b3").status} label="BILLARD 3"
        onClick={() => onTableClick(t("b3"))} isSelected={selectedId === "b3"}
        transform="rotate(-38, 590, 430)" />

      {/* ── DECORATIVE PLANTS ── */}
      <text x={408} y={530} fontSize={24} opacity={0.65}>🌿</text>
      <text x={706} y={530} fontSize={22} opacity={0.55}>🌿</text>
      <text x={440} y={165} fontSize={14} opacity={0.5}>🌿</text>
    </svg>
  )
}

// ─── Side Panel ───────────────────────────────────────────────────────────────

function SidePanel({
  table, onClose,
}: {
  table: TableData | null
  onClose: () => void
}) {
  const today = new Date()
  const dateLabel = `Samstag, ${today.getDate()}. März ${today.getFullYear()}`
  const [note, setNote] = useState("")

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  const statusLabel: Record<TableStatus, string> = {
    free: "Frei", reserved: "Reserviert", present: "Anwesend", booked: "Belegt", blocked: "Gesperrt",
  }
  const statusStyle: Record<TableStatus, { color: string; bg: string }> = {
    free:     { color: "#1db954", bg: "rgba(29,185,84,0.12)" },
    reserved: { color: "#c9a84c", bg: "rgba(201,168,76,0.12)" },
    present:  { color: "#1db954", bg: "rgba(29,185,84,0.12)" },
    booked:   { color: "#3a7bd5", bg: "rgba(58,123,213,0.12)" },
    blocked:  { color: "#999",    bg: "rgba(100,100,100,0.12)" },
  }

  if (!table) return null
  const st = statusStyle[table.status]

  return (
    <>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0"
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)", zIndex: 199 }}
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        key="panel"
        initial={{ x: 440 }}
        animate={{ x: 0 }}
        exit={{ x: 440 }}
        transition={{ duration: 0.32, ease: "easeOut" }}
        className="fixed top-0 right-0 bottom-0 flex flex-col"
        style={{
          width: 420, zIndex: 200,
          background: "#13131a",
          borderLeft: "2px solid #c9a84c",
          boxShadow: "-12px 0 60px rgba(0,0,0,0.7)",
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div>
            <div className="font-display text-2xl" style={{ color: "#f0ede6", letterSpacing: "0.06em" }}>
              {table.number.startsWith("Billard") ? table.number : `Tisch ${table.number}`}
            </div>
            <div className="text-xs mt-0.5" style={{ color: "#666" }}>
              {table.area === "billard" ? "Billard Tisch" :
               table.area === "rest140" ? "Restaurant 140 Zoll" : table.area}
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-md transition-colors hover:bg-red-500/20"
            style={{ width: 26, height: 26, background: "rgba(255,255,255,0.05)", color: "#888" }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Date + Status row */}
        <div className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <span className="text-xs font-semibold" style={{ color: "#aaa" }}>📅 {dateLabel}</span>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ background: st.bg, color: st.color }}>
            {statusLabel[table.status]}
          </span>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          {/* Reservation card */}
          {table.guestName ? (
            <div className="rounded-xl p-4 flex flex-col gap-3"
              style={{ background: "#1a1a24", border: "1px solid rgba(201,168,76,0.1)" }}>
              {/* Time */}
              <div className="flex items-center justify-between">
                <span className="font-display text-lg" style={{ color: "#c9a84c", letterSpacing: "0.08em" }}>
                  {table.startTime} – {table.endTime}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: st.bg, color: st.color }}>
                  {statusLabel[table.status]}
                </span>
                {table.pax !== undefined && (
                  <span className="flex items-center gap-1 text-xs" style={{ color: "#888" }}>
                    <Users className="w-3.5 h-3.5" />
                    {table.pax}
                  </span>
                )}
              </div>
              {/* Guest info */}
              <div>
                <p className="text-sm font-bold" style={{ color: "#f0ede6" }}>{table.guestName}</p>
                <p className="text-xs mt-0.5" style={{ color: "#555" }}>RND-{Math.floor(Math.random() * 9000 + 1000)}</p>
              </div>
              {/* Action buttons */}
              <div className="flex gap-2">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:border-amber-400/50"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#ccc" }}>
                  <Pencil className="w-3 h-3" /> Bearbeiten
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:border-amber-400/50"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#ccc" }}>
                  <Mail className="w-3 h-3" /> Mail
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:border-red-500/40"
                  style={{ background: "rgba(204,34,34,0.08)", border: "1px solid rgba(204,34,34,0.15)", color: "#cc2222" }}>
                  <XCircle className="w-3 h-3" /> Stornieren
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 gap-3"
              style={{ color: "#444" }}>
              <span style={{ fontSize: 36 }}>📅</span>
              <p className="text-sm font-semibold" style={{ color: "#555" }}>Keine Reservierungen heute</p>
              <p className="text-xs text-center" style={{ color: "#444" }}>Dieser Tisch ist aktuell frei.</p>
            </div>
          )}

          {/* Staff note */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: "#555" }}>
              Interne Notiz
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
              placeholder="Interne Notiz (nicht für Gäste)..."
              className="w-full rounded-lg px-3 py-2.5 text-xs resize-none outline-none"
              style={{
                background: "#1a1a24",
                border: "1px solid rgba(201,168,76,0.1)",
                color: "#f0ede6",
                fontFamily: "var(--font-sans)",
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 flex flex-col gap-2"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <button
            className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
            style={{ background: "#c9a84c", color: "#0a0a0a", boxShadow: "0 0 20px rgba(201,168,76,0.25)" }}
          >
            <Plus className="w-4 h-4" /> Neue Reservierung
          </button>
          <div className="flex gap-2">
            <button className="flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              style={{ background: "rgba(29,185,84,0.08)", border: "1px solid rgba(29,185,84,0.15)", color: "#1db954" }}>
              <UserCheck className="w-3.5 h-3.5" /> Einchecken
            </button>
            <button className="flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              style={{ background: "rgba(204,34,34,0.08)", border: "1px solid rgba(204,34,34,0.15)", color: "#cc2222" }}>
              <Lock className="w-3.5 h-3.5" /> Sperren
            </button>
            <button className="flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#888" }}>
              <Mail className="w-3.5 h-3.5" /> Mail
            </button>
          </div>
        </div>
      </motion.div>
    </>
  )
}

// ─── Live Clock ────────────────────────────────────────────────────────────────

function LiveClock() {
  const [time, setTime] = useState("")
  useEffect(() => {
    const fmt = () => {
      const n = new Date()
      const pad = (v: number) => String(v).padStart(2, "0")
      setTime(`${pad(n.getHours())}:${pad(n.getMinutes())}:${pad(n.getSeconds())}`)
    }
    fmt()
    const id = setInterval(fmt, 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <span className="font-display text-lg tabular-nums" style={{ color: "#c9a84c", letterSpacing: "0.06em" }}>
      {time}
    </span>
  )
}

// ─── Topbar ────────────────────────────────────────────────────────────────────

function Topbar({ onNewReservation }: { onNewReservation: () => void }) {
  return (
    <div
      className="flex items-center justify-between px-4 flex-shrink-0"
      style={{
        height: 48, background: "#13131a",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        zIndex: 10,
      }}
    >
      {/* Left: Logo + brand */}
      <div className="flex items-center gap-2.5">
        <div
          className="flex items-center justify-center font-display text-base rounded"
          style={{ width: 28, height: 28, background: "#c9a84c", color: "#0a0a0a", letterSpacing: "0.04em" }}
        >
          R
        </div>
        <div>
          <span className="font-display text-base tracking-widest" style={{ color: "#f0ede6", letterSpacing: "0.12em" }}>RONDO</span>
          <span className="block text-xs uppercase tracking-widest" style={{ color: "#555", fontSize: 8, letterSpacing: "0.2em" }}>Admin</span>
        </div>
      </div>

      {/* Right: clock + date + actions */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end">
          <LiveClock />
          <span className="text-xs" style={{ color: "#555", fontSize: 9 }}>Sa. 8 März 2026</span>
        </div>
        <button
          onClick={onNewReservation}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-[1.03]"
          style={{ background: "#c9a84c", color: "#0a0a0a" }}
        >
          <Plus className="w-3.5 h-3.5" /> Neue Reservierung
        </button>
        <button className="relative p-1.5 rounded-lg transition-colors"
          style={{ background: "rgba(255,255,255,0.05)", color: "#888" }}>
          <Bell className="w-4 h-4" />
          <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full" style={{ background: "#cc2222" }} />
        </button>
        <div
          className="flex items-center justify-center rounded-full text-xs font-bold"
          style={{
            width: 30, height: 30,
            background: "rgba(201,168,76,0.12)",
            border: "1.5px solid rgba(201,168,76,0.4)",
            color: "#c9a84c",
          }}
        >AD</div>
      </div>
    </div>
  )
}

// ─── Right Area Tabs Panel ─────────────────────────────────────────────────────

function RightPanel({
  activeArea, onAreaChange,
}: {
  activeArea: string
  onAreaChange: (id: string) => void
}) {
  return (
    <div
      className="flex flex-col flex-shrink-0 h-full"
      style={{
        width: 146, background: "#13131a",
        borderLeft: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Stats strip */}
      <div className="px-3 pt-3 pb-2 flex flex-col gap-1.5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: "#555" }}>Platziert</span>
          <span className="font-display text-base" style={{ color: "#c9a84c" }}>31</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: "#555" }}>Anwesend</span>
          <span className="font-display text-base" style={{ color: "#1db954" }}>8</span>
        </div>
        <div className="h-px" style={{ background: "rgba(255,255,255,0.04)" }} />
        <div className="text-xs text-right" style={{ color: "#444" }}>37 / 68 Plätze</div>
      </div>

      {/* Area tabs */}
      <div className="flex flex-col flex-1">
        {AREA_TABS.map((tab, i) => {
          const isActive = activeArea === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onAreaChange(tab.id)}
              className="text-left px-3 py-3 transition-all flex flex-col"
              style={{
                background: isActive ? "rgba(201,168,76,0.08)" : "transparent",
                borderLeft: isActive ? "3px solid #c9a84c" : "3px solid transparent",
                borderBottom: "1px solid rgba(255,255,255,0.03)",
              }}
            >
              <span style={{ fontSize: 9, color: "#444", fontWeight: 600 }}>{i + 1}.</span>
              <span
                className="text-xs font-bold leading-tight mt-0.5"
                style={{ color: isActive ? "#c9a84c" : "#666" }}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Bottom button */}
      <div className="p-2.5" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <button
          className="w-full py-2 rounded-lg text-xs text-center transition-colors"
          style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#555" }}
        >
          👁 Ansicht ändern
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function RondoFloorPlanPage() {
  const [activeArea, setActiveArea] = useState("billard")
  const [activeListTab, setActiveListTab] = useState("jetzt")
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null)
  const [selectedRow, setSelectedRow] = useState<ReservationRow | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextToastId = useRef(0)

  const addToast = (type: Toast["type"], text: string, sub: string) => {
    const id = nextToastId.current++
    setToasts(prev => [...prev.slice(-2), { id, type, text, sub }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200)
  }

  // Boot toasts
  useEffect(() => {
    const t1 = setTimeout(() => addToast("green", "Neu: Gutsch – Tisch 65 anwesend", "Bereich: Restaurant 140 Zoll"), 1000)
    const t2 = setTimeout(() => addToast("gold", "VIP Anfrage: Devis – 6 Personen", "VIP Raum · 21:00 Uhr"), 2500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const handleTableClick = (table: TableData) => {
    setSelectedTable(table)
    setPanelOpen(true)
  }

  const handleRowClick = (row: ReservationRow) => {
    setSelectedRow(row)
    // Find matching table
    const tableNum = row.tableRef.split("/")[1]
    const match = TABLES.find(t => t.number === tableNum)
    if (match) {
      setSelectedTable(match)
      setPanelOpen(true)
    }
  }

  const handleAreaChange = (id: string) => {
    const tab = AREA_TABS.find(t => t.id === id)
    setActiveArea(id)
    addToast("gold", `Bereich: ${tab?.label}`, "Grundriss wird angezeigt")
  }

  const handleClosePanel = () => {
    setPanelOpen(false)
    setSelectedTable(null)
    setSelectedRow(null)
  }

  return (
    <div
      className="flex flex-col font-sans"
      style={{
        height: "100vh",
        overflow: "hidden",
        background: "#0c0c10",
        fontFamily: "var(--font-sans)",
      }}
    >
      <Topbar onNewReservation={() => addToast("green", "Neue Reservierung", "Formular öffnen...")} />

      {/* Three-zone layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Reservation list */}
        <LeftPanel
          activeListTab={activeListTab}
          setActiveListTab={setActiveListTab}
          onRowClick={handleRowClick}
          selectedRow={selectedRow}
        />

        {/* Center: Floor plan */}
        <div
          className="flex-1 relative overflow-hidden"
          style={{ background: "#0f0f16" }}
        >
          {/* Radial glow bg */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 60% 50% at 50% 55%, rgba(201,168,76,0.05) 0%, transparent 70%)",
            }}
          />
          <FloorPlanSVG
            tables={TABLES}
            onTableClick={handleTableClick}
            selectedId={selectedTable?.id ?? null}
          />
        </div>

        {/* Right: Area tabs */}
        <RightPanel activeArea={activeArea} onAreaChange={handleAreaChange} />
      </div>

      {/* Slide-in side panel */}
      <AnimatePresence>
        {panelOpen && selectedTable && (
          <SidePanel table={selectedTable} onClose={handleClosePanel} />
        )}
      </AnimatePresence>

      {/* Toasts */}
      <ToastStack toasts={toasts} onRemove={id => setToasts(prev => prev.filter(t => t.id !== id))} />
    </div>
  )
}
