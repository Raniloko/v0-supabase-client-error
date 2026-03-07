"use client"
import { useState } from "react"
import { useSettings } from "@/lib/settings-context"
import { Clock, BookOpen, Bell, Mail, Save } from "lucide-react"
import { useToast } from "@/lib/toast-context"

const WEEKDAYS = [
  { key: "monday",    label: "Montag" },
  { key: "tuesday",   label: "Dienstag" },
  { key: "wednesday", label: "Mittwoch" },
  { key: "thursday",  label: "Donnerstag" },
  { key: "friday",    label: "Freitag" },
  { key: "saturday",  label: "Samstag" },
  { key: "sunday",    label: "Sonntag" },
]

export default function EinstellungenPage() {
  const { settings, updateSettings } = useSettings()
  const { addToast } = useToast()
  const [saving, setSaving] = useState(false)
  const [local, setLocal] = useState(settings)
  const [activeTab, setActiveTab] = useState<"oeffnungszeiten" | "buchungsregeln" | "benachrichtigungen" | "email">("oeffnungszeiten")

  const save = async () => {
    setSaving(true)
    await updateSettings(local)
    setSaving(false)
    addToast("success", "Einstellungen gespeichert", "Alle Änderungen wurden übernommen.")
  }

  const tabs = [
    { key: "oeffnungszeiten",    icon: Clock,    label: "Öffnungszeiten" },
    { key: "buchungsregeln",     icon: BookOpen, label: "Buchungsregeln" },
    { key: "benachrichtigungen", icon: Bell,     label: "Benachrichtigungen" },
    { key: "email",              icon: Mail,     label: "E-Mail Sender" },
  ] as const

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold" style={{ color: "#f5f0e8" }}>Einstellungen</h2>
        <p className="text-sm mt-1" style={{ color: "#6b6b6b" }}>Änderungen werden sofort im gesamten Dashboard übernommen.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1" style={{ borderBottom: "1px solid rgba(201,168,76,0.08)" }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all relative"
            style={{ color: activeTab === t.key ? "#c9a84c" : "#6b6b6b" }}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            {activeTab === t.key && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full" style={{ background: "#c9a84c" }} />
            )}
          </button>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-6">
        {/* Öffnungszeiten */}
        {activeTab === "oeffnungszeiten" && (
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold mb-2" style={{ color: "#f5f0e8" }}>Öffnungszeiten</h3>
            {WEEKDAYS.map(day => {
              const entry = local.opening_hours[day.key] || { open: "17:00", close: "02:00", enabled: true }
              return (
                <div key={day.key} className="flex items-center gap-4">
                  <div className="w-24 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={entry.enabled}
                      onChange={e => setLocal(prev => ({
                        ...prev,
                        opening_hours: { ...prev.opening_hours, [day.key]: { ...entry, enabled: e.target.checked } }
                      }))}
                      className="w-4 h-4 accent-[#c9a84c]"
                    />
                    <span className="text-sm" style={{ color: entry.enabled ? "#f5f0e8" : "#6b6b6b" }}>{day.label}</span>
                  </div>
                  {entry.enabled ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="time"
                        value={entry.open}
                        onChange={e => setLocal(prev => ({
                          ...prev,
                          opening_hours: { ...prev.opening_hours, [day.key]: { ...entry, open: e.target.value } }
                        }))}
                        className="rounded-lg px-3 py-1.5 text-sm outline-none"
                        style={{ background: "#111111", border: "1px solid rgba(201,168,76,0.15)", color: "#f5f0e8" }}
                      />
                      <span className="text-sm" style={{ color: "#6b6b6b" }}>bis</span>
                      <input
                        type="time"
                        value={entry.close}
                        onChange={e => setLocal(prev => ({
                          ...prev,
                          opening_hours: { ...prev.opening_hours, [day.key]: { ...entry, close: e.target.value } }
                        }))}
                        className="rounded-lg px-3 py-1.5 text-sm outline-none"
                        style={{ background: "#111111", border: "1px solid rgba(201,168,76,0.15)", color: "#f5f0e8" }}
                      />
                    </div>
                  ) : (
                    <span className="text-sm" style={{ color: "#3a3a3a" }}>Geschlossen</span>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Buchungsregeln */}
        {activeTab === "buchungsregeln" && (
          <div className="flex flex-col gap-5">
            <h3 className="text-sm font-semibold mb-2" style={{ color: "#f5f0e8" }}>Buchungsregeln</h3>
            {[
              { label: "Mindestvorlaufzeit (Min.)", key: "min_lead_minutes" as const, min: 0, max: 1440 },
              { label: "Maximale Dauer (Min.)", key: "max_duration_minutes" as const, min: 30, max: 480 },
              { label: "Standard-Dauer (Min.)", key: "default_duration_minutes" as const, min: 30, max: 480 },
            ].map(field => (
              <div key={field.key}>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: "#9a9a9a" }}>{field.label}</label>
                <input
                  type="number"
                  min={field.min}
                  max={field.max}
                  value={local.booking_rules[field.key]}
                  onChange={e => setLocal(prev => ({
                    ...prev,
                    booking_rules: { ...prev.booking_rules, [field.key]: Number(e.target.value) }
                  }))}
                  className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
                  style={{ background: "#111111", border: "1px solid rgba(201,168,76,0.15)", color: "#f5f0e8" }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Benachrichtigungen */}
        {activeTab === "benachrichtigungen" && (
          <div className="flex flex-col gap-5">
            <h3 className="text-sm font-semibold mb-2" style={{ color: "#f5f0e8" }}>Benachrichtigungen</h3>
            <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid rgba(201,168,76,0.06)" }}>
              <div>
                <p className="text-sm font-medium" style={{ color: "#f5f0e8" }}>Admin E-Mail Benachrichtigungen</p>
                <p className="text-xs mt-0.5" style={{ color: "#6b6b6b" }}>Neue Reservierungen und Stornierungen per E-Mail</p>
              </div>
              <input
                type="checkbox"
                checked={local.notification_settings.admin_email_alerts}
                onChange={e => setLocal(prev => ({
                  ...prev,
                  notification_settings: { ...prev.notification_settings, admin_email_alerts: e.target.checked }
                }))}
                className="w-5 h-5 accent-[#c9a84c]"
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "#9a9a9a" }}>Manager E-Mail</label>
              <input
                type="email"
                value={local.notification_settings.manager_email}
                onChange={e => setLocal(prev => ({
                  ...prev,
                  notification_settings: { ...prev.notification_settings, manager_email: e.target.value }
                }))}
                placeholder="manager@rondo-hanau.de"
                className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
                style={{ background: "#111111", border: "1px solid rgba(201,168,76,0.15)", color: "#f5f0e8" }}
              />
            </div>
          </div>
        )}

        {/* E-Mail Sender */}
        {activeTab === "email" && (
          <div className="flex flex-col gap-5">
            <h3 className="text-sm font-semibold mb-2" style={{ color: "#f5f0e8" }}>E-Mail Sender</h3>
            <div
              className="rounded-xl px-4 py-3 text-sm"
              style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)", color: "#9a9a9a" }}
            >
              Aktuell wird die verifizierte Resend-Adresse verwendet. Sobald die offizielle Rondo-Adresse in Resend verifiziert ist, kann sie hier eingetragen werden.
            </div>
            {[
              { label: "Absender-Name", key: "name" as const, placeholder: "Rondo Sportsbar" },
              { label: "Absender-Adresse", key: "address" as const, placeholder: "onboarding@resend.dev" },
            ].map(field => (
              <div key={field.key}>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: "#9a9a9a" }}>{field.label}</label>
                <input
                  type={field.key === "address" ? "email" : "text"}
                  value={local.email_sender[field.key]}
                  onChange={e => setLocal(prev => ({
                    ...prev,
                    email_sender: { ...prev.email_sender, [field.key]: e.target.value }
                  }))}
                  placeholder={field.placeholder}
                  className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
                  style={{ background: "#111111", border: "1px solid rgba(201,168,76,0.15)", color: "#f5f0e8" }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold self-start transition-all hover:scale-105 disabled:opacity-60"
        style={{ background: "#c9a84c", color: "#0a0a0a", boxShadow: "0 0 20px rgba(201,168,76,0.2)" }}
      >
        <Save className="w-4 h-4" />
        {saving ? "Speichern..." : "Einstellungen speichern"}
      </button>
    </div>
  )
}
