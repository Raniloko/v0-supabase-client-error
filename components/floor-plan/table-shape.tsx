"use client"
import type { Table, Reservation } from "@/lib/types"

interface TableShapeProps {
  table: Table
  reservation: Reservation | null
  onClick: () => void
  isSelected: boolean
}

const STATUS_COLORS = {
  free:     { bg: "#1a1a1a", border: "rgba(201,168,76,0.2)", text: "#6b6b6b", guestColor: "#6b6b6b" },
  reserved: { bg: "rgba(201,168,76,0.12)", border: "#c9a84c", text: "#c9a84c", guestColor: "#c9a84c" },
  occupied: { bg: "rgba(42,157,92,0.12)",  border: "#2a9d5c", text: "#2a9d5c", guestColor: "#2a9d5c" },
  blocked:  { bg: "rgba(204,34,34,0.12)",  border: "#cc2222", text: "#cc2222", guestColor: "#cc2222" },
}

export default function TableShape({ table, reservation, onClick, isSelected }: TableShapeProps) {
  const colors = STATUS_COLORS[table.status] || STATUS_COLORS.free
  const isBilliard = table.table_type === "billiard"

  const guestName = reservation?.guest_name
  const timeStr = reservation ? `${reservation.start_time.slice(0,5)}` : null

  return (
    <div
      onClick={onClick}
      className="absolute transition-all duration-300 group"
      style={{
        left: table.pos_x,
        top: table.pos_y,
        width: table.width,
        height: table.height,
        zIndex: isSelected ? 10 : 1,
      }}
    >
      {isBilliard ? (
        <BilliardTable table={table} colors={colors} isSelected={isSelected} guestName={guestName} timeStr={timeStr} />
      ) : (
        <RestaurantTable table={table} colors={colors} isSelected={isSelected} guestName={guestName} timeStr={timeStr} />
      )}
    </div>
  )
}

function RestaurantTable({
  table,
  colors,
  isSelected,
  guestName,
  timeStr,
}: {
  table: Table
  colors: typeof STATUS_COLORS.free
  isSelected: boolean
  guestName?: string | null
  timeStr?: string | null
}) {
  const w = table.width
  const h = table.height
  const chairSize = 10
  const chairsLong = Math.max(2, Math.floor(w / 30))
  const chairsShort = Math.max(1, Math.floor(h / 30))

  return (
    <div className="relative w-full h-full" style={{ transform: isSelected ? "scale(1.08)" : "scale(1)", transition: "transform 0.2s" }}>
      {/* Top chairs */}
      {Array.from({ length: chairsLong }).map((_, i) => (
        <div
          key={`tc${i}`}
          className="absolute rounded-sm"
          style={{
            width: chairSize,
            height: 7,
            background: colors.border,
            top: -10,
            left: ((w - chairSize * chairsLong - 4 * (chairsLong - 1)) / 2) + i * (chairSize + 4),
            opacity: 0.6,
          }}
        />
      ))}
      {/* Bottom chairs */}
      {Array.from({ length: chairsLong }).map((_, i) => (
        <div
          key={`bc${i}`}
          className="absolute rounded-sm"
          style={{
            width: chairSize,
            height: 7,
            background: colors.border,
            bottom: -10,
            left: ((w - chairSize * chairsLong - 4 * (chairsLong - 1)) / 2) + i * (chairSize + 4),
            opacity: 0.6,
          }}
        />
      ))}
      {/* Left chairs */}
      {Array.from({ length: chairsShort }).map((_, i) => (
        <div
          key={`lc${i}`}
          className="absolute rounded-sm"
          style={{
            width: 7,
            height: chairSize,
            background: colors.border,
            left: -10,
            top: ((h - chairSize * chairsShort - 4 * (chairsShort - 1)) / 2) + i * (chairSize + 4),
            opacity: 0.6,
          }}
        />
      ))}
      {/* Right chairs */}
      {Array.from({ length: chairsShort }).map((_, i) => (
        <div
          key={`rc${i}`}
          className="absolute rounded-sm"
          style={{
            width: 7,
            height: chairSize,
            background: colors.border,
            right: -10,
            top: ((h - chairSize * chairsShort - 4 * (chairsShort - 1)) / 2) + i * (chairSize + 4),
            opacity: 0.6,
          }}
        />
      ))}

      {/* Table surface */}
      <div
        className="w-full h-full rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-200"
        style={{
          background: colors.bg,
          border: `2px solid ${isSelected ? "#c9a84c" : colors.border}`,
          boxShadow: isSelected
            ? `0 0 0 3px rgba(201,168,76,0.3), 0 0 16px rgba(201,168,76,0.2)`
            : table.status === "occupied"
            ? `0 0 12px rgba(42,157,92,0.2)`
            : table.status === "reserved"
            ? `0 0 12px rgba(201,168,76,0.15)`
            : "none",
        }}
      >
        <span className="text-sm font-bold" style={{ color: colors.text }}>
          {table.number}
        </span>
        {guestName && (
          <span className="text-xs truncate max-w-[90%] text-center leading-relaxed" style={{ color: colors.guestColor, fontSize: "9px" }}>
            {guestName.split(",")[0]}
            {timeStr && ` · ${timeStr}`}
          </span>
        )}
        <span className="text-xs" style={{ color: "#3a3a3a", fontSize: "8px" }}>
          {table.capacity}P
        </span>
      </div>
    </div>
  )
}

function BilliardTable({
  table,
  colors,
  isSelected,
  guestName,
  timeStr,
}: {
  table: Table
  colors: typeof STATUS_COLORS.free
  isSelected: boolean
  guestName?: string | null
  timeStr?: string | null
}) {
  const pocketPositions = [
    { x: 6, y: 6 }, { x: "50%", y: 6 }, { x: "calc(100% - 6px)", y: 6 },
    { x: 6, y: "calc(100% - 6px)" }, { x: "50%", y: "calc(100% - 6px)" }, { x: "calc(100% - 6px)", y: "calc(100% - 6px)" },
  ]

  return (
    <div
      className="w-full h-full rounded-xl flex items-center justify-center relative transition-all duration-200"
      style={{
        background: table.status === "free" ? "#0d3320" : colors.bg,
        border: `2px solid ${isSelected ? "#c9a84c" : table.status === "free" ? "#1a5c30" : colors.border}`,
        boxShadow: isSelected
          ? "0 0 0 3px rgba(201,168,76,0.3)"
          : table.status === "free"
          ? "inset 0 2px 8px rgba(0,0,0,0.4)"
          : `0 0 12px ${colors.border}40`,
        transform: isSelected ? "scale(1.08)" : "scale(1)",
        transition: "transform 0.2s, box-shadow 0.2s",
      }}
    >
      {/* Pockets */}
      {pocketPositions.map((pos, i) => (
        <div
          key={i}
          className="absolute w-3 h-3 rounded-full"
          style={{
            background: "#0a0a0a",
            left: typeof pos.x === "string" ? pos.x : pos.x,
            top: typeof pos.y === "string" ? pos.y : pos.y,
            transform: "translate(-50%, -50%)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        />
      ))}
      {/* Center line */}
      <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
      {/* Center spot */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.12)" }} />

      <div className="flex flex-col items-center gap-0.5 z-10">
        <span className="text-xs font-bold" style={{ color: table.status === "free" ? "#2a9d5c" : colors.text }}>
          {table.number}
        </span>
        {guestName && (
          <span className="text-xs text-center" style={{ color: colors.guestColor, fontSize: "8px" }}>
            {guestName.split(",")[0]}{timeStr ? ` · ${timeStr}` : ""}
          </span>
        )}
      </div>
    </div>
  )
}
