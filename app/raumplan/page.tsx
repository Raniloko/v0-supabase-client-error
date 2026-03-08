"use client"
import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  Bell, Plus, X, UserCheck, Lock, Mail, XCircle,
  ChevronLeft, ChevronRight, Pencil, Users, Eye,
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
  { id: "t30",  number: "30",        area: "billard",  status: "free" },
  { id: "t10",  number: "10",        area: "billard",  status: "reserved", guestName: "Jana",      startTime: "19:00", endTime: "21:00", pax: 4 },
  { id: "t61",  number: "61",        area: "rest140",  status: "booked",   guestName: "Guido",     startTime: "01:30", endTime: "03:00", pax: 2 },
  { id: "t62",  number: "62",        area: "rest140",  status: "booked",   guestName: "Lentino",   startTime: "19:30", endTime: "21:00", pax: 3 },
  { id: "t63",  number: "63",        area: "rest140",  status: "booked",   guestName: "Santos d.", startTime: "20:00", endTime: "22:00", pax: 4 },
  { id: "t60",  number: "60",        area: "rest140",  status: "free" },
  { id: "t64",  number: "64",        area: "rest140",  status: "present",  guestName: "Licata",    startTime: "19:30", endTime: "21:30", pax: 2 },
  { id: "t65",  number: "65",        area: "rest140",  status: "present",  guestName: "Gutsch",    startTime: "20:00", endTime: "22:00", pax: 4 },
  { id: "t50",  number: "50",        area: "rest140",  status: "free" },
  { id: "t51",  number: "51",        area: "rest140",  status: "free" },
  { id: "t52",  number: "52",        area: "rest140",  status: "free" },
  { id: "t53",  number: "53",        area: "rest140",  status: "free" },
  { id: "t54",  number: "54",        area: "rest140",  status: "free" },
  { id: "t58",  number: "58",        area: "rest140",  status: "free" },
  { id: "t59",  number: "59",        area: "rest140",  status: "free" },
  { id: "t66",  number: "66",        area: "rest140",  status: "free" },
  { id: "t67",  number: "67",        area: "rest140",  status: "free" },
  { id: "b1",   number: "Billard 1", area: "billard",  status: "free" },
  { id: "b2",   number: "Billard 2", area: "billard",  status: "reserved", guestName: "Michelik", startTime: "19:15", endTime: "21:15", pax: 4 },
  { id: "b3",   number: "Billard 3", area: "billard",  status: "free" },
]

const AREA_TABS = [
  { id: "billard",   label: "Billard Tisch",            short: "Billard" },
  { id: "salitos",   label: "Salitos Lounge / Outdoor", short: "Salitos" },
  { id: "rest140",   label: "Restaurant 140 Zoll",      short: "140 Zoll" },
  { id: "rest75",    label: "Restaurant 75 Zoll",       short: "75 Zoll" },
  { id: "vip",       label: "VIP Raum / Sport",         short: "VIP" },
]

const STATUS_COLOR: Record<TableStatus, { fill: string; stroke: string; textColor: string }> = {
  free:     { fill: "rgba(184,184,200,0.10)", stroke: "#b8b8c8", textColor: "#b8b8c8" },
  reserved: { fill: "rgba(201,168,76,0.18)",  stroke: "#c9a84c", textColor: "#c9a84c" },
  present:  { fill: "rgba(29,185,84,0.18)",   stroke: "#1db954", textColor: "#1db954" },
  booked:   { fill: "rgba(58,123,213,0.18)",  stroke: "#3a7bd5", textColor: "#3a7bd5" },
  blocked:  { fill: "rgba(204,34,34,0.14)",   stroke: "#cc2222", textColor: "#cc2222" },
}

// ─── Toast System ─────────────────────────────────────────────────────────────

interface Toast { id: number; type: "green" | "gold" | "red"; text: string; sub: string }

