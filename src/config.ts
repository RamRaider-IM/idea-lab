// Supabase connection for cross-device sync.
// The publishable key is safe to ship in client code: row-level security on the
// database means it can only ever read or write the signed-in user's own row.
// Override with VITE_SUPABASE_URL / VITE_SUPABASE_KEY in a .env file if needed.
export const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL ?? ''
export const SUPABASE_KEY: string = import.meta.env.VITE_SUPABASE_KEY ?? ''
