"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { ActivityLog } from "@/lib/types"
import { Activity, Clock } from "lucide-react"

export default function AktivitaetPage() {
  const supabase = createClient()
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(100)
      .then(({ data }) => { setLogs((data as ActivityLog[]) || []); setLoading(false) })
  }, [])

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold" style={{ color: "#f5f0e8" }}>Aktivitäts-Log</h2>
        <p className="text-sm mt-1" style={{ color: "#6b6b6b" }}>Alle Aktionen des Admin-Teams</p>
      </div>
      <div className="glass-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(201,168,76,0.2)", borderTopColor: "#c9a84c" }} />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Activity className="w-8 h-8" style={{ color: "#3a3a3a" }} />
            <p className="text-sm" style={{ color: "#6b6b6b" }}>Keine Aktivitäten</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "rgba(201,168,76,0.05)" }}>
            {logs.map(log => (
              <div key={log.id} className="flex items-start gap-4 px-5 py-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(201,168,76,0.1)" }}>
                  <Activity className="w-4 h-4" style={{ color: "#c9a84c" }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: "#f5f0e8" }}>{log.action}</p>
                  {log.details && <p className="text-xs mt-0.5" style={{ color: "#9a9a9a" }}>{log.details}</p>}
                  <div className="flex items-center gap-1.5 mt-1">
                    <Clock className="w-3 h-3" style={{ color: "#6b6b6b" }} />
                    <span className="text-xs" style={{ color: "#6b6b6b" }}>
                      {new Date(log.created_at).toLocaleString("de-DE")} · {log.admin_name}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
