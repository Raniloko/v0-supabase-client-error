"use client"
import React, { createContext, useContext, useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Settings } from "@/lib/types"
import type { SupabaseClient } from "@supabase/supabase-js"

const defaultSettings: Settings = {
  id: "main",
  opening_hours: {
    monday:    { open: "17:00", close: "02:00", enabled: true },
    tuesday:   { open: "17:00", close: "02:00", enabled: true },
    wednesday: { open: "17:00", close: "02:00", enabled: true },
    thursday:  { open: "17:00", close: "02:00", enabled: true },
    friday:    { open: "15:00", close: "03:00", enabled: true },
    saturday:  { open: "15:00", close: "03:00", enabled: true },
    sunday:    { open: "15:00", close: "00:00", enabled: true },
  },
  booking_rules: {
    min_lead_minutes: 60,
    max_duration_minutes: 180,
    default_duration_minutes: 120,
  },
  notification_settings: {
    admin_email_alerts: true,
    manager_email: "",
  },
  email_sender: {
    name: "Rondo Sportsbar",
    address: "onboarding@resend.dev",
  },
  updated_at: new Date().toISOString(),
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
      try {
        supabaseRef.current = createClient()
      } catch (error) {
        console.error("[v0] Failed to create Supabase client:", error)
        throw error
      }
    }
    return supabaseRef.current
  }

  const refreshSettings = async () => {
    const supabase = getSupabase()
    const { data } = await supabase.from("settings").select("*").eq("id", "main").single()
    if (data) setSettings(data as Settings)
  }

  const updateSettings = async (updates: Partial<Settings>) => {
    const supabase = getSupabase()
    const merged = { ...settings, ...updates, updated_at: new Date().toISOString() }
    const { data } = await supabase
      .from("settings")
      .upsert({ id: "main", ...merged })
      .select()
      .single()
    if (data) setSettings(data as Settings)
  }

  useEffect(() => {
    const supabase = getSupabase()
    refreshSettings()

    const channel = supabase
      .channel("settings-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "settings" }, (payload) => {
        if (payload.new) setSettings(payload.new as Settings)
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
