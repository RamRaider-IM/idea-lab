import type { AppState, Idea } from './types'

/**
 * Merge two copies of the state from different devices.
 * Ideas are matched by id and the more recently edited copy wins.
 * A deleted idea leaves a tombstone so it does not come back from the other device.
 * Settings come from whichever side was edited last.
 */
export function mergeStates(a: AppState, b: AppState): AppState {
  const tomb: Record<string, string> = { ...a.tombstones }
  for (const [id, t] of Object.entries(b.tombstones)) if (!tomb[id] || t > tomb[id]) tomb[id] = t

  const byId = new Map<string, Idea>()
  for (const i of [...a.ideas, ...b.ideas]) {
    const cur = byId.get(i.id)
    if (!cur || i.updatedAt > cur.updatedAt) byId.set(i.id, i)
  }
  const ideas = [...byId.values()].filter(i => !(tomb[i.id] && tomb[i.id] >= i.updatedAt))
  ideas.sort((x, y) => y.createdAt.localeCompare(x.createdAt))

  const newer = a.updatedAt >= b.updatedAt ? a : b
  return { version: 1, ideas, settings: newer.settings, tombstones: tomb, updatedAt: newer.updatedAt }
}

export const sameState = (a: AppState, b: AppState): boolean =>
  JSON.stringify({ i: a.ideas, s: a.settings, t: a.tombstones }) === JSON.stringify({ i: b.ideas, s: b.settings, t: b.tombstones })
