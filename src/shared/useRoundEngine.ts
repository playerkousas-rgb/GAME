/**
 * 回合引擎 — 題目佇列、倒數計時、計分（三個新遊戲共用）
 * Copyright (c) 2026 Scout System. All rights reserved.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Question } from './questionBank'
import { GameSound } from './gameSound'

export type RoundPhase = 'setup' | 'countdown' | 'playing' | 'summary'
export type RoundOutcome = 'correct' | 'pass' | 'timeout'

export interface RoundLog {
  question: Question
  outcome: RoundOutcome
  team?: string
  secondsUsed: number
}

interface Options {
  /** 每題秒數；0 = 不限時 */
  seconds: number
  /** 開場倒數秒數 */
  countdownFrom?: number
  onTimeout?: () => void
}

export function useRoundEngine({ seconds, countdownFrom = 3, onTimeout }: Options) {
  const [phase, setPhase] = useState<RoundPhase>('setup')
  const [queue, setQueue] = useState<Question[]>([])
  const [idx, setIdx] = useState(0)
  const [remaining, setRemaining] = useState(seconds)
  const [countdown, setCountdown] = useState(countdownFrom)
  const [log, setLog] = useState<RoundLog[]>([])
  const [paused, setPaused] = useState(false)
  const timeoutCb = useRef(onTimeout)
  useEffect(() => {
    timeoutCb.current = onTimeout
  }, [onTimeout])

  const current: Question | undefined = queue[idx]

  /* 開場倒數：所有狀態轉換都在 timeout 回呼內進行，避免 effect 內同步 setState */
  useEffect(() => {
    if (phase !== 'countdown') return
    if (countdown > 0) GameSound.countdown()
    const t = setTimeout(
      () => {
        if (countdown <= 0) {
          setPhase('playing')
          setRemaining(seconds)
          GameSound.start()
        } else {
          setCountdown((c) => c - 1)
        }
      },
      countdown <= 0 ? 450 : 800,
    )
    return () => clearTimeout(t)
  }, [phase, countdown, seconds])

  /* 每題倒數 */
  useEffect(() => {
    if (phase !== 'playing' || paused || seconds <= 0) return
    if (remaining <= 0) {
      // 交由下一個 tick 處理，避免在 effect 內同步觸發父層 setState
      const t = setTimeout(() => {
        GameSound.timeUp()
        timeoutCb.current?.()
      }, 0)
      return () => clearTimeout(t)
    }
    if (remaining <= 5) GameSound.urgent()
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, paused, remaining, seconds])

  const begin = useCallback(
    (questions: Question[]) => {
      setQueue(questions)
      setIdx(0)
      setLog([])
      setRemaining(seconds)
      setCountdown(countdownFrom)
      setPaused(false)
      setPhase(countdownFrom > 0 ? 'countdown' : 'playing')
      if (countdownFrom <= 0) GameSound.start()
    },
    [seconds, countdownFrom],
  )

  /** 記錄結果並前往下一題；回傳是否仍有題目 */
  const advance = useCallback(
    (outcome: RoundOutcome, team?: string) => {
      const q = queue[idx]
      if (q) {
        setLog((l) => [...l, { question: q, outcome, team, secondsUsed: Math.max(0, seconds - remaining) }])
      }
      if (idx + 1 >= queue.length) {
        setPhase('summary')
        GameSound.victory()
        return false
      }
      setIdx((i) => i + 1)
      setRemaining(seconds)
      return true
    },
    [queue, idx, seconds, remaining],
  )

  const addTime = useCallback((delta: number) => setRemaining((r) => Math.max(0, r + delta)), [])
  const reset = useCallback(() => {
    setPhase('setup')
    setQueue([])
    setIdx(0)
    setLog([])
  }, [])

  const stats = {
    correct: log.filter((l) => l.outcome === 'correct').length,
    pass: log.filter((l) => l.outcome === 'pass').length,
    timeout: log.filter((l) => l.outcome === 'timeout').length,
    total: queue.length,
    done: log.length,
  }

  return {
    phase, setPhase,
    queue, idx, current,
    remaining, setRemaining, countdown,
    log, stats,
    paused, setPaused,
    begin, advance, addTime, reset,
  }
}
