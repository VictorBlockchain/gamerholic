// @ts-ignore
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Supabase client singleton for client/server usage
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let supabaseInstance: SupabaseClient | null = null

export const supabase: SupabaseClient = (() => {
  if (supabaseInstance) return supabaseInstance
  if (!url || !anonKey) {
    console.warn(
      'Supabase environment variables are missing: NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_ANON_KEY',
    )
  }
  supabaseInstance = createClient(url ?? '', anonKey ?? '', {
    auth: { persistSession: true, autoRefreshToken: true },
  })
  return supabaseInstance
})()