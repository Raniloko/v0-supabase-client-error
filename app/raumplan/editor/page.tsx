"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Plus, Save, Trash2, RotateCcw, Grid, Lock, Unlock,
  ZoomIn, ZoomOut, Maximize2, Copy, Layers, Settings2,
  AlignLeft, AlignCenter, AlignRight, Table2, Circle,
  Move, MousePointer, Type, Minus, ChevronDown, X, Check
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

type ObjType = "table" | "billiard" | "wall" | "plant" | "logo"
type StatusType = "free" | "reserved" | "occupied" | "blocked"

interface FloorObject {
  id: string
  type: ObjType
  x: number
  y: number
  rotation: number
  seats: number
  status: StatusType
  label: string
  area_id: string
  data_json: Record<string, unknown>
  width?: number
  height?: number
  locked?: boolean
}

const AREAS = [
  { id: "restaurant140", label: "Restaurant 140 Zoll" },
  { id: "billard",       label: "Billard Tisch" },
  { id: "salitos",       label: "Salitos Lounge" },
  { id: "restaurant75",  label: "Restaurant 75 Zoll" },
  { id: "vip",           label: "VIP Raum" },
]

const STATUS_COLORS: Record<StatusType, string> = {
  free:     "#b8b8c8",
  reserved: "#c9a84c",
  occupied: "#1db954",
  blocked:  "#cc2222",
}

const DEFAULT_TABLE_W = 60
const DEFAULT_TABLE_H = 60
const BILLIARD_W = 108
const BILLIARD_H = 68
const GRID_SIZE = 10

// ─── Helpers ──────────────────────────────────────────────────────────────────

function snapToGrid(v: number, snap: boolean) {
  return snap ? Math.round(v / GRID_SIZE) * GRID_SIZE : v
}

