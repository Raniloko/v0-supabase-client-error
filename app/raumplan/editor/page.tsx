"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Plus, Save, Trash2, RotateCcw, Grid, Lock, Unlock,
  ZoomIn, ZoomOut, Maximize2, Copy, Layers,
  AlignLeft, AlignCenter, Move, MousePointer, X,
} from "lucide-react"
import { RoomGeometry, AREA_TABLE_DEFS, AREA_CANVAS } from "@/lib/floor-geometry"

// ─── Types ────────────────────────────────────────────────────────────────────

type ObjType    = "table" | "billiard"
type StatusType = "free" | "reserved" | "occupied" | "blocked"

interface FloorObject {
  id:        string
  type:      ObjType
  x:         number
  y:         number
  rotation:  number
  seats:     number
  status:    StatusType
  label:     string
  area_id:   string
  data_json: Record<string, unknown>
  width?:    number
  height?:   number
  locked?:   boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const AREAS = [
  { id: "billard",       label: "Billard Tisch",          num: "1." },
  { id: "salitos",       label: "Salitos Lounge / Outdoor",num: "2." },
  { id: "restaurant140", label: "Restaurant 140 Zoll",    num: "3." },
  { id: "restaurant75",  label: "Restaurant 75 Zoll / Sport", num: "4." },
  { id: "vip",           label: "VIP Raum / Sport",       num: "5." },
]

const STATUS_COLORS: Record<StatusType, string> = {
  free:     "#b8b8c8",
  reserved: "#c9a84c",
  occupied: "#1db954",
  blocked:  "#cc2222",
}

const DEFAULT_W  = 58   // must match floor-geometry hw+6
const DEFAULT_H  = 54   // must match floor-geometry vh+6
const BILLIARD_W = 220  // must match floor-geometry billiard w
const BILLIARD_H = 136  // must match floor-geometry billiard h
const GRID_SZ    = 10

// ─── Per-Area Default Layouts ─────────────────────────────────────────────────
// Derived from the shared AREA_TABLE_DEFS so editor and dashboard always match.

function defsToFloorObjects(areaId: string): FloorObject[] {
  const defs = AREA_TABLE_DEFS[areaId] ?? []
  return defs.map(d => ({
    id:        d.id,
    type:      d.type,
    x:         d.x,
    y:         d.y,
    rotation:  d.rotation,
    seats:     d.seats,
    status:    "free" as StatusType,
    label:     d.label,
    area_id:   areaId,
    data_json: {},
    width:     d.w,
    height:    d.h,
    locked:    false,
  }))
}

const DEFAULT_LAYOUTS: Record<string, FloorObject[]> = {
  billard:       defsToFloorObjects("billard"),
  salitos:       defsToFloorObjects("salitos"),
  restaurant140: defsToFloorObjects("restaurant140"),
  restaurant75:  defsToFloorObjects("restaurant75"),
  vip:           defsToFloorObjects("vip"),
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function snap(v: number, on: boolean) { return on ? Math.round(v / GRID_SZ) * GRID_SZ : v }
function uid()  { return `o${Date.now()}_${Math.random().toString(36).slice(2, 6)}` }

// ─── Table Shape (SVG cross) ──────────────────────────────────────────────────

function TableShape({ obj, selected, onPointerDown, onDoubleTap }: {
  obj: FloorObject
  selected: boolean
  onPointerDown: (e: React.PointerEvent, id: string) => void
  onDoubleTap: (id: string) => void
}) {
  const w  = obj.width  ?? DEFAULT_W
  const h  = obj.height ?? DEFAULT_H
  const cx = obj.x + w / 2
  const cy = obj.y + h / 2
  const fc = STATUS_COLORS[obj.status]

  const vw = Math.round(w * 0.32), vh = Math.round(h * 0.82)
  const hw = Math.round(w * 0.82), hh = Math.round(h * 0.32)
  const cs = 8  // chair size
  const cg = 4  // chair gap

  const seats = obj.seats || 4
  const top   = Math.max(1, Math.round(seats / 4))
  const side  = Math.max(1, Math.round(seats / 4))

  // Larger invisible hit area for touch
  const hitPad = 10

  return (
    <g
      transform={`rotate(${obj.rotation}, ${cx}, ${cy})`}
      onPointerDown={e => onPointerDown(e, obj.id)}
      onDoubleClick={() => onDoubleTap(obj.id)}
      style={{ cursor: obj.locked ? "not-allowed" : "move", touchAction: "none" }}
    >
      {/* Touch-friendly transparent hit area */}
      <rect
        x={obj.x - hitPad} y={obj.y - hitPad}
        width={w + hitPad * 2} height={h + hitPad * 2}
        fill="transparent" stroke="none"
      />

      {selected && (
        <rect x={obj.x - 8} y={obj.y - 8} width={w + 16} height={h + 16} rx={7}
          fill="none" stroke="#c9a84c" strokeWidth={2} strokeDasharray="5 3" opacity={0.85} />
      )}

      {/* Top chairs */}
      {Array.from({ length: top }).map((_, i) => {
        const ox = cx - ((top - 1) / 2 - i) * (cs + 2)
        return <rect key={`t${i}`} x={ox - cs / 2} y={cy - vh / 2 - cg - cs} width={cs} height={cs} rx={2} fill={fc} opacity={0.55} />
      })}
      {/* Bottom chairs */}
      {Array.from({ length: top }).map((_, i) => {
        const ox = cx - ((top - 1) / 2 - i) * (cs + 2)
        return <rect key={`b${i}`} x={ox - cs / 2} y={cy + vh / 2 + cg} width={cs} height={cs} rx={2} fill={fc} opacity={0.55} />
      })}
      {/* Left chairs */}
      {Array.from({ length: side }).map((_, i) => {
        const oy = cy - ((side - 1) / 2 - i) * (cs + 2)
        return <rect key={`l${i}`} x={cx - hw / 2 - cg - cs} y={oy - cs / 2} width={cs} height={cs} rx={2} fill={fc} opacity={0.55} />
      })}
      {/* Right chairs */}
      {Array.from({ length: side }).map((_, i) => {
        const oy = cy - ((side - 1) / 2 - i) * (cs + 2)
        return <rect key={`r${i}`} x={cx + hw / 2 + cg} y={oy - cs / 2} width={cs} height={cs} rx={2} fill={fc} opacity={0.55} />
      })}

      {/* Vertical bar */}
      <rect x={cx - vw / 2} y={cy - vh / 2} width={vw} height={vh} rx={4} fill={fc} />
      {/* Horizontal bar */}
      <rect x={cx - hw / 2} y={cy - hh / 2} width={hw} height={hh} rx={4} fill={fc} />

      {/* Label */}
      <text x={cx} y={cy + 4} textAnchor="middle"
        fill={obj.status === "free" ? "#1a1a2a" : "#fff"}
        fontSize={12} fontWeight="bold" fontFamily="'Bebas Neue', cursive"
        style={{ pointerEvents: "none", userSelect: "none" }}>
        {obj.label}
      </text>

      {/* Seat count badge */}
      <text x={obj.x + 4} y={obj.y + 11} fill="rgba(0,0,0,0.45)" fontSize={8}
        style={{ pointerEvents: "none", userSelect: "none" }}>
        {obj.seats}
      </text>

      {/* Lock */}
      {obj.locked && (
        <text x={cx + 14} y={obj.y + 12} fill="#c9a84c" fontSize={9}
          style={{ pointerEvents: "none", userSelect: "none" }}>&#128274;</text>
      )}
    </g>
  )
}

// ─── Billiard Shape ───────────────────────────────────────────────────────────

function BilliardShape({ obj, selected, onPointerDown, onDoubleTap }: {
  obj: FloorObject
  selected: boolean
  onPointerDown: (e: React.PointerEvent, id: string) => void
  onDoubleTap: (id: string) => void
}) {
  const w  = obj.width  ?? BILLIARD_W
  const h  = obj.height ?? BILLIARD_H
  const cx = obj.x + w / 2
  const cy = obj.y + h / 2
  const railC = obj.status === "reserved" ? "#c9a84c" : obj.status === "occupied" ? "#1db954" : "#5a5a5a"
  const hitPad = 10

  const pockets: [number, number][] = [
    [obj.x + 8, obj.y + 8],    [cx, obj.y + 7],    [obj.x + w - 8, obj.y + 8],
    [obj.x + 8, obj.y + h - 8],[cx, obj.y + h - 7],[obj.x + w - 8, obj.y + h - 8],
  ]

  return (
    <g
      transform={`rotate(${obj.rotation}, ${cx}, ${cy})`}
      onPointerDown={e => onPointerDown(e, obj.id)}
      onDoubleClick={() => onDoubleTap(obj.id)}
      style={{ cursor: obj.locked ? "not-allowed" : "move", touchAction: "none" }}
    >
      {/* Hit area */}
      <rect x={obj.x - hitPad} y={obj.y - hitPad}
        width={w + hitPad * 2} height={h + hitPad * 2}
        fill="transparent" stroke="none" />

      {selected && (
        <rect x={obj.x - 10} y={obj.y - 10} width={w + 20} height={h + 20} rx={8}
          fill="none" stroke="#c9a84c" strokeWidth={2} strokeDasharray="6 3" opacity={0.85} />
      )}

      {/* Outer rail */}
      <rect x={obj.x - 4} y={obj.y - 4} width={w + 8} height={h + 8} rx={6}
        fill="none" stroke={railC} strokeWidth={3.5} />

      {/* Felt */}
      <rect x={obj.x} y={obj.y} width={w} height={h} rx={4} fill="#1a6b2a" />

      {/* Center line */}
      <line x1={obj.x + 12} y1={cy} x2={obj.x + w - 12} y2={cy}
        stroke="rgba(255,255,255,0.14)" strokeWidth={1} />

      {/* Pockets */}
      {pockets.map(([px, py], i) => (
        <circle key={i} cx={px} cy={py} r={5} fill="#040404" />
      ))}

      {/* Balls */}
      <circle cx={cx - 14} cy={cy - 7} r={4.5} fill="#e03030" opacity={0.88} />
      <circle cx={cx}      cy={cy + 6} r={4.5} fill="#f0f0f0" opacity={0.88} />
      <circle cx={cx + 14} cy={cy - 7} r={4.5} fill="#e8a020" opacity={0.88} />

      {/* Label */}
      <text x={cx} y={obj.y - 9} textAnchor="middle"
        fill="#3a3a3a" fontSize={8} fontFamily="'Bebas Neue', cursive"
        style={{ pointerEvents: "none", userSelect: "none" }}>
        {obj.label}
      </text>

      {obj.locked && (
        <text x={cx + 16} y={obj.y + 12} fill="#c9a84c" fontSize={9}
          style={{ pointerEvents: "none", userSelect: "none" }}>&#128274;</text>
      )}
    </g>
  )
}

// ─── Properties Panel (touch-friendly slide-up / side panel) ─────────────────

function PropsPanel({ obj, onChange, onDelete, onDuplicate, onLockToggle, onClose }: {
  obj: FloorObject
  onChange: (id: string, patch: Partial<FloorObject>) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onLockToggle: (id: string) => void
  onClose: () => void
}) {
  const F = (lbl: string, val: string | number, k: keyof FloorObject, type: "text" | "number" = "text") => (
    <div className="flex flex-col gap-1">
      <label style={{ color: "#666", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>{lbl}</label>
      <input
        type={type}
        value={val}
        onChange={e => onChange(obj.id, { [k]: type === "number" ? Number(e.target.value) : e.target.value } as Partial<FloorObject>)}
        style={{
          width: "100%", padding: "10px 12px", borderRadius: 8, fontSize: 14,
          background: "#111118", border: "1px solid rgba(201,168,76,0.18)",
          color: "#f5f0e8", outline: "none",
          // Larger touch target
          minHeight: 44,
        }}
      />
    </div>
  )

  return (
    <div
      style={{
        position: "absolute", right: 0, top: 0, bottom: 0, width: 260,
        background: "#0e0e16",
        borderLeft: "1px solid rgba(201,168,76,0.12)",
        zIndex: 40, display: "flex", flexDirection: "column",
        overflowY: "auto", overscrollBehavior: "contain",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)",
        flexShrink: 0,
      }}>
        <span style={{ color: "#c9a84c", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Eigenschaften
        </span>
        <button
          onClick={onClose}
          style={{
            width: 44, height: 44, display: "flex", alignItems: "center",
            justifyContent: "center", borderRadius: 8, background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.08)", color: "#666", cursor: "pointer",
          }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 16, flex: 1 }}>
        {/* Type badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            padding: "3px 8px", borderRadius: 5, fontSize: 11, fontWeight: 700,
            background: "rgba(201,168,76,0.1)", color: "#c9a84c",
          }}>
            {obj.type === "billiard" ? "Billard" : "Tisch"}
          </span>
        </div>

        {F("Bezeichnung", obj.label, "label")}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {F("X", obj.x, "x", "number")}
          {F("Y", obj.y, "y", "number")}
          {F("Breite", obj.width ?? DEFAULT_W, "width", "number")}
          {F("Hoehe", obj.height ?? DEFAULT_H, "height", "number")}
        </div>

        {/* Rotation */}
        <div className="flex flex-col gap-2">
          <label style={{ color: "#666", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Rotation: {obj.rotation}°
          </label>
          <input type="range" min={0} max={359} value={obj.rotation}
            onChange={e => onChange(obj.id, { rotation: Number(e.target.value) })}
            style={{ width: "100%", accentColor: "#c9a84c", height: 8 }} />
        </div>

        {/* Seats */}
        {obj.type !== "billiard" && (
          <div className="flex flex-col gap-2">
            <label style={{ color: "#666", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Sitzplaetze: {obj.seats}
            </label>
            <input type="range" min={1} max={20} value={obj.seats}
              onChange={e => onChange(obj.id, { seats: Number(e.target.value) })}
              style={{ width: "100%", accentColor: "#c9a84c", height: 8 }} />
          </div>
        )}

        {/* Status */}
        <div className="flex flex-col gap-1">
          <label style={{ color: "#666", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Status</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {(["free", "reserved", "occupied", "blocked"] as StatusType[]).map(st => (
              <button key={st} onClick={() => onChange(obj.id, { status: st })}
                style={{
                  padding: "10px 8px", borderRadius: 8, fontSize: 11, fontWeight: 700,
                  cursor: "pointer", minHeight: 44,
                  background: obj.status === st ? STATUS_COLORS[st] : "rgba(255,255,255,0.04)",
                  border: `1px solid ${obj.status === st ? STATUS_COLORS[st] : "rgba(255,255,255,0.08)"}`,
                  color: obj.status === st ? (st === "free" ? "#1a1a2a" : "#fff") : "#666",
                }}>
                {st === "free" ? "Frei" : st === "reserved" ? "Reserviert" : st === "occupied" ? "Belegt" : "Gesperrt"}
              </button>
            ))}
          </div>
        </div>

        {/* Area */}
        <div className="flex flex-col gap-1">
          <label style={{ color: "#666", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Bereich</label>
          <select
            value={obj.area_id}
            onChange={e => onChange(obj.id, { area_id: e.target.value })}
            style={{
              width: "100%", padding: "10px 12px", borderRadius: 8, fontSize: 13, minHeight: 44,
              background: "#111118", border: "1px solid rgba(201,168,76,0.18)", color: "#f5f0e8",
            }}
          >
            {AREAS.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
          <button onClick={() => onLockToggle(obj.id)}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "12px 16px",
              borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", minHeight: 48,
              background: obj.locked ? "rgba(201,168,76,0.12)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${obj.locked ? "rgba(201,168,76,0.3)" : "rgba(255,255,255,0.08)"}`,
              color: obj.locked ? "#c9a84c" : "#888",
            }}>
            {obj.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            {obj.locked ? "Entsperren" : "Sperren"}
          </button>

          <button onClick={() => onDuplicate(obj.id)}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "12px 16px",
              borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", minHeight: 48,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#888",
            }}>
            <Copy className="w-4 h-4" /> Duplizieren
          </button>

          <button onClick={() => onDelete(obj.id)}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "12px 16px",
              borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", minHeight: 48,
              background: "rgba(204,34,34,0.08)", border: "1px solid rgba(204,34,34,0.2)", color: "#cc5555",
            }}>
            <Trash2 className="w-4 h-4" /> Loeschen
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────

function Toolbar({
  tool, setTool, snapOn, setSnapOn, showGrid, setShowGrid, zoom, setZoom,
  onAddTable, onAddBilliard, onSave, saving, hasUnsaved,
  onUndo, onRedo, canUndo, canRedo, selCount, onDeleteSel, onAlignH, onAlignV,
}: {
  tool: string; setTool: (t: string) => void
  snapOn: boolean; setSnapOn: (v: boolean) => void
  showGrid: boolean; setShowGrid: (v: boolean) => void
  zoom: number; setZoom: (v: number) => void
  onAddTable: () => void; onAddBilliard: () => void
  onSave: () => void; saving: boolean; hasUnsaved: boolean
  onUndo: () => void; onRedo: () => void; canUndo: boolean; canRedo: boolean
  selCount: number; onDeleteSel: () => void
  onAlignH: () => void; onAlignV: () => void
}) {
  const Btn = ({ title, icon, onClick, active = false, danger = false }: {
    title: string; icon: React.ReactNode; onClick: () => void; active?: boolean; danger?: boolean
  }) => (
    <button onClick={onClick} title={title}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 44, height: 44, borderRadius: 8, cursor: "pointer",
        background: active ? "rgba(201,168,76,0.15)" : danger ? "rgba(204,34,34,0.08)" : "rgba(255,255,255,0.04)",
        border: `1px solid ${active ? "rgba(201,168,76,0.3)" : danger ? "rgba(204,34,34,0.2)" : "rgba(255,255,255,0.06)"}`,
        color: active ? "#c9a84c" : danger ? "#cc5555" : "#777",
        flexShrink: 0,
      }}>
      {icon}
    </button>
  )

  const Sep = () => (
    <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.06)", flexShrink: 0, margin: "0 2px" }} />
  )

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 4, padding: "0 12px",
      height: 56, background: "#0e0e16",
      borderBottom: "1px solid rgba(201,168,76,0.08)",
      overflowX: "auto", flexShrink: 0,
      scrollbarWidth: "none",
      WebkitOverflowScrolling: "touch",
    }}>
      {/* Tool mode */}
      <Btn title="Auswahl" icon={<MousePointer className="w-4 h-4" />} onClick={() => setTool("select")} active={tool === "select"} />
      <Btn title="Verschieben" icon={<Move className="w-4 h-4" />} onClick={() => setTool("move")} active={tool === "move"} />

      <Sep />

      {/* Add */}
      <button onClick={onAddTable}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "0 14px", height: 44, borderRadius: 8, fontSize: 13, fontWeight: 700,
          background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)",
          color: "#c9a84c", cursor: "pointer", flexShrink: 0,
        }}>
        <Plus className="w-4 h-4" /> Tisch
      </button>
      <button onClick={onAddBilliard}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "0 14px", height: 44, borderRadius: 8, fontSize: 13, fontWeight: 700,
          background: "rgba(26,107,42,0.15)", border: "1px solid rgba(26,107,42,0.35)",
          color: "#2a9d5c", cursor: "pointer", flexShrink: 0,
        }}>
        <Plus className="w-4 h-4" /> Billard
      </button>

      <Sep />

      {/* Undo/Redo */}
      <Btn title="Rueckgaengig" icon={<RotateCcw className="w-4 h-4" />} onClick={onUndo} active={false} />
      <Btn title="Wiederholen" icon={<RotateCcw className="w-4 h-4 scale-x-[-1]" />} onClick={onRedo} active={false} />

      <Sep />

      {/* Grid / Snap */}
      <Btn title="Raster" icon={<Grid className="w-4 h-4" />} onClick={() => setShowGrid(!showGrid)} active={showGrid} />
      <Btn title="Einrasten" icon={<Layers className="w-4 h-4" />} onClick={() => setSnapOn(!snapOn)} active={snapOn} />

      {/* Align (multi-select only) */}
      {selCount > 1 && (
        <>
          <Sep />
          <Btn title="Horizontal ausrichten" icon={<AlignLeft className="w-4 h-4" />} onClick={onAlignH} />
          <Btn title="Vertikal ausrichten" icon={<AlignCenter className="w-4 h-4 rotate-90" />} onClick={onAlignV} />
        </>
      )}

      {/* Delete selected */}
      {selCount > 0 && (
        <>
          <Sep />
          <Btn title={`${selCount} loeschen`} icon={<Trash2 className="w-4 h-4" />} onClick={onDeleteSel} danger />
        </>
      )}

      {/* Zoom */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: "auto", flexShrink: 0 }}>
        <Btn title="Verkleinern" icon={<ZoomOut className="w-4 h-4" />} onClick={() => setZoom(Math.max(0.25, zoom - 0.1))} />
        <span style={{ color: "#555", fontSize: 11, width: 40, textAlign: "center", flexShrink: 0 }}>
          {Math.round(zoom * 100)}%
        </span>
        <Btn title="Vergroessern" icon={<ZoomIn className="w-4 h-4" />} onClick={() => setZoom(Math.min(3, zoom + 0.1))} />
        <Btn title="Zuruecksetzen" icon={<Maximize2 className="w-4 h-4" />} onClick={() => setZoom(1)} />
      </div>

      {/* Save */}
      <button onClick={onSave} disabled={saving}
        style={{
          display: "flex", alignItems: "center", gap: 6, padding: "0 16px",
          height: 44, borderRadius: 8, fontSize: 13, fontWeight: 700,
          background: hasUnsaved ? "#c9a84c" : "rgba(201,168,76,0.1)",
          border: "1px solid rgba(201,168,76,0.3)",
          color: hasUnsaved ? "#0a0a0a" : "#c9a84c",
          cursor: saving ? "default" : "pointer", opacity: saving ? 0.7 : 1, flexShrink: 0,
        }}>
        {saving
          ? <span style={{ width: 16, height: 16, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.6s linear infinite" }} />
          : <Save className="w-4 h-4" />
        }
        {saving ? "Speichert..." : "Speichern"}
      </button>
    </div>
  )
}

