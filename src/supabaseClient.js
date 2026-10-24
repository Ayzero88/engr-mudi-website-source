import { createClient } from '@supabase/supabase-js'

// No secrets are stored in this file. The URL and anon key come only
// from environment variables set at deploy time (see README.md).
// The anon key is safe to expose: Row Level Security on every table
// allows public reads but restricts all writes to logged-in users.
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey)
  : null
