"use client"

// ─────────────────────────────────────────────────────────────────────────────
// Shared Floor Plan Geometry + Renderer
// Used by BOTH the dashboard view (raumplan/page.tsx) and the editor.
// One source of truth for room walls, dimensions, and default table positions.
// ─────────────────────────────────────────────────────────────────────────────

import React from "react"

// ── Canvas sizes per area ────────────────────────────────────────────────────

export const AREA_CANVAS: Record<string, { w: number; h: number }> = {
  billard:       { w: 860, h: 520 },
  salitos:       { w: 860, h: 520 },
  restaurant140: { w: 860, h: 560 },
  restaurant75:  { w: 860, h: 520 },
  vip:           { w: 860, h: 520 },
}

// ── Room geometry shapes ──────────────────────────────────────────────────────
// Each entry renders SVG elements that are always visible (fixed room outline).
// These are drawn BELOW all tables in both editor and dashboard.

export function RoomGeometry({ areaId, zoom = 1 }: { areaId: string; zoom?: number }) {
  switch (areaId) {
    case "restaurant140": return <RoomRest140 />
    case "billard":       return <RoomBillard />
    case "salitos":       return <RoomSalitos />
    case "restaurant75":  return <RoomRest75 />
    case "vip":           return <RoomVip />
    default:              return null
  }
}

// ── Restaurant 140 Zoll ───────────────────────────────────────────────────────
// viewBox: 860 × 560
// Layout:
//   - Top-left dark box (bar entrance): x=8 y=8 w=300 h=270
//   - Bottom-right enclosed room: x=640 y=310 w=210 h=242
//   - Diagonal wall lines: 308,278→308,400 and 308,400→20,540
//   - Rondo logo box: x=20 y=420 w=250 h=120
//   - Plants at 305,305 and 820,320

function RoomRest140() {
  return (
    <g>
      {/* Ambient glow */}
      <defs>
        <radialGradient id="r140glow" cx="50%" cy="42%" r="40%">
          <stop offset="0%" stopColor="rgba(255,140,30,0.07)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      <rect width={860} height={560} fill="#1a1a1a" />
      <rect width={860} height={560} fill="url(#r140glow)" />

      {/* ── Bar / entrance box – top left ── */}
      <rect x={8} y={8} width={300} height={270}
        fill="rgba(16,16,16,0.9)" stroke="#282828" strokeWidth={1.5} rx={3} />

      {/* ── Diagonal wall separating bar from restaurant floor ── */}
      <line x1={308} y1={278} x2={308} y2={400} stroke="#2a2a2a" strokeWidth={2} />
      <line x1={308} y1={400} x2={20}  y2={540} stroke="#2a2a2a" strokeWidth={2} />

      {/* ── Bottom-right enclosed room ── */}
      <rect x={640} y={310} width={210} height={242}
        fill="rgba(14,14,18,0.85)" stroke="#2e2e2e" strokeWidth={1.5} rx={3} />

      {/* ── RONDO logo box ── */}
      <rect x={20} y={420} width={250} height={120}
        fill="rgba(12,12,12,0.95)" stroke="#222" strokeWidth={1} rx={4} />
      <text x={145} y={476} textAnchor="middle"
        fill="#c8b830" fontSize={28} fontFamily="'Bebas Neue', cursive"
        letterSpacing="3">RONDO</text>
      <text x={145} y={492} textAnchor="middle"
        fill="#5a5a3a" fontSize={10} letterSpacing="0.15em">GOOD TIMES</text>

      {/* Plants */}
      <text x={305} y={305} fontSize={20} opacity={0.5}>🌿</text>
      <text x={820} y={320} fontSize={22} opacity={0.55}>🌿</text>
    </g>
  )
}

// ── Billard Tisch ─────────────────────────────────────────────────────────────
// viewBox: 860 × 520
// Layout: large open room, bar counter on right side

