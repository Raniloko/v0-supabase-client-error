"use client"
import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Area, Table, Reservation } from "@/lib/types"
import TableShape from "./table-shape"
import TableSidePanel from "./table-side-panel"
import { useSearchParams, useRouter } from "next/navigation"
import { Dices, Sofa, Trophy, Crown } from "lucide-react"

function TvIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={className} width="1em" height="1em">
      <rect width="20" height="15" x="2" y="3" rx="2"/>
      <polyline points="8 21 12 17 16 21"/>
    </svg>
  )
}

const AREA_ICONS: Record<string, React.ElementType> = {
  billard: Dices,
  salitos: Sofa,
  rest140: TvIcon,
  rest75:  Trophy,
  vip:     Crown,
}

export default function FloorPlanClient() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [areas, setAreas] = useState<Area[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [selectedAreaId, setSelectedAreaId] = useState<string>("")
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const todayStr = new Date().toISOString().split("T")[0]

  const fetchAll = async () => {
    const [{ data: areasData }, { data: tablesData }, { data: resData }] = await Promise.all([
      supabase.from("areas").select("*").eq("enabled", true).order("sort_order"),
      supabase.from("tables").select("*").order("number"),
      supabase.from("reservations").select("*, table:tables(*), area:areas(*)")
        .eq("reservation_date", todayStr)
        .in("status", ["confirmed", "occupied"]),
    ])
    if (areasData) {
      setAreas(areasData as Area[])
      const initialArea = searchParams.get("area") || areasData[0]?.id
      setSelectedAreaId(initialArea)
    }
    if (tablesData) setTables(tablesData as Table[])
    if (resData) setReservations(resData as Reservation[])
    setLoading(false)
  }

  useEffect(() => {
    fetchAll()
    const channel = supabase
      .channel("floorplan-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "tables" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, fetchAll)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const switchArea = (areaId: string) => {
    setSelectedAreaId(areaId)
    setSelectedTableId(null)
    router.replace(`/dashboard/raumplan?area=${areaId}`, { scroll: false })
  }

  const areaTablesMap = tables.filter(t => t.area_id === selectedAreaId)

  const getReservationForTable = (tableId: string) =>
    reservations.find(r => r.table_id === tableId) || null

  const selectedTable = tables.find(t => t.id === selectedTableId) || null
  const selectedArea = areas.find(a => a.id === selectedAreaId) || null
  const isVip = selectedAreaId === "vip"

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(201,168,76,0.2)", borderTopColor: "#c9a84c" }} />
      </div>
    )
  }

  return (
    <div className="flex gap-0 h-[calc(100vh-56px-48px)] -m-6">
      {/* Area Tabs – right column */}
      <div
        className="flex flex-col gap-1 p-2 order-last"
        style={{
          background: "rgba(10,10,10,0.8)",
          borderLeft: "1px solid rgba(201,168,76,0.1)",
          width: "56px",
          minWidth: "56px",
        }}
      >
        {areas.map((area, i) => {
          const Icon = AREA_ICONS[area.id] || Tv2
          const active = area.id === selectedAreaId
          return (
            <button
              key={area.id}
              onClick={() => switchArea(area.id)}
              title={area.name}
              className="flex flex-col items-center justify-center gap-1 w-10 h-10 rounded-lg transition-all duration-200 mx-auto"
              style={{
                background: active ? "rgba(201,168,76,0.12)" : "transparent",
                border: active ? "1px solid rgba(201,168,76,0.3)" : "1px solid transparent",
              }}
            >
              <span className="text-xs font-bold" style={{ color: active ? "#c9a84c" : "#4a4a4a" }}>{i + 1}</span>
              <Icon className="w-3.5 h-3.5" style={{ color: active ? "#c9a84c" : "#3a3a3a" }} />
            </button>
          )
        })}
      </div>

      {/* Floor plan canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ background: "#0a0a0a" }}>
        {/* Floor texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(201,168,76,0.03) 40px),
              repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(201,168,76,0.03) 40px)
            `,
          }}
        />

        {/* VIP glow border */}
        {isVip && (
          <div
            className="absolute inset-4 rounded-2xl pointer-events-none"
            style={{
              border: "2px solid rgba(201,168,76,0.25)",
              boxShadow: "0 0 40px rgba(201,168,76,0.08), inset 0 0 40px rgba(201,168,76,0.04)",
            }}
          />
        )}

        {/* Area name */}
        <div className="absolute top-4 left-4 z-10">
          <div className="flex items-center gap-2">
            {isVip && <Crown className="w-4 h-4" style={{ color: "#c9a84c" }} />}
            <span className="text-sm font-semibold" style={{ color: isVip ? "#c9a84c" : "#6b6b6b" }}>
              {selectedArea?.name}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 flex items-center gap-4 z-10">
          {[
            { color: "rgba(201,168,76,0.15)", border: "#c9a84c", label: "Reserviert" },
            { color: "rgba(42,157,92,0.15)",  border: "#2a9d5c", label: "Anwesend" },
            { color: "rgba(204,34,34,0.15)",  border: "#cc2222", label: "Gesperrt" },
            { color: "#1a1a1a",               border: "rgba(201,168,76,0.2)", label: "Frei" },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ background: l.color, border: `1px solid ${l.border}` }} />
              <span className="text-xs" style={{ color: "#6b6b6b" }}>{l.label}</span>
            </div>
          ))}
        </div>

        {/* Tables */}
        <div className="relative" style={{ padding: "60px 80px 80px" }}>
          {areaTablesMap.map(table => (
            <TableShape
              key={table.id}
              table={table}
              reservation={getReservationForTable(table.id)}
              isSelected={selectedTableId === table.id}
              onClick={() => setSelectedTableId(prev => prev === table.id ? null : table.id)}
            />
          ))}
        </div>
      </div>

      {/* Side Panel */}
      {selectedTable && (
        <TableSidePanel
          table={selectedTable}
          area={selectedArea}
          reservations={reservations.filter(r => r.table_id === selectedTable.id)}
          onClose={() => setSelectedTableId(null)}
          onRefresh={fetchAll}
        />
      )}
    </div>
  )
}
