"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { WaitlistEntry, Area } from "@/lib/types"
import { List, Check, Bell } from "lucide-react"
import { useToast } from "@/lib/toast-context"

export default function WartelistePage() {
  const supabase = createClient()
  const { addToast } = useToast()
  const [entries, setEntries] = useState<WaitlistEntry[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = async () => {
    const [{ data: wl }, { data: ar }] = await Promise.all([
      supabase.from("waitlist").select("*, area:areas(*)").order("created_at", { ascending: true }),
      supabase.from("areas").select("*").eq("enabled", true),
    ])
    setEntries((wl as WaitlistEntry[]) || [])
    setAreas((ar as Area[]) || [])
    setLoading(false)
  }

  useEffect(() => { fetch() }, [])

  const markNotified = async (id: string, name: string) => {
    await supabase.from("waitlist").update({ notified: true }).eq("id", id)
    addToast("info", "Benachrichtigt", `${name} wurde benachrichtigt.`)
    fetch()
  }

  const remove = async (id: string, name: string) => {
    await supabase.from("waitlist").delete().eq("id", id)
    addToast("success", "Entfernt", `${name} wurde von der Warteliste entfernt.`)
    fetch()
  }

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold" style={{ color: "#f5f0e8" }}>Warteliste</h2>
        <p className="text-sm mt-1" style={{ color: "#6b6b6b" }}>{entries.filter(e => !e.notified).length} offene Einträge</p>
      </div>
      <div className="glass-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(201,168,76,0.2)", borderTopColor: "#c9a84c" }} />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <List className="w-8 h-8" style={{ color: "#3a3a3a" }} />
            <p className="text-sm" style={{ color: "#6b6b6b" }}>Warteliste ist leer</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(201,168,76,0.06)" }}>
                  {["Name", "Datum / Zeit", "Bereich", "Pers.", "Status", "Aktionen"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-medium" style={{ color: "#6b6b6b" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((e, i) => (
                  <tr key={e.id} style={{ borderBottom: i < entries.length - 1 ? "1px solid rgba(201,168,76,0.04)" : "none" }}>
                    <td className="px-5 py-3.5">
                      <div className="font-medium" style={{ color: "#f5f0e8" }}>{e.guest_name}</div>
                      <div className="text-xs" style={{ color: "#9a9a9a" }}>{e.guest_email || e.guest_phone || ""}</div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs" style={{ color: "#9a9a9a" }}>
                      {e.desired_date} {e.desired_time.slice(0,5)}
                    </td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: "#9a9a9a" }}>{(e.area as any)?.name || e.area_id}</td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: "#9a9a9a" }}>{e.party_size}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs"
                        style={{
                          background: e.notified ? "rgba(42,157,92,0.12)" : "rgba(201,168,76,0.12)",
                          color: e.notified ? "#2a9d5c" : "#c9a84c",
                        }}
                      >
                        {e.notified ? "Benachrichtigt" : "Wartend"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {!e.notified && (
                          <button
                            onClick={() => markNotified(e.id, e.guest_name)}
                            title="Benachrichtigen"
                            className="p-1.5 rounded-lg"
                            style={{ background: "rgba(201,168,76,0.1)", color: "#c9a84c" }}
                          >
                            <Bell className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => remove(e.id, e.guest_name)}
                          title="Entfernen"
                          className="p-1.5 rounded-lg"
                          style={{ background: "rgba(204,34,34,0.1)", color: "#cc2222" }}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