function RoomBillard() {
  return (
    <g>
      <defs>
        <radialGradient id="billGlow" cx="45%" cy="40%" r="45%">
          <stop offset="0%" stopColor="rgba(26,107,42,0.06)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      <rect width={860} height={520} fill="#181818" />
      <rect width={860} height={520} fill="url(#billGlow)" />

      {/* Outer room border */}
      <rect x={8} y={8} width={844} height={504}
        fill="none" stroke="#232323" strokeWidth={1.5} rx={4} />

      {/* Bar counter strip – right edge */}
      <rect x={720} y={8} width={132} height={504}
        fill="rgba(12,12,12,0.7)" stroke="#2a2a2a" strokeWidth={1} rx={2} />
      <text x={786} y={280} textAnchor="middle" fill="#2a2a2a" fontSize={11}
        fontFamily="'Bebas Neue', cursive" letterSpacing="0.15em"
        transform="rotate(90,786,280)">THEKE</text>

      {/* Entrance area – bottom left */}
      <rect x={8} y={360} width={180} height={152}
        fill="rgba(10,10,12,0.7)" stroke="#222" strokeWidth={1} rx={2} />
      <text x={94} y={438} textAnchor="middle" fill="#2a2a2a" fontSize={10}
        fontFamily="'Bebas Neue', cursive" letterSpacing="0.12em">EINGANG</text>

      {/* Rondo logo – bottom left inside entrance */}
      <text x={94} y={490} textAnchor="middle"
        fill="#c8b830" fontSize={20} fontFamily="'Bebas Neue', cursive"
        letterSpacing="2">RONDO</text>
      <text x={94} y={502} textAnchor="middle"
        fill="#5a5a3a" fontSize={8} letterSpacing="0.15em">GOOD TIMES</text>

      {/* Plants */}
      <text x={690} y={52}  fontSize={18} opacity={0.4}>🌿</text>
      <text x={690} y={490} fontSize={18} opacity={0.4}>🌿</text>
    </g>
  )
}

// ── Salitos Lounge / Outdoor ──────────────────────────────────────────────────
// viewBox: 860 × 520
// Layout: outdoor / lounge feel, open terrace with plants and rail border

function RoomSalitos() {
  return (
    <g>
      <defs>
        <radialGradient id="salGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(50,120,30,0.08)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      <rect width={860} height={520} fill="#161c16" />
      <rect width={860} height={520} fill="url(#salGlow)" />

      {/* Terrace border – dashed to indicate outdoor */}
      <rect x={8} y={8} width={844} height={504}
        fill="none" stroke="#2a3a2a" strokeWidth={1.5} strokeDasharray="8 4" rx={4} />

      {/* Inner zone divider – covered vs open area */}
      <line x1={8} y1={340} x2={852} y2={340} stroke="#2a3a2a" strokeWidth={1} />
      <text x={30} y={360} fill="#2a3a2a" fontSize={9}
        fontFamily="'Bebas Neue', cursive" letterSpacing="0.12em">OUTDOOR BEREICH</text>
      <text x={30} y={48}  fill="#2a3a2a" fontSize={9}
        fontFamily="'Bebas Neue', cursive" letterSpacing="0.12em">LOUNGE / SALITOS</text>

      {/* Plants along borders */}
      <text x={20}  y={330} fontSize={22} opacity={0.45}>🌿</text>
      <text x={820} y={330} fontSize={22} opacity={0.45}>🌿</text>
      <text x={20}  y={60}  fontSize={18} opacity={0.35}>🌿</text>
      <text x={820} y={60}  fontSize={18} opacity={0.35}>🌿</text>
      <text x={415} y={510} fontSize={18} opacity={0.35}>🌿</text>
    </g>
  )
}

// ── Restaurant 75 Zoll / Sport ────────────────────────────────────────────────
// viewBox: 860 × 520
// Layout: TV screen wall at top, bar/counter on right, seating area in centre

