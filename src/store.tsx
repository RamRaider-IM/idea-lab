import { createContext, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react'
import { DEFAULT_SETTINGS, newIdea, type AppState, type Idea, type Settings } from './types'

const KEY = 'idea-lab-v1'
const THEME_KEY = 'idea-lab-theme'

type Action =
  | { type: 'add'; idea: Idea }
  | { type: 'update'; id: string; fn: (i: Idea) => Idea }
  | { type: 'delete'; id: string }
  | { type: 'settings'; patch: Partial<Settings> }
  | { type: 'replace'; state: AppState }

function reducer(state: AppState, a: Action): AppState {
  switch (a.type) {
    case 'add': return { ...state, ideas: [a.idea, ...state.ideas] }
    case 'update': return { ...state, ideas: state.ideas.map(i => (i.id === a.id ? { ...a.fn(i), updatedAt: new Date().toISOString() } : i)) }
    case 'delete': return { ...state, ideas: state.ideas.filter(i => i.id !== a.id) }
    case 'settings': return { ...state, settings: { ...state.settings, ...a.patch, gates: { ...state.settings.gates, ...(a.patch.gates ?? {}) } } }
    case 'replace': return a.state
  }
}

export function isAppState(x: unknown): x is AppState {
  if (!x || typeof x !== 'object') return false
  const s = x as Partial<AppState>
  return Array.isArray(s.ideas) && typeof s.settings === 'object'
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (isAppState(parsed)) {
        return { version: 1, ideas: parsed.ideas, settings: { ...DEFAULT_SETTINGS, ...parsed.settings, gates: { ...DEFAULT_SETTINGS.gates, ...parsed.settings.gates } } }
      }
    }
  } catch { /* fall through to a fresh state */ }
  return { version: 1, ideas: [], settings: DEFAULT_SETTINGS }
}

interface Store {
  state: AppState
  addIdea: (name: string, oneLiner?: string) => Idea
  updateIdea: (id: string, fn: (i: Idea) => Idea) => void
  deleteIdea: (id: string) => void
  updateSettings: (patch: Partial<Settings>) => void
  replaceState: (s: AppState) => void
  theme: 'light' | 'dark' | 'system'
  setTheme: (t: 'light' | 'dark' | 'system') => void
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load)
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>(() => {
    try { return (localStorage.getItem(THEME_KEY) as 'light' | 'dark' | 'system') || 'system' } catch { return 'system' }
  })

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* storage unavailable */ }
  }, [state])

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', theme)
    try { localStorage.setItem(THEME_KEY, theme) } catch { /* ignore */ }
  }, [theme])

  const store = useMemo<Store>(() => ({
    state,
    addIdea: (name, oneLiner = '') => { const idea = newIdea(name, oneLiner); dispatch({ type: 'add', idea }); return idea },
    updateIdea: (id, fn) => dispatch({ type: 'update', id, fn }),
    deleteIdea: id => dispatch({ type: 'delete', id }),
    updateSettings: patch => dispatch({ type: 'settings', patch }),
    replaceState: s => dispatch({ type: 'replace', state: s }),
    theme,
    setTheme: setThemeState,
  }), [state, theme])

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

export function useStore(): Store {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore outside StoreProvider')
  return s
}

/** Returns a setter bound to one idea, taking a partial-updater on the idea. */
export function useIdeaUpdater(id: string) {
  const { updateIdea } = useStore()
  return (fn: (i: Idea) => Partial<Idea>) => updateIdea(id, i => ({ ...i, ...fn(i) }))
}
