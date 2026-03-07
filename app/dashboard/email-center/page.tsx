"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { EmailLog } from "@/lib/types"
import { Mail, CheckCircle, XCircle } from "lucide-react"

const TYPE_LABELS: Record<string, string> = {
  confirmation: "Bestätigung",
  cancellation: "Stornierung",
  waitlist: "Warteliste",
  reminder: "Erinnerung",
}

export default function EmailCenterPage() {
  const supabase = createClient()
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from("email_log").select("*").order("sent_at", { ascending: false }).limit(50)
      .then(({ data }) => { setLogs((data as EmailLog[]) || []); setLoading(false) })
  }, [])

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold" style={{ color: "#f5f0e8" }}>E-Mail Center</h2>
        <p className="text-sm mt-1" style={{ color: "#6b6b6b" }}>Verlauf aller versendeten E-Mails via Resend</p>
      </div>
      <div className="glass-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(201,168,76,0.2)", borderTopColor: "#c9a84c" }} />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Mail className="w-8 h-8" style={{ color: "#3a3a3a" }} />
            <p className="text-sm" style={{ color: "#6b6b6b" }}>Keine E-Mails versendet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(201,168,76,0.06)" }}>
                  {["Gast", "E-Mail", "Typ", "Status", "Gesendet am"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-medium" style={{ color: "#6b6b6b" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={log.id} style={{ borderBottom: i < logs.length - 1 ? "1px solid rgba(201,168,76,0.04)" : "none" }}>
                    <td className="px-5 py-3.5 font-medium" style={{ color: "#f5f0e8" }}>{log.guest_name || "–"}</td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: "#9a9a9a" }}>{log.guest_email}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: "rgba(201,168,76,0.1)", color: "#c9a84c" }}>
                        {TYPE_LABELS[log.email_type] || log.email_type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {log.status === "sent"
                          ? <CheckCircle className="w-4 h-4" style={{ color: "#2a9d5c" }} />
                          : <XCircle className="w-4 h-4" style={{ color: "#cc2222" }} />}
                        <span className="text-xs" style={{ color: log.status === "sent" ? "#2a9d5c" : "#cc2222" }}>
                          {log.status === "sent" ? "Gesendet" : "Fehler"}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-mono" style={{ color: "#9a9a9a" }}>
                      {new Date(log.sent_at).toLocaleString("de-DE")}
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