function newId() {
  return `obj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

// ─── SVG Table Shape (cross / plus) ───────────────────────────────────────────

function TableShape({
  obj, selected, onPointerDown, onDoubleClick,
}: {
  obj: FloorObject
  selected: boolean
  onPointerDown: (e: React.PointerEvent, id: string) => void
  onDoubleClick: (id: string) => void
}) {
  const w = obj.width ?? DEFAULT_TABLE_W
  const h = obj.height ?? DEFAULT_TABLE_H
  const cx = obj.x + w / 2
  const cy = obj.y + h / 2
  const fill = STATUS_COLORS[obj.status]

  const vw = Math.round(w * 0.30), vh = Math.round(h * 0.80)
  const hw = Math.round(w * 0.80), hh = Math.round(h * 0.30)
  const chairSize = 7
  const chairGap = 3

  // Chair positions
  const chairs: { x: number; y: number; rot: number }[] = []
  const seatCount = obj.seats || 4
  const topSeats = Math.max(1, Math.floor(seatCount / 4))
  const sideSeats = Math.max(1, Math.floor(seatCount / 4))

  for (let i = 0; i < topSeats; i++) {
    const px = cx - ((topSeats - 1) / 2 - i) * (chairSize + 2)
    chairs.push({ x: px, y: cy - vh / 2 - chairGap - chairSize / 2, rot: 0 })
  }
  for (let i = 0; i < topSeats; i++) {
    const px = cx - ((topSeats - 1) / 2 - i) * (chairSize + 2)
    chairs.push({ x: px, y: cy + vh / 2 + chairGap + chairSize / 2, rot: 0 })
  }
  for (let i = 0; i < sideSeats; i++) {
    const py = cy - ((sideSeats - 1) / 2 - i) * (chairSize + 2)
    chairs.push({ x: cx - hw / 2 - chairGap - chairSize / 2, y: py, rot: 90 })
  }
  for (let i = 0; i < sideSeats; i++) {
    const py = cy - ((sideSeats - 1) / 2 - i) * (chairSize + 2)
    chairs.push({ x: cx + hw / 2 + chairGap + chairSize / 2, y: py, rot: 90 })
  }

  return (
    <g
      transform={`rotate(${obj.rotation}, ${cx}, ${cy})`}
      onPointerDown={e => onPointerDown(e, obj.id)}
      onDoubleClick={() => onDoubleClick(obj.id)}
      style={{ cursor: obj.locked ? "not-allowed" : "move" }}
    >
      {/* Selection ring */}
      {selected && (
        <rect
          x={obj.x - 8} y={obj.y - 8} width={w + 16} height={h + 16} rx={6}
          fill="none" stroke="#c9a84c" strokeWidth={1.5} strokeDasharray="5 3"
          opacity={0.8}
        />
      )}

      {/* Chairs */}
      {chairs.map((c, i) => (
        <rect
          key={i}
          x={c.x - chairSize / 2} y={c.y - chairSize / 2}
          width={chairSize} height={chairSize} rx={1.5}
          fill={fill} opacity={0.55}
          transform={`rotate(${c.rot}, ${c.x}, ${c.y})`}
        />
      ))}

      {/* Vertical bar */}
      <rect x={cx - vw / 2} y={cy - vh / 2} width={vw} height={vh} rx={3}
        fill={fill} opacity={0.92} />
      {/* Horizontal bar */}
      <rect x={cx - hw / 2} y={cy - hh / 2} width={hw} height={hh} rx={3}
        fill={fill} opacity={0.92} />

      {/* Label */}
      <text x={cx} y={cy + 4} textAnchor="middle"
        fill={obj.status === "free" ? "#1a1a2a" : "#fff"}
        fontSize={11} fontWeight="bold" fontFamily="'Bebas Neue', cursive"
        style={{ pointerEvents: "none", userSelect: "none" }}>
        {obj.label}
      </text>

      {/* Guest name tag */}
      {(obj.status === "occupied" || obj.status === "reserved") && obj.data_json?.guest && (
        <>
          <rect x={obj.x} y={obj.y + h + 4} width={w} height={13} rx={2}
            fill={obj.status === "occupied" ? "#156030" : "#7a5a18"} opacity={0.9} />
          <text x={cx} y={obj.y + h + 14} textAnchor="middle"
            fill="#fff" fontSize={8} fontWeight="bold"
            style={{ pointerEvents: "none", userSelect: "none" }}>
            {String(obj.data_json.guest)}
          </text>
        </>
      )}

      {/* Lock icon */}
      {obj.locked && (
        <text x={cx + 14} y={obj.y + 12} fill="#c9a84c" fontSize={9}
          style={{ pointerEvents: "none", userSelect: "none" }}>
          &#128274;
        </text>
      )}
    </g>
  )
}

// ─── Billiard Table Shape ──────────────────────────────────────────────────────

function BilliardShape({
  obj, selected, onPointerDown, onDoubleClick,
}: {
  obj: FloorObject
  selected: boolean
  onPointerDown: (e: React.PointerEvent, id: string) => void
  onDoubleClick: (id: string) => void
}) {
  const w = obj.width ?? BILLIARD_W
  const h = obj.height ?? BILLIARD_H
  const cx = obj.x + w / 2
  const cy = obj.y + h / 2
  const railC = obj.status === "reserved" ? "#c9a84c" : obj.status === "occupied" ? "#1db954" : "#5a5a5a"

  const pockets: [number, number][] = [
    [obj.x + 8, obj.y + 8], [cx, obj.y + 7], [obj.x + w - 8, obj.y + 8],
    [obj.x + 8, obj.y + h - 8], [cx, obj.y + h - 7], [obj.x + w - 8, obj.y + h - 8],
  ]

  return (
    <g
      transform={`rotate(${obj.rotation}, ${cx}, ${cy})`}
      onPointerDown={e => onPointerDown(e, obj.id)}
      onDoubleClick={() => onDoubleClick(obj.id)}
      style={{ cursor: obj.locked ? "not-allowed" : "move" }}
    >
      {selected && (
        <rect x={obj.x - 8} y={obj.y - 8} width={w + 16} height={h + 16} rx={6}
          fill="none" stroke="#c9a84c" strokeWidth={1.5} strokeDasharray="5 3" opacity={0.8} />
      )}

      {/* Rail outer */}
      <rect x={obj.x - 4} y={obj.y - 4} width={w + 8} height={h + 8} rx={5}
        fill="none" stroke={railC} strokeWidth={3} />

      {/* Felt */}
      <rect x={obj.x} y={obj.y} width={w} height={h} rx={3} fill="#1a6b2a" />

      {/* Center line */}
      <line x1={obj.x + 10} y1={cy} x2={obj.x + w - 10} y2={cy}
        stroke="rgba(255,255,255,0.13)" strokeWidth={1} />

      {/* Pockets */}
      {pockets.map(([px, py], i) => (
        <circle key={i} cx={px} cy={py} r={5} fill="#060606" />
      ))}

      {/* Balls */}
      <circle cx={cx - 14} cy={cy - 8} r={4.5} fill="#e03030" opacity={0.88} />
      <circle cx={cx}      cy={cy + 6} r={4.5} fill="#f0f0f0" opacity={0.88} />
      <circle cx={cx + 14} cy={cy - 8} r={4.5} fill="#e8a020" opacity={0.88} />

      {/* Label */}
      <text x={cx} y={obj.y - 8} textAnchor="middle"
        fill="#3a3a3a" fontSize={7} fontFamily="'Bebas Neue', cursive"
        style={{ pointerEvents: "none", userSelect: "none" }}>
        {obj.label}
      </text>

      {/* Guest name */}
      {obj.data_json?.guest && (
        <>
          <rect x={obj.x} y={obj.y + h + 5} width={w} height={13} rx={2}
            fill={obj.status === "reserved" ? "#7a5a18" : "#156030"} opacity={0.92} />
          <text x={cx} y={obj.y + h + 15} textAnchor="middle"
            fill="#fff" fontSize={8} fontWeight="bold"
            style={{ pointerEvents: "none", userSelect: "none" }}>
            {String(obj.data_json.guest)}
          </text>
        </>
      )}
    </g>
  )
}

// ─── Properties Panel ─────────────────────────────────────────────────────────

function PropertiesPanel({
  obj, onChange, onDelete, onDuplicate, onLockToggle, onClose,
}: {
  obj: FloorObject
  onChange: (id: string, patch: Partial<FloorObject>) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onLockToggle: (id: string) => void
  onClose: () => void
}) {
  const field = (
    label: string,
    value: string | number,
    key: keyof FloorObject,
    type: "text" | "number" | "range" = "text",
    min?: number, max?: number
  ) => (
    <div className="flex flex-col gap-1">
      <label style={{ color: "#6b6b6b", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        min={min} max={max}
        onChange={e => onChange(obj.id, {
          [key]: type === "number" || type === "range" ? Number(e.target.value) : e.target.value
        } as Partial<FloorObject>)}
        className="w-full px-2.5 py-1.5 rounded-md text-sm outline-none"
        style={{
          background: "#111118",
          border: "1px solid rgba(201,168,76,0.15)",
          color: "#f5f0e8",
          fontFamily: "var(--font-sans)",
        }}
      />
    </div>
  )

  const selectField = (
    label: string,
    value: string,
    key: keyof FloorObject,
    options: { value: string; label: string }[]
  ) => (
    <div className="flex flex-col gap-1">
      <label style={{ color: "#6b6b6b", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(obj.id, { [key]: e.target.value } as Partial<FloorObject>)}
        className="w-full px-2.5 py-1.5 rounded-md text-sm outline-none"
        style={{
          background: "#111118",
          border: "1px solid rgba(201,168,76,0.15)",
          color: "#f5f0e8",
          fontFamily: "var(--font-sans)",
        }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )

  return (
    <div
      className="absolute right-0 top-0 bottom-0 flex flex-col gap-0 overflow-y-auto"
      style={{
        width: 228,
        background: "#0e0e16",
        borderLeft: "1px solid rgba(201,168,76,0.1)",
        zIndex: 30,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <span style={{ color: "#c9a84c", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Eigenschaften
        </span>
        <button onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded"
          style={{ color: "#666", background: "rgba(255,255,255,0.04)" }}>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex flex-col gap-3 p-4 flex-1">
        {/* Type badge */}
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-xs font-bold"
            style={{ background: "rgba(201,168,76,0.1)", color: "#c9a84c" }}>
            {obj.type === "billiard" ? "Billard" : "Tisch"}
          </span>
          <span style={{ color: "#444", fontSize: 10 }}>{obj.id}</span>
        </div>

        {field("Bezeichnung", obj.label, "label")}
        {field("X Position", obj.x, "x", "number")}
        {field("Y Position", obj.y, "y", "number")}
        {field("Rotation", obj.rotation, "rotation", "range", 0, 359)}
        <div style={{ color: "#555", fontSize: 10, textAlign: "center" }}>
          {obj.rotation}°
        </div>

        {obj.type !== "billiard" && field("Sitzplätze", obj.seats, "seats", "number", 1, 20)}

        {field("Breite", obj.width ?? DEFAULT_TABLE_W, "width", "number", 20, 300)}
        {field("Höhe", obj.height ?? DEFAULT_TABLE_H, "height", "number", 20, 300)}

        {selectField("Status", obj.status, "status", [
          { value: "free",     label: "Frei" },
          { value: "reserved", label: "Reserviert" },
          { value: "occupied", label: "Belegt" },
          { value: "blocked",  label: "Gesperrt" },
        ])}

        {selectField("Bereich", obj.area_id, "area_id", AREAS.map(a => ({ value: a.id, label: a.label })))}

        {/* Color preview */}
        <div className="flex items-center gap-2 mt-1">
          <div className="w-8 h-8 rounded-md border border-white/10"
            style={{ background: STATUS_COLORS[obj.status] }} />
          <span style={{ color: "#555", fontSize: 11 }}>{STATUS_COLORS[obj.status]}</span>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 mt-2">
          <button
            onClick={() => onLockToggle(obj.id)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
            style={{
              background: obj.locked ? "rgba(201,168,76,0.1)" : "rgba(255,255,255,0.04)",
              color: obj.locked ? "#c9a84c" : "#888",
              border: `1px solid ${obj.locked ? "rgba(201,168,76,0.25)" : "rgba(255,255,255,0.06)"}`,
            }}
          >
            {obj.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            {obj.locked ? "Gesperrt" : "Sperren"}
          </button>

          <button
            onClick={() => onDuplicate(obj.id)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
            style={{
              background: "rgba(255,255,255,0.04)",
              color: "#888",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <Copy className="w-3.5 h-3.5" /> Duplizieren
          </button>

          <button
            onClick={() => onDelete(obj.id)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
            style={{
              background: "rgba(204,34,34,0.08)",
              color: "#cc5555",
              border: "1px solid rgba(204,34,34,0.18)",
            }}
          >
            <Trash2 className="w-3.5 h-3.5" /> Löschen
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────

function Toolbar({
  tool, setTool, snap, setSnap, showGrid, setShowGrid, zoom, setZoom,
  onAddTable, onAddBilliard, onSave, saving, hasUnsaved, onUndo, onRedo,
  canUndo, canRedo, selectedCount, onDeleteSelected, onAlignH, onAlignV,
}: {
  tool: string; setTool: (t: string) => void
  snap: boolean; setSnap: (v: boolean) => void
  showGrid: boolean; setShowGrid: (v: boolean) => void
  zoom: number; setZoom: (v: number) => void
  onAddTable: () => void; onAddBilliard: () => void
  onSave: () => void; saving: boolean; hasUnsaved: boolean
  onUndo: () => void; onRedo: () => void; canUndo: boolean; canRedo: boolean
  selectedCount: number; onDeleteSelected: () => void
  onAlignH: () => void; onAlignV: () => void
}) {
  const btn = (
    label: string, icon: React.ReactNode, onClick: () => void,
    active = false, color = "#888", danger = false
  ) => (
    <button
      onClick={onClick}
      title={label}
      className="flex items-center justify-center w-8 h-8 rounded-md transition-all"
      style={{
        background: active ? "rgba(201,168,76,0.15)" : danger ? "rgba(204,34,34,0.08)" : "rgba(255,255,255,0.04)",
        border: `1px solid ${active ? "rgba(201,168,76,0.3)" : danger ? "rgba(204,34,34,0.2)" : "rgba(255,255,255,0.06)"}`,
        color: active ? "#c9a84c" : danger ? "#cc5555" : color,
      }}
    >
      {icon}
    </button>
  )

  return (
    <div
      className="flex items-center gap-1.5 px-3 flex-shrink-0 flex-wrap"
      style={{
        height: 48,
        background: "#0e0e16",
        borderBottom: "1px solid rgba(201,168,76,0.08)",
        gap: 6,
      }}
    >
      {/* Tool mode */}
      <div className="flex items-center gap-1 mr-1">
        {btn("Auswahl", <MousePointer className="w-3.5 h-3.5" />, () => setTool("select"), tool === "select")}
        {btn("Verschieben", <Move className="w-3.5 h-3.5" />, () => setTool("move"), tool === "move")}
      </div>

      <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.07)" }} />

      {/* Add objects */}
      <div className="flex items-center gap-1">
        <button
          onClick={onAddTable}
          className="flex items-center gap-1.5 px-2.5 h-8 rounded-md text-xs font-bold transition-all"
          style={{
            background: "rgba(201,168,76,0.1)",
            border: "1px solid rgba(201,168,76,0.25)",
            color: "#c9a84c",
          }}
        >
          <Plus className="w-3.5 h-3.5" /> Tisch
        </button>
        <button
          onClick={onAddBilliard}
          className="flex items-center gap-1.5 px-2.5 h-8 rounded-md text-xs font-bold transition-all"
          style={{
            background: "rgba(26,107,42,0.15)",
            border: "1px solid rgba(26,107,42,0.35)",
            color: "#2a9d5c",
          }}
        >
          <Plus className="w-3.5 h-3.5" /> Billard
        </button>
      </div>

      <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.07)" }} />

      {/* Undo / Redo */}
      <div className="flex items-center gap-1">
        {btn("Rückgängig (Ctrl+Z)", <RotateCcw className="w-3.5 h-3.5" />, onUndo, false, canUndo ? "#888" : "#333")}
        {btn("Wiederholen (Ctrl+Y)", <RotateCcw className="w-3.5 h-3.5 scale-x-[-1]" />, onRedo, false, canRedo ? "#888" : "#333")}
      </div>

      <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.07)" }} />

      {/* Snap + Grid */}
      {btn("Am Raster ausrichten", <Grid className="w-3.5 h-3.5" />, () => setSnap(!snap), snap)}
      {btn("Raster anzeigen", <Layers className="w-3.5 h-3.5" />, () => setShowGrid(!showGrid), showGrid)}

      <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.07)" }} />

      {/* Alignment (only when multi-select) */}
      {selectedCount > 1 && (
        <>
          {btn("Horizontal ausrichten", <AlignLeft className="w-3.5 h-3.5" />, onAlignH)}
          {btn("Vertikal ausrichten", <AlignCenter className="w-3.5 h-3.5 rotate-90" />, onAlignV)}
          <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.07)" }} />
        </>
      )}

      {/* Delete selected */}
      {selectedCount > 0 && btn(
        `${selectedCount} löschen`, <Trash2 className="w-3.5 h-3.5" />, onDeleteSelected, false, "#cc5555", true
      )}

      {/* Zoom */}
      <div className="flex items-center gap-1 ml-auto">
        {btn("Verkleinern", <ZoomOut className="w-3.5 h-3.5" />, () => setZoom(Math.max(0.25, zoom - 0.1)))}
        <span style={{ color: "#555", fontSize: 10, width: 36, textAlign: "center" }}>
          {Math.round(zoom * 100)}%
        </span>
        {btn("Vergrößern", <ZoomIn className="w-3.5 h-3.5" />, () => setZoom(Math.min(3, zoom + 0.1)))}
        {btn("Zurücksetzen", <Maximize2 className="w-3.5 h-3.5" />, () => setZoom(1))}
      </div>

      {/* Save */}
      <button
        onClick={onSave}
        disabled={saving}
        className="flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-bold ml-1 transition-all"
        style={{
          background: hasUnsaved ? "#c9a84c" : "rgba(201,168,76,0.1)",
          border: "1px solid rgba(201,168,76,0.3)",
          color: hasUnsaved ? "#0a0a0a" : "#c9a84c",
          opacity: saving ? 0.6 : 1,
        }}
      >
        {saving ? (
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
        ) : (
          <Save className="w-3.5 h-3.5" />
        )}
        {saving ? "Speichert..." : "Speichern"}
        {hasUnsaved && !saving && <span className="w-1.5 h-1.5 rounded-full bg-red-400 ml-0.5" />}
      </button>
    </div>
  )
}

// ─── Area Selector (left panel) ───────────────────────────────────────────────

function AreaPanel({
  activeArea, onChange,
}: {
  activeArea: string; onChange: (id: string) => void
}) {
  return (
    <div
      className="flex flex-col flex-shrink-0"
      style={{
        width: 186,
        background: "#0c0c14",
        borderRight: "1px solid rgba(201,168,76,0.08)",
      }}
    >
      <div className="px-3 py-2.5 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <span style={{ color: "#c9a84c", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Bereiche
        </span>
      </div>
      <div className="flex flex-col flex-1 py-1">
        {AREAS.map((a, i) => {
          const active = activeArea === a.id
          return (
            <button
              key={a.id}
              onClick={() => onChange(a.id)}
              className="flex flex-col px-3 py-2.5 text-left transition-all"
              style={{
                background: active ? "rgba(201,168,76,0.08)" : "transparent",
                borderLeft: `2.5px solid ${active ? "#c9a84c" : "transparent"}`,
              }}
            >
              <span style={{ color: "#333", fontSize: 8 }}>{i + 1}.</span>
              <span style={{
                color: active ? "#c9a84c" : "#777",
                fontSize: 11,
                fontWeight: 600,
                lineHeight: 1.3,
              }}>
                {a.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Object palette */}
      <div className="px-3 pb-3 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <span style={{ color: "#444", fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Status
        </span>
        <div className="flex flex-col gap-1.5 mt-2">
          {(Object.entries(STATUS_COLORS) as [StatusType, string][]).map(([s, c]) => (
            <div key={s} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: c }} />
              <span style={{ color: "#555", fontSize: 10 }}>
                {s === "free" ? "Frei" : s === "reserved" ? "Reserviert" : s === "occupied" ? "Belegt" : "Gesperrt"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface Toast { id: string; type: "success" | "error" | "info"; text: string }

function ToastStack({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2" style={{ zIndex: 9999 }}>
      {toasts.map(t => (
        <div
          key={t.id}
          className="px-4 py-2.5 rounded-lg text-sm font-medium"
          style={{
            background: "#0e0e16",
            borderLeft: `3px solid ${t.type === "success" ? "#1db954" : t.type === "error" ? "#cc2222" : "#c9a84c"}`,
            border: "1px solid rgba(255,255,255,0.07)",
            borderLeftWidth: 3,
            color: "#f5f0e8",
            boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
            animation: "fadeSlideIn 0.2s ease",
          }}
        >
          {t.text}
        </div>
      ))}
    </div>
  )
}

// ─── Main Editor ──────────────────────────────────────────────────────────────

export default function FloorPlanEditor() {
  const supabase = createClient()
  const canvasRef = useRef<SVGSVGElement>(null)

  // State
  const [objects, setObjects] = useState<FloorObject[]>([])
  const [history, setHistory] = useState<FloorObject[][]>([])
  const [future, setFuture] = useState<FloorObject[][]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [activeArea, setActiveArea] = useState("restaurant140")
  const [tool, setTool] = useState("select")
  const [snap, setSnap] = useState(true)
  const [showGrid, setShowGrid] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [saving, setSaving] = useState(false)
  const [hasUnsaved, setHasUnsaved] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [loading, setLoading] = useState(true)

  // Drag state
  const dragRef = useRef<{
    id: string; startX: number; startY: number; origX: number; origY: number
  } | null>(null)
  const panRef = useRef<{ startX: number; startY: number; origPanX: number; origPanY: number } | null>(null)

  const visibleObjects = objects.filter(o => o.area_id === activeArea)

  // ── Toast helpers ──
  const addToast = useCallback((type: Toast["type"], text: string) => {
    const id = Date.now().toString()
    setToasts(p => [...p.slice(-2), { id, type, text }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000)
  }, [])

  // ── History ──
  const pushHistory = useCallback((prev: FloorObject[]) => {
    setHistory(h => [...h.slice(-49), prev])
    setFuture([])
  }, [])

  const undo = useCallback(() => {
    setHistory(h => {
      if (!h.length) return h
      const prev = h[h.length - 1]
      setFuture(f => [objects, ...f.slice(0, 49)])
      setObjects(prev)
      setHasUnsaved(true)
      return h.slice(0, -1)
    })
  }, [objects])

  const redo = useCallback(() => {
    setFuture(f => {
      if (!f.length) return f
      const next = f[0]
      setHistory(h => [...h, objects])
      setObjects(next)
      setHasUnsaved(true)
      return f.slice(1)
    })
  }, [objects])

  // ── Load ──
  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data, error } = await supabase.from("floor_objects").select("*")
      if (error) { addToast("error", "Fehler beim Laden"); }
      else {
        const mapped = (data ?? []).map((r: Record<string, unknown>) => ({
          id:        r.id as string,
          type:      r.type as ObjType,
          x:         Number(r.x),
          y:         Number(r.y),
          rotation:  Number(r.rotation ?? 0),
          seats:     Number(r.seats ?? 4),
          status:    r.status as StatusType,
          label:     r.label as string,
          area_id:   r.area_id as string,
          data_json: (r.data_json as Record<string, unknown>) ?? {},
          width:     r.type === "billiard" ? BILLIARD_W : DEFAULT_TABLE_W,
          height:    r.type === "billiard" ? BILLIARD_H : DEFAULT_TABLE_H,
          locked:    false,
        }))
        setObjects(mapped)
      }
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === "z" && (e.ctrlKey || e.metaKey) && !e.shiftKey) { e.preventDefault(); undo() }
      if ((e.key === "y" && (e.ctrlKey || e.metaKey)) || (e.key === "z" && e.ctrlKey && e.shiftKey)) { e.preventDefault(); redo() }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedIds.size > 0) deleteSelected()
      if (e.key === "Escape") setSelectedIds(new Set())
      if (e.key === "a" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); setSelectedIds(new Set(visibleObjects.map(o => o.id))) }
    }
    window.addEventListener("keydown", handle)
    return () => window.removeEventListener("keydown", handle)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [undo, redo, selectedIds, visibleObjects])

  // ── Save ──
  const save = async () => {
    setSaving(true)
    const toSave = objects.map(({ locked, width, height, ...rest }) => ({
      ...rest,
      updated_at: new Date().toISOString(),
    }))
    const { error } = await supabase.from("floor_objects").upsert(toSave, { onConflict: "id" })
    if (error) addToast("error", "Fehler beim Speichern")
    else { addToast("success", "Grundriss gespeichert"); setHasUnsaved(false) }
    setSaving(false)
  }

  // ── Mutation helpers ──
  const mutate = (fn: (prev: FloorObject[]) => FloorObject[]) => {
    setObjects(prev => {
      pushHistory(prev)
      const next = fn(prev)
      setHasUnsaved(true)
      return next
    })
  }

  const updateObj = (id: string, patch: Partial<FloorObject>) => {
    mutate(prev => prev.map(o => o.id === id ? { ...o, ...patch } : o))
  }

  const deleteSelected = () => {
    if (selectedIds.size === 0) return
    mutate(prev => prev.filter(o => !selectedIds.has(o.id)))
    setSelectedIds(new Set())
    addToast("info", `${selectedIds.size} Objekt(e) gelöscht`)
  }

  const deleteObj = (id: string) => {
    mutate(prev => prev.filter(o => o.id !== id))
    setSelectedIds(p => { p.delete(id); return new Set(p) })
  }

  const duplicateObj = (id: string) => {
    const obj = objects.find(o => o.id === id)
    if (!obj) return
    const clone: FloorObject = { ...obj, id: newId(), x: obj.x + 20, y: obj.y + 20 }
    mutate(prev => [...prev, clone])
    setSelectedIds(new Set([clone.id]))
    addToast("info", "Dupliziert")
  }

  const addTable = () => {
    const id = newId()
    const obj: FloorObject = {
      id, type: "table", x: snapToGrid(100 + Math.random() * 200, snap), y: snapToGrid(100 + Math.random() * 150, snap),
      rotation: 0, seats: 4, status: "free", label: String(Math.floor(Math.random() * 90 + 10)),
      area_id: activeArea, data_json: {}, width: DEFAULT_TABLE_W, height: DEFAULT_TABLE_H, locked: false,
    }
    mutate(prev => [...prev, obj])
    setSelectedIds(new Set([id]))
    addToast("info", "Tisch hinzugefügt")
  }

  const addBilliard = () => {
    const id = newId()
    const obj: FloorObject = {
      id, type: "billiard", x: snapToGrid(80 + Math.random() * 200, snap), y: snapToGrid(50 + Math.random() * 100, snap),
      rotation: 0, seats: 0, status: "free", label: `Billard ${objects.filter(o => o.type === "billiard").length + 1}`,
      area_id: activeArea, data_json: {}, width: BILLIARD_W, height: BILLIARD_H, locked: false,
    }
    mutate(prev => [...prev, obj])
    setSelectedIds(new Set([id]))
    addToast("info", "Billardtisch hinzugefügt")
  }

  const alignH = () => {
    if (selectedIds.size < 2) return
    const sel = objects.filter(o => selectedIds.has(o.id))
    const avgY = sel.reduce((s, o) => s + o.y, 0) / sel.length
    mutate(prev => prev.map(o => selectedIds.has(o.id) ? { ...o, y: snapToGrid(avgY, snap) } : o))
  }

  const alignV = () => {
    if (selectedIds.size < 2) return
    const sel = objects.filter(o => selectedIds.has(o.id))
    const avgX = sel.reduce((s, o) => s + o.x, 0) / sel.length
    mutate(prev => prev.map(o => selectedIds.has(o.id) ? { ...o, x: snapToGrid(avgX, snap) } : o))
  }

  // ── Drag / pointer handlers ──
  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation()
    const obj = objects.find(o => o.id === id)
    if (!obj || obj.locked) return

    if (e.shiftKey) {
      setSelectedIds(prev => {
        const next = new Set(prev)
        next.has(id) ? next.delete(id) : next.add(id)
        return next
      })
    } else {
      if (!selectedIds.has(id)) setSelectedIds(new Set([id]))
    }

    const svgRect = canvasRef.current!.getBoundingClientRect()
    dragRef.current = {
      id,
      startX: (e.clientX - svgRect.left) / zoom,
      startY: (e.clientY - svgRect.top) / zoom,
      origX: obj.x,
      origY: obj.y,
    }
    ;(e.target as Element).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (panRef.current) {
      const dx = e.clientX - panRef.current.startX
      const dy = e.clientY - panRef.current.startY
      setPan({ x: panRef.current.origPanX + dx, y: panRef.current.origPanY + dy })
      return
    }
    if (!dragRef.current) return
    const svgRect = canvasRef.current!.getBoundingClientRect()
    const curX = (e.clientX - svgRect.left) / zoom
    const curY = (e.clientY - svgRect.top) / zoom
    const dx = curX - dragRef.current.startX
    const dy = curY - dragRef.current.startY

    const newX = snapToGrid(dragRef.current.origX + dx, snap)
    const newY = snapToGrid(dragRef.current.origY + dy, snap)

    // Move all selected objects together
    const refObj = objects.find(o => o.id === dragRef.current!.id)
    if (!refObj) return
    const deltaX = newX - refObj.x
    const deltaY = newY - refObj.y

    setObjects(prev => prev.map(o =>
      selectedIds.has(o.id) && !o.locked
        ? { ...o, x: snapToGrid(o.x + deltaX, snap), y: snapToGrid(o.y + deltaY, snap) }
        : o
    ))
    setHasUnsaved(true)
  }

  const handlePointerUp = () => {
    if (dragRef.current) {
      dragRef.current = null
    }
    if (panRef.current) {
      panRef.current = null
    }
  }

  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    // Middle mouse or space+drag for pan
    if (e.button === 1 || tool === "move") {
      panRef.current = { startX: e.clientX, startY: e.clientY, origPanX: pan.x, origPanY: pan.y }
      ;(e.target as Element).setPointerCapture(e.pointerId)
      return
    }
    // Click on empty canvas = deselect
    setSelectedIds(new Set())
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.08 : 0.08
    setZoom(z => Math.max(0.25, Math.min(3, z + delta)))
  }

  // ── Grid pattern ──
  const gridPattern = showGrid ? (
    <defs>
      <pattern id="grid" width={GRID_SIZE * zoom} height={GRID_SIZE * zoom} patternUnits="userSpaceOnUse"
        x={pan.x % (GRID_SIZE * zoom)} y={pan.y % (GRID_SIZE * zoom)}>
        <path d={`M ${GRID_SIZE * zoom} 0 L 0 0 0 ${GRID_SIZE * zoom}`}
          fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={0.5} />
      </pattern>
    </defs>
  ) : null

  const selectedObj = selectedIds.size === 1
    ? objects.find(o => o.id === [...selectedIds][0])
    : undefined

  return (
    <div className="flex flex-col" style={{ height: "100vh", background: "#0a0a10", overflow: "hidden" }}>
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 flex-shrink-0"
        style={{
          height: 44,
          background: "#0c0c14",
          borderBottom: "1px solid rgba(201,168,76,0.1)",
        }}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-black"
            style={{ background: "#c9a84c", color: "#0a0a0a", fontFamily: "'Bebas Neue', cursive", fontSize: 14 }}>
            R
          </div>
          <span style={{ color: "#c9a84c", fontFamily: "'Bebas Neue', cursive", fontSize: 16, letterSpacing: "0.1em" }}>
            RONDO
          </span>
          <span style={{ color: "#333", fontSize: 10, marginLeft: 4 }}>/ Grundriss Editor</span>
        </div>

        <div style={{ flex: 1 }} />

        {hasUnsaved && (
          <span className="text-xs px-2 py-0.5 rounded"
            style={{ background: "rgba(204,34,34,0.1)", color: "#cc5555", border: "1px solid rgba(204,34,34,0.2)" }}>
            Ungespeicherte Änderungen
          </span>
        )}
        <span style={{ color: "#444", fontSize: 10 }}>
          {visibleObjects.length} Objekte
        </span>
        <a href="/raumplan" className="text-xs px-2.5 py-1 rounded transition-colors"
          style={{ color: "#666", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)" }}>
          Zur Ansicht
        </a>
      </div>

      {/* Toolbar */}
      <Toolbar
        tool={tool} setTool={setTool}
        snap={snap} setSnap={setSnap}
        showGrid={showGrid} setShowGrid={setShowGrid}
        zoom={zoom} setZoom={setZoom}
        onAddTable={addTable} onAddBilliard={addBilliard}
        onSave={save} saving={saving} hasUnsaved={hasUnsaved}
        onUndo={undo} onRedo={redo}
        canUndo={history.length > 0} canRedo={future.length > 0}
        selectedCount={selectedIds.size} onDeleteSelected={deleteSelected}
        onAlignH={alignH} onAlignV={alignV}
      />

      {/* Body */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left area panel */}
        <AreaPanel activeArea={activeArea} onChange={a => { setActiveArea(a); setSelectedIds(new Set()) }} />

        {/* Canvas */}
        <div className="relative flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                <span style={{ color: "#555", fontSize: 12 }}>Lade Grundriss...</span>
              </div>
            </div>
          ) : (
            <svg
              ref={canvasRef}
              className="w-full h-full"
              style={{
                background: "#141420",
                cursor: tool === "move" ? "grab" : "default",
              }}
              onPointerDown={handleCanvasPointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onWheel={handleWheel}
            >
              {gridPattern}
              {showGrid && <rect width="100%" height="100%" fill="url(#grid)" />}

              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                {/* Ambient glow */}
                <radialGradient id="editorGlow" cx="50%" cy="45%" r="40%">
                  <stop offset="0%" stopColor="rgba(255,140,30,0.06)" />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
                <rect width={860} height={560} fill="url(#editorGlow)" rx={4} />

                {/* Objects */}
                {visibleObjects.map(obj => {
                  const selected = selectedIds.has(obj.id)
                  if (obj.type === "billiard") {
                    return (
                      <BilliardShape
                        key={obj.id} obj={obj} selected={selected}
                        onPointerDown={handlePointerDown}
                        onDoubleClick={id => setSelectedIds(new Set([id]))}
                      />
                    )
                  }
                  return (
                    <TableShape
                      key={obj.id} obj={obj} selected={selected}
                      onPointerDown={handlePointerDown}
                      onDoubleClick={id => setSelectedIds(new Set([id]))}
                    />
                  )
                })}

                {/* Empty state */}
                {visibleObjects.length === 0 && (
                  <text x={430} y={280} textAnchor="middle"
                    fill="#2a2a3a" fontSize={13}
                    fontFamily="var(--font-sans)">
                    Klicke auf &quot;+ Tisch&quot; um Objekte hinzuzufügen
                  </text>
                )}
              </g>
            </svg>
          )}

          {/* Zoom indicator */}
          <div className="absolute bottom-3 left-3 px-2 py-1 rounded text-xs"
            style={{ background: "rgba(0,0,0,0.6)", color: "#555", border: "1px solid rgba(255,255,255,0.06)" }}>
            {Math.round(zoom * 100)}% · {visibleObjects.length} Objekte
          </div>
        </div>

        {/* Properties panel */}
        {selectedObj && (
          <div className="relative flex-shrink-0" style={{ width: 228 }}>
            <PropertiesPanel
              obj={selectedObj}
              onChange={updateObj}
              onDelete={deleteObj}
              onDuplicate={duplicateObj}
              onLockToggle={id => updateObj(id, { locked: !selectedObj.locked })}
              onClose={() => setSelectedIds(new Set())}
            />
          </div>
        )}
      </div>

      <ToastStack toasts={toasts} />

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
