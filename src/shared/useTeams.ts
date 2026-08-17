/**
 * 隊伍計分 hook
 * Copyright (c) 2026 Scout System. All rights reserved.
 */
import { useCallback, useState } from 'react'

export interface Team {
  name: string
  score: number
}

export const DEFAULT_TEAMS = ['獵鷹小隊', '灰狼小隊', '黑熊小隊']

export function useTeams(initial: string[] = DEFAULT_TEAMS) {
  const [teams, setTeams] = useState<Team[]>(() => initial.map((name) => ({ name, score: 0 })))
  const [active, setActive] = useState(0)

  const addTeam = useCallback((name: string) => {
    const n = name.trim()
    if (!n) return
    setTeams((t) => (t.some((x) => x.name === n) ? t : [...t, { name: n, score: 0 }]))
  }, [])

  const removeTeam = useCallback((name: string) => {
    setTeams((t) => t.filter((x) => x.name !== name))
    setActive(0)
  }, [])

  const score = useCallback((delta: number, index?: number) => {
    setTeams((t) => {
      const i = index ?? 0
      if (!t[i]) return t
      const next = [...t]
      next[i] = { ...next[i], score: Math.max(0, next[i].score + delta) }
      return next
    })
  }, [])

  const nextTurn = useCallback(() => setActive((a) => (teams.length ? (a + 1) % teams.length : 0)), [teams.length])
  const resetScores = useCallback(() => {
    setTeams((t) => t.map((x) => ({ ...x, score: 0 })))
    setActive(0)
  }, [])

  return { teams, setTeams, active, setActive, addTeam, removeTeam, score, nextTurn, resetScores }
}
