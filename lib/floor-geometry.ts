// ─── Floor Geometry ──────────────────────────────────────────────────────────
// Single source of truth for table positions + room decorations.
// Used by both the /raumplan viewer and the editor.

export interface TableDef {
  id:       string
  type:     "table" | "billiard"
  label:    string
  // billiard
  x?:  number; y?: number; w?: number; h?: number
  rotation?: number; cx?: number; cy?: number
  // cross-table (restaurant)
  vw?: number; vh?: number; hw?: number; hh?: number
  // chair counts
  cT?: number; cB?: number; cL?: number; cR?: number
}

export interface AreaCanvas { w: number; h: number }

// ─── Billiard area ────────────────────────────────────────────────────────────
const BILLARD_TABLES: TableDef[] = [
  // Table 10 – small cross, top-left
  { id:"t10", type:"table", label:"10",  cx:78,  cy:95,  vw:28, vh:58, hw:58, hh:28, cT:2, cB:2, cL:1, cR:1 },
  // Table 30 – large cross, left-center
  { id:"t30", type:"table", label:"30",  cx:78,  cy:320, vw:28, vh:70, hw:70, hh:28, cT:2, cB:2, cL:1, cR:1 },
  // Billiard 1 – top-center-left
  { id:"b1",  type:"billiard", label:"B1", x:235, y:36, w:195, h:118 },
  // Billiard 2 – top-center-right
  { id:"b2",  type:"billiard", label:"B2", x:450, y:36, w:195, h:118 },
  // Billiard 3 – top-right, rotated ~15°
  { id:"b3",  type:"billiard", label:"B3", x:598, y:112, w:195, h:118,
    rotation: -14, cx: 695, cy: 171 },

  // Separator line (stored as type table with special id for RoomGeometry)
  // Middle tables (restaurant area)
  { id:"t52", type:"table", label:"52", cx:265, cy:248, vw:28, vh:54, hw:54, hh:28, cT:2, cB:2, cL:1, cR:1 },
  { id:"t53", type:"table", label:"53", cx:360, cy:248, vw:28, vh:54, hw:54, hh:28, cT:2, cB:2, cL:1, cR:1 },
  { id:"t54", type:"table", label:"54", cx:455, cy:248, vw:28, vh:120, hw:120, hh:28, cT:4, cB:4, cL:1, cR:1 },
  { id:"t51", type:"table", label:"51", cx:265, cy:340, vw:28, vh:54, hw:54, hh:28, cT:2, cB:2, cL:1, cR:1 },
  { id:"t50", type:"table", label:"50", cx:360, cy:340, vw:28, vh:54, hw:54, hh:28, cT:2, cB:2, cL:1, cR:1 },
  { id:"t58", type:"table", label:"58", cx:560, cy:340, vw:28, vh:70, hw:70, hh:28, cT:2, cB:2, cL:1, cR:1 },
  { id:"t59", type:"table", label:"59", cx:730, cy:340, vw:28, vh:54, hw:54, hh:28, cT:2, cB:2, cL:1, cR:1 },

  // Lower section tables
  { id:"t61", type:"table", label:"61", cx:310, cy:450, vw:28, vh:48, hw:48, hh:28, cT:2, cB:2, cL:1, cR:1 },
  { id:"t60", type:"table", label:"60", cx:430, cy:450, vw:28, vh:48, hw:48, hh:28, cT:2, cB:2, cL:1, cR:1 },
  { id:"t67", type:"table", label:"67", cx:545, cy:450, vw:28, vh:48, hw:48, hh:28, cT:2, cB:2, cL:1, cR:1 },
  { id:"t66", type:"table", label:"66", cx:660, cy:450, vw:28, vh:48, hw:48, hh:28, cT:2, cB:2, cL:1, cR:1 },
  { id:"t62", type:"table", label:"62", cx:310, cy:530, vw:28, vh:48, hw:48, hh:28, cT:2, cB:2, cL:1, cR:1 },
  { id:"t63", type:"table", label:"63", cx:395, cy:530, vw:28, vh:48, hw:48, hh:28, cT:2, cB:2, cL:1, cR:1 },
  { id:"t64", type:"table", label:"64", cx:510, cy:530, vw:28, vh:48, hw:48, hh:28, cT:2, cB:2, cL:1, cR:1 },
  { id:"t65", type:"table", label:"65", cx:620, cy:530, vw:28, vh:48, hw:48, hh:28, cT:2, cB:2, cL:1, cR:1 },
]

// ─── Exports ──────────────────────────────────────────────────────────────────

export const AREA_TABLE_DEFS: Record<string, TableDef[]> = {
  billard:       BILLARD_TABLES,
  restaurant140: BILLARD_TABLES,
  restaurant75:  BILLARD_TABLES,
  salitos:       BILLARD_TABLES,
  vip:           BILLARD_TABLES,
}

export const AREA_CANVAS: Record<string, AreaCanvas> = {
  billard:       { w: 810, h: 590 },
  restaurant140: { w: 810, h: 590 },
  restaurant75:  { w: 810, h: 590 },
  salitos:       { w: 810, h: 590 },
  vip:           { w: 810, h: 590 },
}

// ─── Room Geometry Component ──────────────────────────────────────────────────
// Renders walls, zone separators, decorations, logo

import React from "react"