function ToastStack({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed bottom-5 right-4 z-50 flex flex-col gap-2 items-end">
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
                minWidth: 240, maxWidth: 320,
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

const LIST_TABS = [
  { key: "jetzt",      label: "Jetzt",      count: 18, color: "" },
  { key: "bevorsteh",  label: "Bevorsteh.", count: 31, color: "" },
  { key: "warteliste", label: "Warteliste", count: 2,  color: "#e67e22" },
  { key: "achtung",    label: "Achtung",    count: 2,  color: "#e67e22" },
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
      className="flex flex-col h-full"
      style={{ width: 262, minWidth: 262, background: "#f4f4f6", borderRight: "1px solid #ddd", overflow: "hidden" }}
    >
      {/* Dark header */}
      <div style={{ background: "#1a1a2a", flexShrink: 0 }}>
        {/* Title row */}
        <div className="flex items-center gap-2 px-3 pt-2.5 pb-1.5">
          <span style={{ fontSize: 12 }}>📋</span>
          <span
            className="text-sm tracking-wide"
            style={{ color: "#f0ede6", fontFamily: "'Bebas Neue', var(--font-display), cursive", letterSpacing: "0.08em" }}
          >
            Reservierungsliste
          </span>
          <span
            className="px-1.5 py-0.5 rounded text-xs font-bold"
            style={{ background: "#c9a84c", color: "#0a0a0a" }}
          >
            18
          </span>
          <div className="ml-auto">
            <span
              className="px-1.5 py-0.5 rounded text-xs font-semibold"
              style={{ background: "rgba(29,185,84,0.2)", color: "#1db954", border: "1px solid rgba(29,185,84,0.25)" }}
            >
              ✓ 31 Platziert
            </span>
          </div>
        </div>

        {/* Tabs row */}
        <div className="flex px-2 pb-1.5 gap-1">
          {LIST_TABS.map(tab => {
            const isActive = activeListTab === tab.key
            const accentColor = tab.color || "#c9a84c"
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
                  style={{
                    color: tab.color || (isActive ? "#c9a84c" : "#aaa"),
                    fontFamily: "'Bebas Neue', cursive",
                    fontSize: 15,
                    lineHeight: 1,
                  }}
                >
                  {tab.count}
                </span>
                <span style={{ color: tab.color || (isActive ? "#c9a84c" : "#888"), fontSize: 8, marginTop: 2 }}>
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Date nav row */}
        <div
          className="flex items-center gap-1 px-2 py-1.5"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          <button
            className="w-6 h-6 flex items-center justify-center rounded"
            style={{ background: "rgba(255,255,255,0.06)", color: "#aaa" }}
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
          <span className="flex-1 text-center text-xs font-semibold" style={{ color: "#f0ede6" }}>Sa. 7 März</span>
          <button
            className="w-6 h-6 flex items-center justify-center rounded"
            style={{ background: "rgba(255,255,255,0.06)", color: "#aaa" }}
          >
            <ChevronRight className="w-3 h-3" />
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
        className="grid"
        style={{
          gridTemplateColumns: "40px 20px 1fr 38px 16px 16px 24px",
          background: "#e8e8ee",
          borderBottom: "1px solid #d8d8e2",
          padding: "4px 6px",
          flexShrink: 0,
        }}
      >
        {["Uhrzeit", "G.", "Name", "Tisch", "🕐", "⚠", "✓"].map(h => (
          <span key={h} className="text-center" style={{ fontSize: 7.5, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.03em" }}>
            {h}
          </span>
        ))}
      </div>

      {/* Reservation rows */}
      <div className="flex-1 overflow-y-auto" style={{ background: "#fff" }}>
        {RESERVATIONS.map((r, i) => {
          const isSelected = selectedRow?.name === r.name && selectedRow?.time === r.time
          const isGreen = r.checkStatus === "double"
          return (
            <div
              key={i}
              onClick={() => onRowClick(r)}
              className="grid items-center"
              style={{
                gridTemplateColumns: "40px 20px 1fr 38px 16px 16px 24px",
                padding: "5px 6px",
                borderBottom: "1px solid rgba(0,0,0,0.04)",
                background: isSelected
                  ? "rgba(201,168,76,0.09)"
                  : r.highlighted
                  ? "rgba(201,168,76,0.05)"
                  : isGreen
                  ? "rgba(29,185,84,0.03)"
                  : "transparent",
                borderLeft: r.highlighted
                  ? "2.5px solid #c9a84c"
                  : isSelected
                  ? "2.5px solid rgba(201,168,76,0.55)"
                  : "2.5px solid transparent",
                cursor: "pointer",
                transition: "background 0.12s",
              }}
              onMouseEnter={e => {
                if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = "#eeeef8"
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.background = isSelected
                  ? "rgba(201,168,76,0.09)"
                  : r.highlighted
                  ? "rgba(201,168,76,0.05)"
                  : isGreen
                  ? "rgba(29,185,84,0.03)"
                  : "transparent"
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 700, color: "#222", fontFamily: "monospace" }}>{r.time}</span>
              <span className="text-center" style={{ fontSize: 10, color: "#555" }}>{r.guests}</span>
              <span style={{ fontSize: 10, color: "#111", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {r.name}
              </span>
              <span className="text-center" style={{ fontSize: 9, color: "#777" }}>{r.tableRef}</span>
              <span className="text-center" style={{ fontSize: 9, color: "#bbb" }}></span>
              <span className="text-center" style={{ fontSize: 10 }}>
                {r.hasWarning && <span style={{ color: "#e67e22" }}>⚠</span>}
              </span>
              <span className="text-center" style={{ fontSize: 9 }}>
                {r.checkStatus === "double"  && <span style={{ color: "#1db954", fontWeight: 800 }}>✓✓</span>}
                {r.checkStatus === "single"  && <span style={{ color: "#1db954", fontWeight: 800 }}>✓</span>}
                {r.checkStatus === "info"    && <span style={{ color: "#c9a84c", fontWeight: 800 }}>ℹ</span>}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── TableCross SVG component ─────────────────────────────────────────────────

function TableCross({
  cx, cy, vw, vh, hw, hh,
  status, number, pax, guestName, time,
  onClick, isSelected,
  chairT = 0, chairB = 0, chairL = 0, chairR = 0,
}: {
  cx: number; cy: number; vw: number; vh: number; hw: number; hh: number
  status: TableStatus; number: string
  pax?: number; guestName?: string; time?: string
  onClick: () => void; isSelected: boolean
  chairT?: number; chairB?: number; chairL?: number; chairR?: number
}) {
  const sc = STATUS_COLOR[status]
  const cW = 8; const cH = 6; const cGap = 5

  const renderChairs = (count: number, axis: "h" | "v", ox: number, oy: number) => {
    if (count === 0) return null
    const total = count * cW + (count - 1) * cGap
    return Array.from({ length: count }).map((_, i) => {
      const off = -total / 2 + i * (cW + cGap)
      return (
        <rect
          key={i}
          x={axis === "h" ? ox + off         : ox}
          y={axis === "h" ? oy               : oy + off}
          width={axis === "h" ? cW : cH}
          height={axis === "h" ? cH : cW}
          rx={2}
          fill={sc.stroke}
          opacity={0.38}
        />
      )
    })
  }

  const tagW = hw + 4
  const tagX = cx - tagW / 2

  return (
    <g onClick={onClick} style={{ cursor: "pointer" }}>
      {/* Chairs */}
      {renderChairs(chairT, "h", cx, cy - vh / 2 - cH - 2)}
      {renderChairs(chairB, "h", cx, cy + vh / 2 + 2)}
      {renderChairs(chairL, "v", cx - hw / 2 - cH - 2, cy)}
      {renderChairs(chairR, "v", cx + hw / 2 + 2, cy)}

      {/* Vertical bar */}
      <rect
        x={cx - vw / 2} y={cy - vh / 2} width={vw} height={vh} rx={3.5}
        fill={isSelected ? sc.stroke : sc.fill}
        stroke={isSelected ? "#f0c060" : sc.stroke}
        strokeWidth={isSelected ? 2 : 1.5}
        opacity={0.93}
      />
      {/* Horizontal bar */}
      <rect
        x={cx - hw / 2} y={cy - hh / 2} width={hw} height={hh} rx={3.5}
        fill={isSelected ? sc.stroke : sc.fill}
        stroke={isSelected ? "#f0c060" : sc.stroke}
        strokeWidth={isSelected ? 2 : 1.5}
        opacity={0.93}
      />

      {/* Pax badge */}
      {pax !== undefined && (
        <>
          <rect x={cx - hw / 2 + 2} y={cy - vh / 2 + 2} width={18} height={12} rx={3} fill="rgba(0,0,0,0.6)" />
          <text x={cx - hw / 2 + 11} y={cy - vh / 2 + 11} textAnchor="middle" fill="white" fontSize={7} fontWeight="bold">{pax}</text>
        </>
      )}

      {/* Table number */}
      <text
        x={cx} y={cy + 4}
        textAnchor="middle"
        fill={sc.textColor}
        fontSize={10} fontWeight="bold"
        fontFamily="'Bebas Neue', cursive"
        letterSpacing="0.05em"
      >
        {number}
      </text>

      {/* Name tag */}
      {guestName && (
        <>
          <rect x={tagX} y={cy + vh / 2 + 4} width={tagW} height={14} rx={3} fill={sc.stroke} opacity={0.9} />
          <text x={cx} y={cy + vh / 2 + 14} textAnchor="middle" fill="white" fontSize={8} fontWeight="bold">{guestName}</text>
          {time && (
            <>
              <rect x={tagX} y={cy + vh / 2 + 18} width={tagW} height={13} rx={3} fill={sc.fill} opacity={0.95} />
              <text x={cx} y={cy + vh / 2 + 28} textAnchor="middle" fill={sc.textColor} fontSize={7.5}>{time}</text>
            </>
          )}
        </>
      )}

      {/* Selected ring */}
      {isSelected && (
        <rect
          x={cx - hw / 2 - 5} y={cy - vh / 2 - 5}
          width={hw + 10} height={vh + 10}
          rx={6} fill="none"
          stroke="rgba(201,168,76,0.55)" strokeWidth={1.5}
          strokeDasharray="4 3"
        />
      )}
    </g>
  )
}

// ─── Billiard Table SVG ────────────────────────────────────────────────────────

function BilliardTableSVG({
  x, y, w, h, status, label, guestName, time, onClick, isSelected, transform,
}: {
  x: number; y: number; w: number; h: number
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
  const strokeColor = isSelected ? "#f0c060" : status === "free" ? "#8B5E2A" : sc.stroke
  const strokeWidth = isSelected ? 3 : 3

  return (
    <g transform={transform} onClick={onClick} style={{ cursor: "pointer" }}>
      <text x={x + w / 2} y={y - 6} textAnchor="middle"
        fill="#3a3a4a" fontSize={8} fontFamily="'Bebas Neue', cursive" letterSpacing="0.1em" opacity={0.8}>
        {label}
      </text>
      <rect x={x} y={y} width={w} height={h} rx={6}
        fill={status === "reserved" ? "rgba(28,107,42,0.88)" : "#1a6b2a"}
        stroke={strokeColor} strokeWidth={strokeWidth}
      />
      {status === "reserved" && (
        <rect x={x} y={y} width={w} height={h} rx={6} fill="rgba(201,168,76,0.08)" />
      )}
      <line x1={x + 8} y1={y + h / 2} x2={x + w - 8} y2={y + h / 2}
        stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
      {balls.map((b, i) => (
        <circle key={i} cx={b.cx} cy={b.cy} r={4} fill={b.fill} opacity={0.75} />
      ))}
      {pockets.map(([px, py], i) => (
        <circle key={i} cx={px} cy={py} r={5.5} fill="#040404" stroke="rgba(255,255,255,0.08)" strokeWidth={0.5} />
      ))}
      <text x={x + w / 2} y={y + h / 2 + 5} textAnchor="middle"
        fill={status === "reserved" ? "#c9a84c" : "rgba(255,255,255,0.18)"}
        fontSize={13} fontFamily="'Bebas Neue', cursive">
        {label.replace("BILLARD ", "")}
      </text>
      {/* Name tag */}
      {guestName && !transform && (
        <>
          <rect x={x} y={y + h + 5} width={w} height={15} rx={3} fill="#c9a84c" opacity={0.9} />
          <text x={x + w / 2} y={y + h + 15} textAnchor="middle" fill="white" fontSize={8} fontWeight="bold">{guestName}</text>
          {time && (
            <>
              <rect x={x} y={y + h + 20} width={w} height={13} rx={3} fill="rgba(201,168,76,0.22)" />
              <text x={x + w / 2} y={y + h + 30} textAnchor="middle" fill="#c9a84c" fontSize={7.5}>{time}</text>
            </>
          )}
        </>
      )}
      {isSelected && (
        <rect x={x - 4} y={y - 4} width={w + 8} height={h + 8} rx={9}
          fill="none" stroke="rgba(201,168,76,0.55)" strokeWidth={1.5} strokeDasharray="5 3" />
      )}
    </g>
  )
}

// ─── Floor Plan SVG ────────────────────────────────────────────────────────────

function FloorPlanSVG({
  tables, onTableClick, selectedId,
}: {
  tables: TableData[]
  onTableClick: (t: TableData) => void
  selectedId: string | null
}) {
  const tbl = (id: string) => tables.find(t => t.id === id)!

  // Cross-table shorthand
  const TC = (id: string, cx: number, cy: number, vw: number, vh: number, hw: number, hh: number,
    cT = 2, cB = 2, cL = 1, cR = 1) => {
    const t = tbl(id)
    return (
      <TableCross
        cx={cx} cy={cy} vw={vw} vh={vh} hw={hw} hh={hh}
        status={t.status} number={t.number}
        pax={t.pax} guestName={t.guestName} time={t.startTime}
        onClick={() => onTableClick(t)} isSelected={selectedId === id}
        chairT={cT} chairB={cB} chairL={cL} chairR={cR}
      />
    )
  }

  return (
    <svg
      viewBox="0 0 860 570"
      preserveAspectRatio="xMidYMid meet"
      className="w-full h-full"
      style={{ display: "block" }}
    >
      <defs>
        <radialGradient id="centerGlow" cx="52%" cy="54%" r="42%">
          <stop offset="0%" stopColor="rgba(255,140,0,0.09)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
        <radialGradient id="bgGrad" cx="50%" cy="50%" r="75%">
          <stop offset="0%" stopColor="#161622" />
          <stop offset="100%" stopColor="#0c0c12" />
        </radialGradient>
      </defs>

      {/* Background */}
      <rect x={0} y={0} width={860} height={570} fill="url(#bgGrad)" />
      <rect x={0} y={0} width={860} height={570} fill="url(#centerGlow)" />

      {/* ── BOTTOM-LEFT: RONDO brand box ── */}
      <rect x={6} y={390} width={190} height={170} rx={4}
        fill="rgba(13,13,20,0.94)" stroke="#25253a" strokeWidth={1.5} />
      <text x={95} y={468} textAnchor="middle" fill="#c9a84c" fontSize={28}
        fontFamily="'Bebas Neue', cursive" letterSpacing="0.15em" opacity={0.95}>RONDO</text>
      <text x={95} y={483} textAnchor="middle" fill="#3a3a52" fontSize={8}
        letterSpacing="0.25em">GOOD TIMES</text>
      <text x={20} y={550} fontSize={28} opacity={0.65}>🌿</text>
      <text x={155} y={555} fontSize={20} opacity={0.5}>🌿</text>

      {/* ── TOP-RIGHT: Two screen boxes ── */}
      <rect x={560} y={8} width={140} height={76} rx={4}
        fill="rgba(8,8,14,0.97)" stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
      <text x={630} y={50} textAnchor="middle" fill="#1c1c2a" fontSize={13}
        fontFamily="'Bebas Neue', cursive" letterSpacing="0.12em">SCREEN</text>
      <rect x={714} y={8} width={138} height={76} rx={4}
        fill="rgba(8,8,14,0.97)" stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
      <text x={783} y={50} textAnchor="middle" fill="#1c1c2a" fontSize={13}
        fontFamily="'Bebas Neue', cursive" letterSpacing="0.12em">SCREEN</text>

      {/* ── ENCLOSED LEFT BOX (restaurant tables 61-65) ── */}
      <rect x={6} y={220} width={190} height={166} rx={4}
        fill="rgba(12,12,18,0.85)" stroke="#25253a" strokeWidth={1.5} />

      {/* Box row 1: T62 left, T61 right */}
      {TC("t62", 52,  265, 22, 44, 48, 16,  2, 2, 1, 1)}
      {TC("t61", 146, 265, 22, 44, 48, 16,  2, 2, 1, 1)}

      {/* Box row 2: T63 left, T60 right */}
      {TC("t63", 52,  342, 22, 44, 48, 16,  2, 2, 1, 1)}
      {TC("t60", 146, 342, 22, 44, 48, 16,  2, 2, 1, 1)}

      {/* ── BOTTOM-LEFT corner: T64 + T65 (below box, outside it) ── */}
      {TC("t64", 52,  430, 22, 44, 48, 16,  2, 2, 1, 1)}
      {TC("t65", 146, 430, 22, 44, 48, 16,  2, 2, 1, 1)}

      {/* ── TABLE 30 – isolated top-left area, FREE ── */}
      {TC("t30", 256, 56, 20, 46, 52, 18,  2, 2, 1, 1)}

      {/* ── TABLE 10 – isolated top center, GOLD reserved ── */}
      {TC("t10", 390, 56, 20, 46, 52, 18,  2, 2, 1, 1)}

      {/* ── CENTER: Row 1 → T52, T53, T54 ── */}
      {TC("t52", 256, 168, 20, 48, 52, 18,  2, 2, 1, 1)}
      {TC("t53", 358, 168, 20, 48, 52, 18,  2, 2, 1, 1)}
      {/* T54 is a LARGE elongated table */}
      {TC("t54", 470, 176, 26, 54, 90, 22,  3, 3, 1, 1)}

      {/* ── CENTER: Row 2 → T51, T50, T58 ── */}
      {TC("t51", 256, 280, 20, 48, 52, 18,  2, 2, 1, 1)}
      {TC("t50", 358, 282, 22, 52, 58, 20,  3, 3, 1, 1)}
      {TC("t58", 474, 286, 20, 48, 52, 18,  2, 2, 1, 1)}

      {/* ── CENTER: Row 3 → T67, T66 ── */}
      {TC("t67", 310, 390, 20, 48, 52, 18,  2, 2, 1, 1)}
      {TC("t66", 418, 390, 20, 48, 52, 18,  2, 2, 1, 1)}

      {/* T59 small – bottom area */}
      {TC("t59", 256, 478, 12, 26, 40, 13,  1, 1, 0, 0)}

      {/* ── BILLIARD TABLES ──
            Screenshot (landscape): B1 top-left, B2 top-right (side by side),
            B3 diagonal rotated, positioned below and between B1/B2.
      ── */}
      {/* Billard 1 – top, FREE */}
      <BilliardTableSVG
        x={574} y={100} w={118} h={176}
        status={tbl("b1").status} label="BILLARD 1"
        onClick={() => onTableClick(tbl("b1"))} isSelected={selectedId === "b1"}
      />
      {/* Billard 2 – top right, GOLD (Michelik) */}
      <BilliardTableSVG
        x={718} y={100} w={118} h={176}
        status={tbl("b2").status} label="BILLARD 2"
        guestName={tbl("b2").guestName}
        time={`${tbl("b2").startTime} – ${tbl("b2").endTime}`}
        onClick={() => onTableClick(tbl("b2"))} isSelected={selectedId === "b2"}
      />
      {/* Billard 3 – diagonal, bottom-right */}
      <BilliardTableSVG
        x={600} y={355} w={164} h={102}
        status={tbl("b3").status} label="BILLARD 3"
        onClick={() => onTableClick(tbl("b3"))} isSelected={selectedId === "b3"}
        transform="rotate(-32, 682, 406)"
      />

      {/* Decorative plants */}
      <text x={510} y={490} fontSize={20} opacity={0.5}>🌿</text>
      <text x={840} y={555} fontSize={18} opacity={0.4}>🌿</text>
    </svg>
  )
}

// ─── Side Panel ───────────────────────────────────────────────────────────────

function SidePanel({ table, onClose }: { table: TableData | null; onClose: () => void }) {
  const [note, setNote] = useState("")

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  const AREA_LABELS: Record<string, string> = {
    billard: "Billard Tisch",
    rest140: "Restaurant 140 Zoll",
    rest75:  "Restaurant 75 Zoll / Sport",
    salitos: "Salitos Lounge / Outdoor",
    vip:     "VIP Raum / Sport",
  }
  const STATUS_LABEL: Record<TableStatus, string> = {
    free: "Frei", reserved: "Reserviert", present: "Anwesend", booked: "Belegt", blocked: "Gesperrt",
  }
  const STATUS_STYLE: Record<TableStatus, { color: string; bg: string }> = {
    free:    { color: "#1db954", bg: "rgba(29,185,84,0.12)" },
    reserved:{ color: "#c9a84c", bg: "rgba(201,168,76,0.12)" },
    present: { color: "#1db954", bg: "rgba(29,185,84,0.12)" },
    booked:  { color: "#3a7bd5", bg: "rgba(58,123,213,0.12)" },
    blocked: { color: "#999",    bg: "rgba(100,100,100,0.12)" },
  }

  if (!table) return null
  const st = STATUS_STYLE[table.status]

  return (
    <>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0"
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)", zIndex: 199 }}
        onClick={onClose}
      />
      <motion.div
        key="panel"
        initial={{ x: 440 }} animate={{ x: 0 }} exit={{ x: 440 }}
        transition={{ duration: 0.32, ease: "easeOut" }}
        className="fixed top-0 right-0 bottom-0 flex flex-col"
        style={{ width: 420, zIndex: 200, background: "#13131a", borderLeft: "2px solid #c9a84c", boxShadow: "-12px 0 60px rgba(0,0,0,0.7)" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div>
            <div style={{ color: "#f0ede6", fontFamily: "'Bebas Neue', cursive", fontSize: 22, letterSpacing: "0.06em" }}>
              {table.number.startsWith("Billard") ? table.number : `Tisch ${table.number}`}
            </div>
            <div className="text-xs mt-0.5" style={{ color: "#555" }}>{AREA_LABELS[table.area] ?? table.area}</div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-md transition-colors"
            style={{ width: 28, height: 28, background: "rgba(255,255,255,0.05)", color: "#777" }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(204,34,34,0.2)"; (e.currentTarget as HTMLButtonElement).style.color = "#cc2222" }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLButtonElement).style.color = "#777" }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Date + status */}
        <div className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <span className="text-xs font-semibold" style={{ color: "#888" }}>📅 Samstag, 8. März 2026</span>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ background: st.bg, color: st.color }}>
            {STATUS_LABEL[table.status]}
          </span>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          {table.guestName ? (
            <div className="rounded-xl p-4 flex flex-col gap-3"
              style={{ background: "#1a1a24", border: "1px solid rgba(201,168,76,0.1)" }}>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span style={{ color: "#c9a84c", fontFamily: "'Bebas Neue', cursive", fontSize: 19, letterSpacing: "0.06em" }}>
                  {table.startTime} – {table.endTime}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: st.bg, color: st.color }}>
                  {STATUS_LABEL[table.status]}
                </span>
                {table.pax !== undefined && (
                  <span className="flex items-center gap-1 text-xs" style={{ color: "#888" }}>
                    <Users className="w-3.5 h-3.5" /> {table.pax}
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: "#f0ede6" }}>{table.guestName}</p>
                <p className="text-xs mt-0.5" style={{ color: "#444" }}>RND-{(1000 + parseInt(table.id.replace(/\D/g, ""), 10) * 137 % 9000)}</p>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#ccc" }}>
                  <Pencil className="w-3 h-3" /> Bearbeiten
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#ccc" }}>
                  <Mail className="w-3 h-3" /> Mail
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                  style={{ background: "rgba(204,34,34,0.08)", border: "1px solid rgba(204,34,34,0.15)", color: "#cc2222" }}>
                  <XCircle className="w-3 h-3" /> Stornieren
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 gap-3" style={{ color: "#444" }}>
              <span style={{ fontSize: 36 }}>📅</span>
              <p className="text-sm font-semibold" style={{ color: "#555" }}>Keine Reservierungen heute</p>
              <p className="text-xs text-center" style={{ color: "#444" }}>Dieser Tisch ist aktuell frei.</p>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: "#444" }}>
              Interne Notiz
            </label>
            <textarea
              value={note} onChange={e => setNote(e.target.value)}
              rows={3}
              placeholder="Interne Notiz (nicht für Gäste)..."
              className="w-full rounded-lg px-3 py-2.5 text-xs resize-none outline-none"
              style={{ background: "#1a1a24", border: "1px solid rgba(201,168,76,0.1)", color: "#f0ede6" }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 flex flex-col gap-2"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <button
            className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
            style={{ background: "#c9a84c", color: "#0a0a0a", boxShadow: "0 0 20px rgba(201,168,76,0.22)" }}
          >
            <Plus className="w-4 h-4" /> Neue Reservierung
          </button>
          <div className="flex gap-2">
            <button className="flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
              style={{ background: "rgba(29,185,84,0.08)", border: "1px solid rgba(29,185,84,0.15)", color: "#1db954" }}>
              <UserCheck className="w-3.5 h-3.5" /> Einchecken
            </button>
            <button className="flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
              style={{ background: "rgba(204,34,34,0.08)", border: "1px solid rgba(204,34,34,0.15)", color: "#cc2222" }}>
              <Lock className="w-3.5 h-3.5" /> Sperren
            </button>
            <button className="flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
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
      const p = (v: number) => String(v).padStart(2, "0")
      setTime(`${p(n.getHours())}:${p(n.getMinutes())}:${p(n.getSeconds())}`)
    }
    fmt()
    const id = setInterval(fmt, 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <span style={{ color: "#c9a84c", fontFamily: "'Bebas Neue', cursive", fontSize: 18, letterSpacing: "0.06em" }}>
      {time}
    </span>
  )
}

// ─── Topbar ────────────────────────────────────────────────────────────────────

function Topbar({ onNewReservation }: { onNewReservation: () => void }) {
  return (
    <div className="flex items-center justify-between px-4 flex-shrink-0"
      style={{ height: 48, background: "#13131a", borderBottom: "1px solid rgba(255,255,255,0.06)", zIndex: 10 }}>
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center rounded"
          style={{ width: 28, height: 28, background: "#c9a84c", color: "#0a0a0a", fontFamily: "'Bebas Neue', cursive", fontSize: 16 }}>
          R
        </div>
        <div>
          <div style={{ color: "#f0ede6", fontFamily: "'Bebas Neue', cursive", fontSize: 16, letterSpacing: "0.12em" }}>RONDO</div>
          <div style={{ color: "#555", fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase" }}>Admin</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end">
          <LiveClock />
          <span style={{ color: "#555", fontSize: 9 }}>Sa. 8 März 2026</span>
        </div>
        <button
          onClick={onNewReservation}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
          style={{ background: "#c9a84c", color: "#0a0a0a" }}
        >
          <Plus className="w-3.5 h-3.5" /> Neue Reservierung
        </button>
        <button className="relative p-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.05)", color: "#888" }}>
          <Bell className="w-4 h-4" />
          <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full" style={{ background: "#cc2222" }} />
        </button>
        <div className="flex items-center justify-center rounded-full text-xs font-bold"
          style={{ width: 30, height: 30, background: "rgba(201,168,76,0.12)", border: "1.5px solid rgba(201,168,76,0.4)", color: "#c9a84c" }}>
          AD
        </div>
      </div>
    </div>
  )
}

// ─── Area Tabs Bar (horizontal scrollable, sits ABOVE the floor plan) ────────────

function AreaTabsBar({
  activeArea, onAreaChange, addToast,
}: {
  activeArea: string
  onAreaChange: (id: string) => void
  addToast: (type: Toast["type"], text: string, sub: string) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <div
      className="flex items-stretch flex-shrink-0"
      style={{
        height: 46,
        background: "#12121c",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* Stats strip – fixed left, never scrolls */}
      <div
        className="flex items-center gap-5 px-4 flex-shrink-0"
        style={{ borderRight: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="flex flex-col items-center leading-none">
          <span style={{ color: "#c9a84c", fontFamily: "'Bebas Neue', cursive", fontSize: 17, lineHeight: 1 }}>31</span>
          <span style={{ color: "#555", fontSize: 8, marginTop: 1, letterSpacing: "0.05em", textTransform: "uppercase" }}>Platziert</span>
        </div>
        <div className="flex flex-col items-center leading-none">
          <span style={{ color: "#1db954", fontFamily: "'Bebas Neue', cursive", fontSize: 17, lineHeight: 1 }}>8</span>
          <span style={{ color: "#555", fontSize: 8, marginTop: 1, letterSpacing: "0.05em", textTransform: "uppercase" }}>Anwesend</span>
        </div>
        <span style={{ color: "#3a3a52", fontSize: 9, fontWeight: 600 }}>37/68</span>
      </div>

      {/* Scrollable area tabs */}
      <div
        ref={scrollRef}
        className="flex items-stretch flex-1 overflow-x-auto"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <style>{`.area-tabs-scroll::-webkit-scrollbar { display: none }`}</style>
        {AREA_TABS.map((tab, i) => {
          const isActive = activeArea === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => {
                onAreaChange(tab.id)
                addToast("gold", `Bereich: ${tab.label}`, "Grundriss wird angezeigt")
              }}
              style={{
                minWidth: 148,
                padding: "0 18px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
                background: isActive ? "rgba(201,168,76,0.1)" : "rgba(255,255,255,0.02)",
                borderBottom: isActive ? "2.5px solid #c9a84c" : "2.5px solid transparent",
                borderRight: "1px solid rgba(255,255,255,0.05)",
                cursor: "pointer",
                transition: "background 0.15s",
                flexShrink: 0,
              }}
              onMouseEnter={e => {
                if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = isActive ? "rgba(201,168,76,0.1)" : "rgba(255,255,255,0.02)"
              }}
            >
              <span style={{ color: "#3a3a52", fontSize: 8, letterSpacing: "0.08em" }}>{i + 1}.</span>
              <span
                style={{
                  color: isActive ? "#c9a84c" : "#9a9aaa",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                  whiteSpace: "nowrap",
                }}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* View toggle – fixed right */}
      <div className="flex items-center px-3 flex-shrink-0" style={{ borderLeft: "1px solid rgba(255,255,255,0.07)" }}>
        <button
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
          style={{ border: "1px solid rgba(255,255,255,0.09)", color: "#666", background: "rgba(255,255,255,0.03)", whiteSpace: "nowrap" }}
        >
          <Eye className="w-3 h-3" /> Ansicht
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function RondoFloorPlanPage() {
  const [activeArea, setActiveArea]       = useState("billard")
  const [activeListTab, setActiveListTab] = useState("jetzt")
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null)
  const [selectedRow, setSelectedRow]     = useState<ReservationRow | null>(null)
  const [panelOpen, setPanelOpen]         = useState(false)
  const [toasts, setToasts]               = useState<Toast[]>([])
  const nextToastId                        = useRef(0)

  const addToast = (type: Toast["type"], text: string, sub: string) => {
    const id = nextToastId.current++
    setToasts(prev => [...prev.slice(-2), { id, type, text, sub }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200)
  }

  useEffect(() => {
    const t1 = setTimeout(() => addToast("green", "Neu: Gutsch – Tisch 65 anwesend", "Bereich: Restaurant 140 Zoll"), 1000)
    const t2 = setTimeout(() => addToast("gold",  "VIP Anfrage: Devis – 6 Personen",  "VIP Raum · 21:00 Uhr"), 2500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const handleTableClick = (table: TableData) => {
    setSelectedTable(table)
    setPanelOpen(true)
  }

  const handleRowClick = (row: ReservationRow) => {
    setSelectedRow(row)
    const tableNum = row.tableRef.split("/")[1]
    const match = TABLES.find(t => t.number === tableNum)
    if (match) { setSelectedTable(match); setPanelOpen(true) }
  }

  const handleClosePanel = () => {
    setPanelOpen(false)
    setSelectedTable(null)
    setSelectedRow(null)
  }

  return (
    <div
      className="flex flex-col"
      style={{ height: "100vh", overflow: "hidden", background: "#0c0c10", fontFamily: "DM Sans, var(--font-sans), sans-serif" }}
    >
      {/* Topbar */}
      <Topbar onNewReservation={() => addToast("green", "Neue Reservierung", "Formular wird geöffnet...")} />

      {/* Main body: Left panel + (Area tabs bar + Floor plan) */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT: Reservation list */}
        <LeftPanel
          activeListTab={activeListTab}
          setActiveListTab={setActiveListTab}
          onRowClick={handleRowClick}
          selectedRow={selectedRow}
        />

        {/* RIGHT of left panel: Area tabs on top + floor plan below */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <AreaTabsBar
            activeArea={activeArea}
            onAreaChange={setActiveArea}
            addToast={addToast}
          />
          {/* Floor plan canvas */}
          <div className="flex-1 relative overflow-hidden" style={{ background: "#0f0f16" }}>
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse 60% 50% at 50% 55%, rgba(201,168,76,0.05) 0%, transparent 70%)" }}
            />
            <FloorPlanSVG
              tables={TABLES}
              onTableClick={handleTableClick}
              selectedId={selectedTable?.id ?? null}
            />
          </div>
        </div>
      </div>

      {/* Slide-in side panel */}
      <AnimatePresence>
        {panelOpen && selectedTable && (
          <SidePanel table={selectedTable} onClose={handleClosePanel} />
        )}
      </AnimatePresence>

      <ToastStack toasts={toasts} onRemove={id => setToasts(prev => prev.filter(t => t.id !== id))} />
    </div>
  )
}
