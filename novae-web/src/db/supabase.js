import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_NOVAE_SUPABASE_URL ?? import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_NOVAE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY

const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    realtime: {
      params: {
        eventsPerSecond: 12
      }
    }
  })
  : null

export function getSupabase() {
  return Promise.resolve(supabase)
}