function RoomRest75() {
  return (
    <g>
      <defs>
        <radialGradient id="r75glow" cx="50%" cy="45%" r="42%">
          <stop offset="0%" stopColor="rgba(40,60,160,0.05)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      <rect width={860} height={520} fill="#161820" />
      <rect width={860} height={520} fill="url(#r75glow)" />

      {/* Outer room border */}
      <rect x={8} y={8} width={844} height={504}
        fill="none" stroke="#222230" strokeWidth={1.5} rx={3} />

      {/* TV screen strip – top */}
      <rect x={8} y={8} width={700} height={68}
        fill="rgba(10,10,18,0.95)" stroke="#1e1e2a" strokeWidth={1} rx={2} />

      {/* 3 TV screens */}
      {[40, 265, 490].map((x, i) => (
        <g key={i}>
          <rect x={x} y={18} width={200} height={48}
            fill="#0a0a14" stroke="#1a1a28" strokeWidth={1} rx={2} />
          <text x={x + 100} y={46} textAnchor="middle" fill="#181828" fontSize={9}
            fontFamily="'Bebas Neue', cursive" letterSpacing="0.1em">75 ZOLL</text>
        </g>
      ))}

      {/* Bar counter strip – right */}
      <rect x={720} y={8} width={132} height={504}
        fill="rgba(12,12,18,0.8)" stroke="#222230" strokeWidth={1} rx={2} />
      <text x={786} y={280} textAnchor="middle" fill="#222230" fontSize={11}
        fontFamily="'Bebas Neue', cursive" letterSpacing="0.15em"
        transform="rotate(90,786,280)">BAR / THEKE</text>

      {/* Divider line below screens */}
      <line x1={8} y1={76} x2={720} y2={76} stroke="#222230" strokeWidth={1} />

      {/* Label */}
      <text x={30} y={100} fill="#1e1e2a" fontSize={9}
        fontFamily="'Bebas Neue', cursive" letterSpacing="0.12em">SPORT BEREICH</text>
    </g>
  )
}

// ── VIP Raum / Sport ──────────────────────────────────────────────────────────
// viewBox: 860 × 520
// Layout: private VIP booths left, sport/billiard zone right, velvet rope divider

function RoomVip() {
  return (
    <g>
      <defs>
        <radialGradient id="vipGlow" cx="50%" cy="45%" r="45%">
          <stop offset="0%" stopColor="rgba(201,168,76,0.06)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      <rect width={860} height={520} fill="#14100c" />
      <rect width={860} height={520} fill="url(#vipGlow)" />

      {/* Outer room border – gold accent */}
      <rect x={8} y={8} width={844} height={504}
        fill="none" stroke="#2a2018" strokeWidth={1.5} rx={4} />

      {/* VIP zone – left half */}
      <rect x={8} y={8} width={500} height={504}
        fill="rgba(20,16,10,0.6)" stroke="#2a2018" strokeWidth={1} rx={2} />
      <text x={30} y={40} fill="#2a2018" fontSize={9}
        fontFamily="'Bebas Neue', cursive" letterSpacing="0.14em">VIP BEREICH</text>

      {/* Sport zone – right half */}
      <rect x={508} y={8} width={344} height={504}
        fill="rgba(10,12,14,0.7)" stroke="#1e222a" strokeWidth={1} rx={2} />
      <text x={530} y={40} fill="#1e222a" fontSize={9}
        fontFamily="'Bebas Neue', cursive" letterSpacing="0.12em">SPORT / BILLARD</text>

      {/* Velvet rope / divider */}
      <line x1={508} y1={8} x2={508} y2={512} stroke="#2a2018" strokeWidth={2} strokeDasharray="6 3" />

      {/* Gold accent corners */}
      {[[8,8],[852,8],[8,512],[852,512]].map(([x,y], i) => (
        <circle key={i} cx={x} cy={y} r={4} fill="#c9a84c" opacity={0.3} />
      ))}

      {/* Rondo logo watermark – bottom right of VIP zone */}
      <text x={254} y={488} textAnchor="middle"
        fill="#c8b830" fontSize={16} fontFamily="'Bebas Neue', cursive"
        letterSpacing="2" opacity={0.25}>RONDO VIP</text>
    </g>
  )
}

// ── Per-area default table positions ─────────────────────────────────────────
// These coordinates match EXACTLY what both the dashboard FloorPlan SVG
// and the editor DEFAULT_LAYOUTS use. Single source of truth.

export type AreaTableDef = {
  id: string
  type: "table" | "billiard"
  cx: number   // center-x (for dashboard TTable)
  cy: number   // center-y
  x: number    // top-left-x (for editor FloorObject, cx - w/2)
  y: number    // top-left-y (cy - h/2)
  w: number    // width
  h: number    // height
  label: string
  seats: number
  rotation: number
  // TTable-specific props (dashboard)
  vw?: number; vh?: number; hw?: number; hh?: number
  cT?: number; cB?: number; cL?: number; cR?: number
}

