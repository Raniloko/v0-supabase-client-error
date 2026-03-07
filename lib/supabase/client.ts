"use client"
import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

  // Return the client even with empty credentials - validation will happen at runtime when actually used
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
