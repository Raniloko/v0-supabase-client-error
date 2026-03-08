"use client"
import React, { createContext, useContext, useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Settings } from "@/lib/types"
import type { SupabaseClient } from "@supabase/supabase-js"

const defaultSettings: Settings = {
  id: "main",
  opening_hours: {
    monday:    { open: "14:00", close: "02:00", enabled: true },
    tuesday:   { open: "14:00", close: "02:00", enabled: true },
    wednesday: { open: "14:00", close: "02:00", enabled: true },
    thursday:  { open: "14:00", close: "02:00", enabled: true },
    friday:    { open: "14:00", close: "03:00", enabled: true },
    saturday:  { open: "12:00", close: "03:00", enabled: true },
    sunday:    { open: "12:00", close: "02:00", enabled: true },
  },
  booking_rules: {
    min_lead_minutes: 30,
    max_duration_minutes: 180,
    default_duration_minutes: 120,
  },
  notification_settings: {
    admin_email_alerts: true,
    manager_email: "manager@rondo-sportsbar.de",
  },
  email_sender: {
    name: "Rondo Sportsbar",
    address: "onboarding@resend.dev",
  },
  updated_at: new Date().toISOString(),
}

// The DB stores settings as key/value rows. This assembles them into our Settings shape.
function assembleSettings(rows: { key: string; value: unknown }[]): Settings {
  const map: Record<string, unknown> = {}
  for (const row of rows) {
    map[row.key] = row.value
  }
  return {
    id: "main",
    opening_hours: (map["opening_hours"] as Settings["opening_hours"]) ?? defaultSettings.opening_hours,
    booking_rules: (map["booking_rules"] as Settings["booking_rules"]) ?? defaultSettings.booking_rules,
    notification_settings: (map["notifications"] as Settings["notification_settings"]) ?? defaultSettings.notification_settings,
    email_sender: (map["email_sender"] as Settings["email_sender"]) ?? defaultSettings.email_sender,
    updated_at: new Date().toISOString(),
  }
}

interface SettingsContextType {
  settings: Settings
  refreshSettings: () => Promise<void>
  updateSettings: (updates: Partial<Settings>) => Promise<void>
}

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  refreshSettings: async () => {},
  updateSettings: async () => {},
})

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const supabaseRef = useRef<SupabaseClient | null>(null)

  const getSupabase = () => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient()
    }
    return supabaseRef.current
  }

  const refreshSettings = async () => {
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase.from("settings").select("key, value")
      if (error) throw error
      if (data && data.length > 0) {
        setSettings(assembleSettings(data))
      }
    } catch (err) {
      console.error("[v0] Failed to load settings:", err)
    }
  }

  const updateSettings = async (updates: Partial<Settings>) => {
    try {
      const supabase = getSupabase()
      const keyMap: Record<string, unknown> = {}
      if (updates.opening_hours)      keyMap["opening_hours"] = updates.opening_hours
      if (updates.booking_rules)      keyMap["booking_rules"] = updates.booking_rules
      if (updates.notification_settings) keyMap["notifications"] = updates.notification_settings
      if (updates.email_sender)       keyMap["email_sender"] = updates.email_sender

      for (const [key, value] of Object.entries(keyMap)) {
        await supabase
          .from("settings")
          .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" })
      }
      await refreshSettings()
    } catch (err) {
      console.error("[v0] Failed to update settings:", err)
    }
  }

  useEffect(() => {
    const supabase = getSupabase()
    refreshSettings()

    const channel = supabase
      .channel("settings-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "settings" }, () => {
        refreshSettings()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return (
    <SettingsContext.Provider value={{ settings, refreshSettings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => useContext(SettingsContext)
