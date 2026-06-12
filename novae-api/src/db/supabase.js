import { createClient } from '@supabase/supabase-js'

const { NOVAE_SUPABASE_URL, NOVAE_SUPABASE_KEY } = process.env

if (!NOVAE_SUPABASE_URL || !NOVAE_SUPABASE_KEY) {
  throw new Error('NOVAE_SUPABASE_URL and NOVAE_SUPABASE_KEY are required')
}

// This client must only be imported by server-side code.
export const supabase = createClient(NOVAE_SUPABASE_URL, NOVAE_SUPABASE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})