function tDef(
  id: string, label: string, cx: number, cy: number,
  vw: number, vh: number, hw: number, hh: number,
  cT: number, cB: number, cL: number, cR: number,
  seats: number, rotation = 0
): AreaTableDef {
  const w = hw + 6
  const h = vh + 6
  return { id, type: "table", cx, cy, x: Math.round(cx - w / 2), y: Math.round(cy - h / 2), w, h, label, seats, rotation, vw, vh, hw, hh, cT, cB, cL, cR }
}

function bDef(
  id: string, label: string, x: number, y: number,
  w: number, h: number, rotation = 0, seats = 0
): AreaTableDef {
  return { id, type: "billiard", cx: x + w / 2, cy: y + h / 2, x, y, w, h, label, seats, rotation }
}

export const AREA_TABLE_DEFS: Record<string, AreaTableDef[]> = {

  // ── Restaurant 140 Zoll ────────────────────────────────────────────────────
  restaurant140: [
    tDef("t10",  "10",  59,  47,  18, 48, 52, 20, 2, 2, 1, 1, 4),
    tDef("t30",  "30",  184, 47,  18, 48, 52, 20, 2, 2, 1, 1, 4),
    tDef("t52",  "52",  339, 157, 18, 48, 52, 20, 2, 2, 1, 1, 4),
    tDef("t53",  "53",  429, 157, 18, 48, 52, 20, 2, 2, 1, 1, 4),
    tDef("t54",  "54",  521, 157, 18, 66, 68, 20, 3, 3, 2, 2, 8),
    tDef("t51",  "51",  339, 255, 18, 48, 52, 20, 2, 2, 1, 1, 4),
    tDef("t50",  "50",  430, 258, 18, 48, 52, 20, 2, 2, 1, 1, 4),
    tDef("t58",  "58",  589, 255, 18, 48, 52, 20, 2, 2, 1, 1, 4),
    tDef("t59",  "59",  729, 255, 18, 48, 52, 20, 2, 2, 1, 1, 2),
    tDef("t61",  "61",  652, 330, 18, 48, 52, 20, 2, 2, 1, 1, 4),
    tDef("t60",  "60",  742, 330, 18, 48, 52, 20, 2, 2, 1, 1, 4),
    tDef("t67",  "67",  652, 418, 18, 48, 52, 20, 2, 2, 1, 1, 4),
    tDef("t66",  "66",  742, 418, 18, 48, 52, 20, 2, 2, 1, 1, 4),
    tDef("t62",  "62",  652, 480, 18, 48, 52, 20, 2, 2, 1, 1, 4),
    tDef("t63",  "63",  742, 480, 18, 48, 52, 20, 2, 2, 1, 1, 4),
    tDef("t64",  "64",  310, 470, 18, 48, 52, 20, 2, 2, 1, 1, 4),
    tDef("t65",  "65",  400, 470, 18, 48, 52, 20, 2, 2, 1, 1, 4),
    bDef("b1", "Billard 1", 580, 12,  108, 170),
    bDef("b2", "Billard 2", 706, 12,  108, 170),
    bDef("b3", "Billard 3", 500, 330, 148, 94, -38),
  ],

  // ── Billard Tisch ──────────────────────────────────────────────────────────
  billard: [
    bDef("b1",  "Billard 1", 200, 30,  220, 136),
    bDef("b2",  "Billard 2", 460, 30,  220, 136, 0),
    bDef("b3",  "Billard 3", 320, 230, 220, 136, -12),
    tDef("bt10","10",  76,  250, 18, 48, 52, 20, 2, 2, 1, 1, 4),
    tDef("bt30","30",  76,  380, 18, 48, 52, 20, 2, 2, 1, 1, 4),
  ],

  // ── Salitos Lounge / Outdoor ───────────────────────────────────────────────
  salitos: [
    tDef("s1",  "S1",  80,  100, 18, 48, 52, 20, 2, 2, 1, 1, 4),
    tDef("s2",  "S2",  200, 100, 18, 48, 52, 20, 2, 2, 1, 1, 4),
    tDef("s3",  "S3",  330, 100, 18, 48, 96, 20, 3, 3, 2, 2, 6),
    tDef("s4",  "S4",  80,  220, 18, 48, 52, 20, 2, 2, 1, 1, 4),
    tDef("s5",  "S5",  200, 220, 18, 48, 52, 20, 2, 2, 1, 1, 4),
    tDef("s6",  "S6",  330, 220, 18, 48, 52, 20, 2, 2, 1, 1, 4),
    tDef("s7",  "S7",  80,  400, 18, 48, 52, 20, 2, 2, 1, 1, 2),
    tDef("s8",  "S8",  200, 400, 18, 48, 52, 20, 2, 2, 1, 1, 2),
    tDef("s9",  "S9",  330, 400, 18, 48, 52, 20, 2, 2, 1, 1, 4),
    tDef("s10", "S10", 500, 100, 18, 48, 52, 20, 2, 2, 1, 1, 4),
    tDef("s11", "S11", 500, 220, 18, 48, 52, 20, 2, 2, 1, 1, 4),
    tDef("s12", "S12", 630, 100, 18, 48, 96, 20, 3, 3, 2, 2, 6),
    tDef("s13", "S13", 630, 220, 18, 48, 52, 20, 2, 2, 1, 1, 4),
    tDef("s14", "S14", 500, 400, 18, 48, 52, 20, 2, 2, 1, 1, 4),
    tDef("s15", "S15", 630, 400, 18, 48, 52, 20, 2, 2, 1, 1, 4),
  ],

  // ── Restaurant 75 Zoll / Sport ─────────────────────────────────────────────
  restaurant75: [
    tDef("r1",  "1",   80,  160, 18, 48, 52, 20, 2, 2, 1, 1, 4),
    tDef("r2",  "2",   200, 160, 18, 48, 52, 20, 2, 2, 1, 1, 4),
    tDef("r3",  "3",   320, 160, 18, 48, 52, 20, 2, 2, 1, 1, 4),
    tDef("r4",  "4",   440, 160, 18, 48, 52, 20, 2, 2, 1, 1, 4),
    tDef("r5",  "5",   80,  280, 18, 48, 96, 20, 3, 3, 2, 2, 6),
    tDef("r6",  "6",   210, 280, 18, 48, 52, 20, 2, 2, 1, 1, 4),
    tDef("r7",  "7",   330, 280, 18, 48, 52, 20, 2, 2, 1, 1, 4),
    tDef("r8",  "8",   450, 280, 18, 48, 52, 20, 2, 2, 1, 1, 4),
    tDef("r9",  "9",   80,  400, 18, 48, 52, 20, 2, 2, 1, 1, 4),
    tDef("r10", "10",  200, 400, 18, 48, 52, 20, 2, 2, 1, 1, 4),
    tDef("r11", "11",  320, 400, 18, 48, 52, 20, 2, 2, 1, 1, 4),
    tDef("r12", "12",  440, 400, 18, 48, 52, 20, 2, 2, 1, 1, 2),
    tDef("rb1", "Bar 1", 580, 160, 18, 32, 52, 20, 1, 1, 0, 0, 2),
    tDef("rb2", "Bar 2", 580, 240, 18, 32, 52, 20, 1, 1, 0, 0, 2),
    tDef("rb3", "Bar 3", 580, 320, 18, 32, 52, 20, 1, 1, 0, 0, 2),
  ],

  // ── VIP Raum / Sport ──────────────────────────────────────────────────────
  vip: [
    tDef("v1",  "VIP 1", 80,  100, 18, 48, 96, 20, 3, 3, 2, 2, 6),
    tDef("v2",  "VIP 2", 240, 100, 18, 48, 96, 20, 3, 3, 2, 2, 6),
    tDef("v3",  "VIP 3", 80,  240, 18, 48, 96, 20, 3, 3, 2, 2, 6),
    tDef("v4",  "VIP 4", 240, 240, 18, 48, 96, 20, 3, 3, 2, 2, 6),
    tDef("v5",  "VIP 5", 80,  380, 18, 48, 96, 20, 3, 3, 2, 2, 8),
    tDef("v6",  "VIP 6", 240, 380, 18, 48, 52, 20, 2, 2, 1, 1, 4),
    tDef("v7",  "VIP 7", 380, 100, 18, 48, 52, 20, 2, 2, 1, 1, 4),
    tDef("v8",  "VIP 8", 380, 240, 18, 48, 52, 20, 2, 2, 1, 1, 4),
    bDef("vb1", "Sport B1", 540, 60,  220, 136),
    bDef("vb2", "Sport B2", 540, 260, 220, 136),
  ],
}
