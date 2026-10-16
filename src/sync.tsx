import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js'
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { SUPABASE_URL, SUPABASE_KEY } from './config'
import { useStore, normalise } from './store'
import { mergeStates, sameState } from './merge'
import type { AppState } from './types'

const TABLE = 'idea_lab_state'

export const supabase: SupabaseClient | null = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null

export type SyncStatus = 'off' | 'signed-out' | 'syncing' | 'synced' | 'error'

interface Sync {
  enabled: boolean
  session: Session | null
  status: SyncStatus
  lastSyncedAt: string | null
  error: string
  signIn: (email: string) => Promise<string>
  signOut: () => Promise<void>
  syncNow: () => Promise<void>
}

const Ctx = createContext<Sync | null>(null)

/**
 * Keeps the local store and the user's row in Supabase in step.
 * - On sign-in: pull the remote row, merge with local, push the merge back if it adds anything.
 * - On local change: push after a short debounce.
 * - On a change from another device (realtime): merge it in.
 * Everything still works offline and signed out; sync is a layer on top of localStorage.
 */
export function SyncProvider({ children }: { children: ReactNode }) {
  const { state, replaceState } = useStore()
  const [session, setSession] = useState<Session | null>(null)
  const [status, setStatus] = useState<SyncStatus>(supabase ? 'signed-out' : 'off')
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
  const [error, setError] = useState('')
  const stateRef = useRef(state)
  stateRef.current = state
  const stamp = useRef('')          // state.updatedAt last pushed or pulled
  const readyFor = useRef('')       // user id whose first pull has completed
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const push = useCallback(async (s: AppState, userId: string): Promise<boolean> => {
    if (!supabase) return false
    setStatus('syncing')
    const { error: e } = await supabase.from(TABLE).upsert({ user_id: userId, state: s, updated_at: s.updatedAt })
    if (e) { setStatus('error'); setError(e.message); return false }
    stamp.current = s.updatedAt
    setLastSyncedAt(new Date().toISOString()); setStatus('synced'); setError('')
    return true
  }, [])

  const pull = useCallback(async (userId: string) => {
    if (!supabase) return
    setStatus('syncing')
    const { data, error: e } = await supabase.from(TABLE).select('state').eq('user_id', userId).maybeSingle()
    if (e) { setStatus('error'); setError(e.message); return }
    const local = stateRef.current
    if (!data) { readyFor.current = userId; await push(local, userId); return }
    const remote = normalise(data.state as Partial<AppState>)
    const merged = mergeStates(local, remote)
    stamp.current = merged.updatedAt
    readyFor.current = userId
    if (!sameState(merged, local)) replaceState(merged)
    if (!sameState(merged, remote)) await push(merged, userId)
    else { setLastSyncedAt(new Date().toISOString()); setStatus('synced'); setError('') }
  }, [push, replaceState])

  // First pull + realtime subscription, per signed-in user.
  const userId = session?.user.id ?? ''
  useEffect(() => {
    if (!supabase || !userId) { readyFor.current = ''; setStatus(supabase ? 'signed-out' : 'off'); return }
    void pull(userId)
    const channel = supabase
      .channel(`${TABLE}:${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLE, filter: `user_id=eq.${userId}` }, payload => {
        const row = payload.new as { state?: Partial<AppState> } | null
        if (!row?.state) return
        const remote = normalise(row.state)
        if (remote.updatedAt === stamp.current) return // our own write echoed back
        const merged = mergeStates(stateRef.current, remote)
        stamp.current = merged.updatedAt
        if (!sameState(merged, stateRef.current)) replaceState(merged)
        if (!sameState(merged, remote)) void push(merged, userId)
        else setLastSyncedAt(new Date().toISOString())
      })
      .subscribe()
    return () => { void supabase?.removeChannel(channel) }
  }, [userId, pull, push, replaceState])

  // Debounced push of local edits.
  useEffect(() => {
    if (!supabase || !userId || readyFor.current !== userId) return
    if (state.updatedAt === stamp.current) return
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => { void push(stateRef.current, userId) }, 800)
    return () => window.clearTimeout(timer.current)
  }, [state, userId, push])

  const signIn = useCallback(async (email: string): Promise<string> => {
    if (!supabase) return 'Sync is not configured.'
    const redirect = window.location.origin + window.location.pathname
    const { error: e } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirect } })
    return e ? e.message : ''
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    window.clearTimeout(timer.current)
    await supabase.auth.signOut()
    stamp.current = ''; readyFor.current = ''
  }, [])

  const syncNow = useCallback(async () => { if (userId) await pull(userId) }, [userId, pull])

  return <Ctx.Provider value={{ enabled: !!supabase, session, status, lastSyncedAt, error, signIn, signOut, syncNow }}>{children}</Ctx.Provider>
}

export function useSync(): Sync {
  const s = useContext(Ctx)
  if (!s) throw new Error('useSync outside SyncProvider')
  return s
}