// ─── Area Selector ────────────────────────────────────────────────────────────

function AreaSelector({ active, onChange }: { active: string; onChange: (id: string) => void }) {
  return (
    <div style={{
      width: 200, background: "#0c0c14",
      borderRight: "1px solid rgba(201,168,76,0.08)",
      display: "flex", flexDirection: "column",
      overflowY: "auto", overscrollBehavior: "contain",
      WebkitOverflowScrolling: "touch",
    }}>
      <div style={{ padding: "12px 14px 8px", flexShrink: 0 }}>
        <span style={{ color: "#c9a84c", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Bereiche
        </span>
      </div>
      {AREAS.map(a => {
        const isActive = active === a.id
        return (
          <button key={a.id} onClick={() => onChange(a.id)}
            style={{
              display: "flex", flexDirection: "column", padding: "14px 14px",
              borderLeft: `3px solid ${isActive ? "#c9a84c" : "transparent"}`,
              background: isActive ? "rgba(201,168,76,0.07)" : "transparent",
              cursor: "pointer", textAlign: "left", minHeight: 54, border: "none",
              borderLeft: `3px solid ${isActive ? "#c9a84c" : "transparent"}`,
            }}>
            <span style={{ color: "#444", fontSize: 9 }}>{a.num}</span>
            <span style={{ color: isActive ? "#c9a84c" : "#777", fontSize: 12, fontWeight: 600, lineHeight: 1.3 }}>
              {a.label}
            </span>
          </button>
        )
      })}

      {/* Legend */}
      <div style={{ marginTop: "auto", padding: "12px 14px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <span style={{ color: "#444", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em" }}>Status</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
          {(Object.entries(STATUS_COLORS) as [StatusType, string][]).map(([st, c]) => (
            <div key={st} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: c, flexShrink: 0 }} />
              <span style={{ color: "#555", fontSize: 10 }}>
                {st === "free" ? "Frei" : st === "reserved" ? "Reserviert" : st === "occupied" ? "Belegt" : "Gesperrt"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Toast ─────────────────────────────���──────────────────────────────────────

interface Toast { id: string; type: "success" | "error" | "info"; text: string }

function ToastStack({ toasts }: { toasts: Toast[] }) {
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, display: "flex", flexDirection: "column", gap: 8, zIndex: 9999 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          padding: "12px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600,
          background: "#0e0e16",
          borderLeft: `3px solid ${t.type === "success" ? "#1db954" : t.type === "error" ? "#cc2222" : "#c9a84c"}`,
          border: "1px solid rgba(255,255,255,0.07)",
          borderLeftWidth: 3,
          color: "#f5f0e8",
          boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
        }}>
          {t.text}
        </div>
      ))}
    </div>
  )
}

// ─── Core Editor (shared between standalone page and embedded modal) ───────────

export function EmbeddedEditor({ initialArea = "restaurant140" }: { initialArea?: string }) {
  const supabase   = createClient()
  const canvasRef  = useRef<SVGSVGElement>(null)

  const [objects,     setObjects]     = useState<FloorObject[]>([])
  const [history,     setHistory]     = useState<FloorObject[][]>([])
  const [future,      setFuture]      = useState<FloorObject[][]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [activeArea,  setActiveArea]  = useState(initialArea)
  const [tool,        setTool]        = useState("select")
  const [snapOn,      setSnapOn]      = useState(true)
  const [showGrid,    setShowGrid]    = useState(true)
  const [zoom,        setZoom]        = useState(1)
  const [pan,         setPan]         = useState({ x: 20, y: 20 })
  const [saving,      setSaving]      = useState(false)
  const [hasUnsaved,  setHasUnsaved]  = useState(false)
  const [toasts,      setToasts]      = useState<Toast[]>([])
  const [loading,     setLoading]     = useState(true)

  // Drag / pan refs
  const dragRef = useRef<{ id: string; startX: number; startY: number; origPositions: Record<string, { x: number; y: number }> } | null>(null)
  const panRef  = useRef<{ startX: number; startY: number; origPan: { x: number; y: number } } | null>(null)
  // Pinch-to-zoom
  const pinchRef = useRef<{ dist: number; origZoom: number } | null>(null)

  const visible = objects.filter(o => o.area_id === activeArea)

  // ── Toast ──
  const toast = useCallback((type: Toast["type"], text: string) => {
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

  // ── Load from Supabase, fall back to default layouts ──
  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data, error } = await supabase.from("floor_objects").select("*")
      if (error) {
        toast("error", "Daten konnten nicht geladen werden – Standardlayout wird verwendet")
        // Seed all default layouts
        const allDefaults = Object.values(DEFAULT_LAYOUTS).flat()
        setObjects(allDefaults)
      } else if (!data || data.length === 0) {
        // Nothing in DB yet – use defaults
        const allDefaults = Object.values(DEFAULT_LAYOUTS).flat()
        setObjects(allDefaults)
      } else {
        const mapped = (data as Record<string, unknown>[]).map(r => ({
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
          width:     r.type === "billiard" ? BILLIARD_W : (r.width ? Number(r.width) : DEFAULT_W),
          height:    r.type === "billiard" ? BILLIARD_H : (r.height ? Number(r.height) : DEFAULT_H),
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
      if ((e.key === "z" && (e.ctrlKey || e.metaKey) && !e.shiftKey)) { e.preventDefault(); undo() }
      if ((e.key === "y" && (e.ctrlKey || e.metaKey)) || (e.key === "z" && e.ctrlKey && e.shiftKey)) { e.preventDefault(); redo() }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedIds.size > 0) deleteSelected()
      if (e.key === "Escape") setSelectedIds(new Set())
      if (e.key === "a" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); setSelectedIds(new Set(visible.map(o => o.id))) }
    }
    window.addEventListener("keydown", handle)
    return () => window.removeEventListener("keydown", handle)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [undo, redo, selectedIds, visible])

  // ── Save ──
  const save = async () => {
    setSaving(true)
    const payload = objects.map(({ locked, width, height, ...rest }) => ({
      ...rest,
      updated_at: new Date().toISOString(),
    }))
    const { error } = await supabase.from("floor_objects").upsert(payload, { onConflict: "id" })
    if (error) toast("error", "Fehler beim Speichern")
    else { toast("success", "Grundriss gespeichert"); setHasUnsaved(false) }
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

  const updateObj = (id: string, patch: Partial<FloorObject>) =>
    mutate(prev => prev.map(o => o.id === id ? { ...o, ...patch } : o))

  const deleteSelected = () => {
    if (!selectedIds.size) return
    mutate(prev => prev.filter(o => !selectedIds.has(o.id)))
    setSelectedIds(new Set())
    toast("info", `${selectedIds.size} Objekt(e) geloescht`)
  }

  const deleteObj = (id: string) => {
    mutate(prev => prev.filter(o => o.id !== id))
    setSelectedIds(p => { const n = new Set(p); n.delete(id); return n })
  }

  const duplicateObj = (id: string) => {
    const obj = objects.find(o => o.id === id)
    if (!obj) return
    const clone: FloorObject = { ...obj, id: uid(), x: obj.x + 20, y: obj.y + 20 }
    mutate(prev => [...prev, clone])
    setSelectedIds(new Set([clone.id]))
    toast("info", "Dupliziert")
  }

  const addTable = () => {
    const id = uid()
    mutate(prev => [...prev, {
      id, type: "table", x: snap(100 + Math.random() * 200, snapOn), y: snap(80 + Math.random() * 150, snapOn),
      rotation: 0, seats: 4, status: "free", label: String(Math.floor(Math.random() * 90 + 10)),
      area_id: activeArea, data_json: {}, width: DEFAULT_W, height: DEFAULT_H, locked: false,
    }])
    setSelectedIds(new Set([id]))
    toast("info", "Tisch hinzugefuegt")
  }

  const addBilliard = () => {
    const id = uid()
    mutate(prev => [...prev, {
      id, type: "billiard", x: snap(80 + Math.random() * 200, snapOn), y: snap(50 + Math.random() * 100, snapOn),
      rotation: 0, seats: 0, status: "free",
      label: `Billard ${objects.filter(o => o.type === "billiard").length + 1}`,
      area_id: activeArea, data_json: {}, width: BILLIARD_W, height: BILLIARD_H, locked: false,
    }])
    setSelectedIds(new Set([id]))
    toast("info", "Billardtisch hinzugefuegt")
  }

  const alignH = () => {
    if (selectedIds.size < 2) return
    const sel = objects.filter(o => selectedIds.has(o.id))
    const avgY = sel.reduce((s, o) => s + o.y, 0) / sel.length
    mutate(prev => prev.map(o => selectedIds.has(o.id) ? { ...o, y: snap(avgY, snapOn) } : o))
  }

  const alignV = () => {
    if (selectedIds.size < 2) return
    const sel = objects.filter(o => selectedIds.has(o.id))
    const avgX = sel.reduce((s, o) => s + o.x, 0) / sel.length
    mutate(prev => prev.map(o => selectedIds.has(o.id) ? { ...o, x: snap(avgX, snapOn) } : o))
  }

  // ── getSVGPoint: converts clientX/Y to SVG canvas coords (accounts for pan+zoom) ──
  const svgPoint = useCallback((clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top  - pan.y) / zoom,
    }
  }, [pan, zoom])

  // ── Pointer / Touch handlers ──
  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation()
    const obj = objects.find(o => o.id === id)
    if (!obj || obj.locked) return

    // Compute the NEW selection BEFORE setting state, so origPositions is correct
    let nextSelection: Set<string>
    if (e.shiftKey) {
      nextSelection = new Set(selectedIds)
      nextSelection.has(id) ? nextSelection.delete(id) : nextSelection.add(id)
    } else {
      // If already in selection keep multi-select, else reset to just this id
      nextSelection = selectedIds.has(id) ? new Set(selectedIds) : new Set([id])
    }
    setSelectedIds(nextSelection)

    const pt = svgPoint(e.clientX, e.clientY)
    const selObjs = objects.filter(o => nextSelection.has(o.id))

    // Guard: always include the dragged object even if selection is somehow empty
    const ids = new Set([...nextSelection, id])
    const origPositions: Record<string, { x: number; y: number }> = {}
    objects.filter(o => ids.has(o.id)).forEach(o => { origPositions[o.id] = { x: o.x, y: o.y } })

    dragRef.current = { id, startX: pt.x, startY: pt.y, origPositions }
    ;(e.target as Element).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    // Pan mode
    if (panRef.current) {
      const dx = e.clientX - panRef.current.startX
      const dy = e.clientY - panRef.current.startY
      setPan({ x: panRef.current.origPan.x + dx, y: panRef.current.origPan.y + dy })
      return
    }
    if (!dragRef.current) return

    const pt = svgPoint(e.clientX, e.clientY)
    const dx = pt.x - dragRef.current.startX
    const dy = pt.y - dragRef.current.startY

    setObjects(prev => prev.map(o => {
      const orig = dragRef.current!.origPositions[o.id]
      if (!orig || o.locked) return o
      return { ...o, x: snap(orig.x + dx, snapOn), y: snap(orig.y + dy, snapOn) }
    }))
    setHasUnsaved(true)
  }

  const handlePointerUp = () => {
    if (dragRef.current) { dragRef.current = null }
    if (panRef.current)  { panRef.current  = null }
  }

  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if (e.button === 1 || tool === "move") {
      panRef.current = { startX: e.clientX, startY: e.clientY, origPan: { ...pan } }
      ;(e.target as Element).setPointerCapture(e.pointerId)
      return
    }
    setSelectedIds(new Set())
  }

  // Pinch-to-zoom on touch
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      pinchRef.current = { dist: Math.hypot(dx, dy), origZoom: zoom }
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.hypot(dx, dy)
      const ratio = dist / pinchRef.current.dist
      setZoom(Math.max(0.25, Math.min(3, pinchRef.current.origZoom * ratio)))
    }
  }

  const handleTouchEnd = () => {
    pinchRef.current = null
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    setZoom(z => Math.max(0.25, Math.min(3, z + (e.deltaY > 0 ? -0.08 : 0.08))))
  }

  // ── Grid ──
  const gridEl = showGrid ? (
    <defs>
      <pattern id="edGrid" width={GRID_SZ * zoom} height={GRID_SZ * zoom} patternUnits="userSpaceOnUse"
        x={pan.x % (GRID_SZ * zoom)} y={pan.y % (GRID_SZ * zoom)}>
        <path d={`M ${GRID_SZ * zoom} 0 L 0 0 0 ${GRID_SZ * zoom}`}
          fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={0.5} />
      </pattern>
    </defs>
  ) : null

  const AREA_BG: Record<string, string> = {
    billard:       "#181818",
    salitos:       "#161c16",
    restaurant140: "#1a1a1a",
    restaurant75:  "#161820",
    vip:           "#14100c",
  }
  const canvasBg = AREA_BG[activeArea] ?? "#141420"

  const selectedObj = selectedIds.size === 1 ? objects.find(o => o.id === [...selectedIds][0]) : undefined

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#0a0a10", overflow: "hidden" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .editor-scroll::-webkit-scrollbar { display: none; }
      `}</style>

      <Toolbar
        tool={tool} setTool={setTool}
        snapOn={snapOn} setSnapOn={setSnapOn}
        showGrid={showGrid} setShowGrid={setShowGrid}
        zoom={zoom} setZoom={setZoom}
        onAddTable={addTable} onAddBilliard={addBilliard}
        onSave={save} saving={saving} hasUnsaved={hasUnsaved}
        onUndo={undo} onRedo={redo}
        canUndo={history.length > 0} canRedo={future.length > 0}
        selCount={selectedIds.size} onDeleteSel={deleteSelected}
        onAlignH={alignH} onAlignV={alignV}
      />

      <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>
        {/* Left area selector */}
        <AreaSelector active={activeArea} onChange={a => { setActiveArea(a); setSelectedIds(new Set()) }} />

        {/* Canvas */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          {/* Object count */}
          <div style={{
            position: "absolute", top: 12, left: 12, zIndex: 10,
            background: "rgba(0,0,0,0.5)", padding: "4px 10px", borderRadius: 6,
            color: "#555", fontSize: 11, pointerEvents: "none",
          }}>
            {visible.length} Objekte — {AREAS.find(a => a.id === activeArea)?.label}
          </div>

          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, border: "3px solid #c9a84c", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                <span style={{ color: "#555", fontSize: 13 }}>Lade Grundriss...</span>
              </div>
            </div>
          ) : (
            <svg
              ref={canvasRef}
              style={{
                width: "100%", height: "100%",
                background: canvasBg,
                cursor: tool === "move" ? "grab" : "default",
                touchAction: "none",  // Critical for iPad pointer events
                display: "block",
              }}
              onPointerDown={handleCanvasPointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onWheel={handleWheel}
            >
              {gridEl}
              {showGrid && <rect width="100%" height="100%" fill="url(#edGrid)" />}

              {/* Transform group: pan + zoom */}
              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                {/* ── Fixed room geometry (walls, zones) – always behind objects ── */}
                <RoomGeometry areaId={activeArea} />

                {visible.map(obj =>
                  obj.type === "billiard" ? (
                    <BilliardShape
                      key={obj.id}
                      obj={obj}
                      selected={selectedIds.has(obj.id)}
                      onPointerDown={handlePointerDown}
                      onDoubleTap={id => setSelectedIds(new Set([id]))}
                    />
                  ) : (
                    <TableShape
                      key={obj.id}
                      obj={obj}
                      selected={selectedIds.has(obj.id)}
                      onPointerDown={handlePointerDown}
                      onDoubleTap={id => setSelectedIds(new Set([id]))}
                    />
                  )
                )}
              </g>
            </svg>
          )}

          {/* Properties panel */}
          {selectedObj && (
            <PropsPanel
              obj={selectedObj}
              onChange={updateObj}
              onDelete={deleteObj}
              onDuplicate={duplicateObj}
              onLockToggle={id => updateObj(id, { locked: !objects.find(o => o.id === id)?.locked })}
              onClose={() => setSelectedIds(new Set())}
            />
          )}
        </div>
      </div>

      <ToastStack toasts={toasts} />
    </div>
  )
}

// ─── Standalone Page ──────────────────────────────────────────────────────────

export default function FloorPlanEditorPage() {
  return (
    <div style={{ height: "100vh", overflow: "hidden" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10, padding: "0 16px",
        height: 48, background: "#0c0c14",
        borderBottom: "1px solid rgba(201,168,76,0.1)",
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6, background: "#c9a84c",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 900, color: "#0a0a0a", fontSize: 15, fontFamily: "'Bebas Neue', cursive",
        }}>R</div>
        <span style={{ color: "#c9a84c", fontFamily: "'Bebas Neue', cursive", fontSize: 17, letterSpacing: "0.1em" }}>RONDO</span>
        <span style={{ color: "#444", fontSize: 11 }}>/ Grundriss Editor</span>
        <div style={{ flex: 1 }} />
        <a href="/raumplan" style={{
          fontSize: 12, padding: "7px 14px", borderRadius: 7,
          border: "1px solid rgba(255,255,255,0.08)", color: "#666",
          background: "rgba(255,255,255,0.03)", textDecoration: "none",
        }}>
          Zur Ansicht
        </a>
      </div>
      <div style={{ height: "calc(100vh - 48px)" }}>
        <EmbeddedEditor />
      </div>
    </div>
  )
}