export function RoomGeometry({ areaId }: { areaId: string }) {
  // Same geometry for all areas (it's one room)
  return (
    <>
      {/* ── Dark floor background ── */}
      <rect x={0} y={0} width={810} height={590} fill="#111111" />

      {/* ── Subtle floor texture (dark grid) ── */}
      <defs>
        <pattern id="floorGrid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="0.5" />
        </pattern>
        {/* Warm ambient glow gradient */}
        <radialGradient id="ambientGlow" cx="55%" cy="38%" r="38%">
          <stop offset="0%" stopColor="#8a6010" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#111111" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={810} height={590} fill="url(#floorGrid)" />
      <rect x={0} y={0} width={810} height={590} fill="url(#ambientGlow)" />

      {/* ── Top-left alcove wall (grey box, table 10 area) ── */}
      <rect x={20} y={20} width={120} height={145} rx={3}
        fill="rgba(80,80,80,0.08)" stroke="rgba(120,120,120,0.18)" strokeWidth={1.5} />

      {/* ── Left wall recess (table 30 area) ── */}
      <rect x={20} y={260} width={120} height={105} rx={3}
        fill="rgba(80,80,80,0.08)" stroke="rgba(120,120,120,0.18)" strokeWidth={1.5} />

      {/* ── Grey diagonal separator wall between upper and lower sections ── */}
      {/* Horizontal grey wall line */}
      <line x1={218} y1={398} x2={810} y2={398}
        stroke="#3a3a3a" strokeWidth={10} strokeLinecap="round" />
      <line x1={20}  y1={398} x2={155} y2={398}
        stroke="#3a3a3a" strokeWidth={10} strokeLinecap="round" />
      {/* Diagonal segment connecting the two */}
      <line x1={155} y1={398} x2={218} y2={398}
        stroke="#3a3a3a" strokeWidth={10} strokeLinecap="round" />

      {/* Lower zone fill – slightly different darkness to show separation */}
      <rect x={218} y={399} width={592} height={191} fill="rgba(0,0,0,0.18)" />

      {/* ── Plant / bush decorations ── */}
      {/* Plant 1 – bottom-left area */}
      <PlantDecor cx={155} cy={480} r={22} />
      {/* Plant 2 – near top-right billiard */}
      <PlantDecor cx={760} cy={80} r={18} />
      {/* Plant 3 – right side lower */}
      <PlantDecor cx={760} cy={490} r={16} />

      {/* ── Rondo logo – bottom left ── */}
      <RondoLogo x={22} y={470} />

      {/* ── Room outer border ── */}
      <rect x={1} y={1} width={808} height={588} rx={4}
        fill="none" stroke="rgba(60,60,60,0.6)" strokeWidth={1.5} />
    </>
  )
}

function PlantDecor({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <g>
      {/* Shadow */}
      <ellipse cx={cx} cy={cy + r * 0.6} rx={r * 0.9} ry={r * 0.3} fill="rgba(0,0,0,0.35)" />
      {/* Multiple leaf circles */}
      {[
        { dx: 0,       dy: -r * 0.5,  rs: r * 0.65 },
        { dx: -r * 0.5,dy: r * 0.1,  rs: r * 0.6  },
        { dx:  r * 0.5,dy: r * 0.1,  rs: r * 0.6  },
        { dx:  0,       dy:  r * 0.4, rs: r * 0.55 },
      ].map((l, i) => (
        <circle key={i} cx={cx + l.dx} cy={cy + l.dy} r={l.rs}
          fill={i % 2 === 0 ? "#1a4a1a" : "#1e5a1e"}
          stroke="#0d2a0d" strokeWidth={0.5} opacity={0.92} />
      ))}
      {/* Highlight */}
      <circle cx={cx - r * 0.18} cy={cy - r * 0.35} r={r * 0.2}
        fill="rgba(80,180,80,0.18)" />
    </g>
  )
}

function RondoLogo({ x, y }: { x: number; y: number }) {
  return (
    <g>
      {/* Badge background */}
      <rect x={x} y={y} width={112} height={72} rx={8}
        fill="#1a1008" stroke="#4a3808" strokeWidth={1.5} />

      {/* Gold coin / emblem */}
      <circle cx={x + 56} cy={y + 24} r={16}
        fill="#c9a84c" stroke="#a07820" strokeWidth={1.5} />
      <circle cx={x + 56} cy={y + 24} r={12}
        fill="none" stroke="#a07820" strokeWidth={0.8} opacity={0.5} />
      {/* Billiard cue cross */}
      <line x1={x + 48} y1={y + 24} x2={x + 64} y2={y + 24}
        stroke="#7a5010" strokeWidth={1.5} />
      <line x1={x + 56} y1={y + 16} x2={x + 56} y2={y + 32}
        stroke="#7a5010" strokeWidth={1.5} />
      <circle cx={x + 56} cy={y + 24} r={2.5} fill="#7a5010" />

      {/* RONDO text */}
      <text x={x + 56} y={y + 48} textAnchor="middle"
        fill="#c9a84c" fontSize={13} fontWeight="900"
        fontFamily="'Bebas Neue', Impact, sans-serif" letterSpacing="0.15em">
        RONDO
      </text>

      {/* GOOD TIMES sub-text */}
      <text x={x + 56} y={y + 63} textAnchor="middle"
        fill="#7a5a10" fontSize={8} fontWeight="600"
        fontFamily="'DM Sans', sans-serif" letterSpacing="0.1em">
        GOOD TIMES
      </text>
    </g>
  )
}
