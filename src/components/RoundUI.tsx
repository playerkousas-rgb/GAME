/**
 * 回合共用介面 — 倒數環、開場倒數、結算畫面、隊伍計分列
 * Copyright (c) 2026 Scout System. All rights reserved.
 */
import { Trophy, RotateCcw, Home as HomeIcon, Check, SkipForward, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { RoundLog } from '../shared/useRoundEngine'
import { DIFFICULTY_META } from '../shared/questionBank'

/* ---------- 倒數環 ---------- */
export function TimerRing({
  remaining,
  total,
  size = 96,
}: {
  remaining: number
  total: number
  size?: number
}) {
  if (total <= 0) {
    return (
      <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm text-white/50">
        <Clock className="h-4 w-4" /> 手動
      </div>
    )
  }
  const pct = Math.max(0, Math.min(1, remaining / total))
  const r = size / 2 - 6
  const c = 2 * Math.PI * r
  const urgent = remaining <= 5
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={6} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={urgent ? '#f43f5e' : pct > 0.35 ? '#fbbf24' : '#fb923c'}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 0.95s linear, stroke 0.3s' }}
        />
      </svg>
      <div className={`absolute font-black tabular-nums ${urgent ? 'animate-pulse text-rose-300' : 'text-white'}`}
           style={{ fontSize: size * 0.32 }}>
        {remaining}
      </div>
    </div>
  )
}

/* ---------- 開場倒數 ---------- */
export function CountdownScreen({ n }: { n: number }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#02133e]">
      <div key={n} className="animate-[ping_0.8s_ease-out] text-center">
        <div className="text-[10rem] font-black leading-none text-amber-400">{n > 0 ? n : 'GO!'}</div>
      </div>
    </div>
  )
}

/* ---------- 大按鈕（答對／跳過） ---------- */
export function ActionButtons({
  onCorrect,
  onPass,
  correctLabel = '答對了！',
  passLabel = '跳過',
}: {
  onCorrect: () => void
  onPass: () => void
  correctLabel?: string
  passLabel?: string
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        onClick={onCorrect}
        className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-5 text-lg font-black text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 active:scale-[0.97]"
      >
        <Check className="h-6 w-6" />
        {correctLabel}
      </button>
      <button
        onClick={onPass}
        className="flex items-center justify-center gap-2 rounded-2xl bg-white/10 py-5 text-lg font-black text-white/70 transition hover:bg-white/15 active:scale-[0.97]"
      >
        <SkipForward className="h-6 w-6" />
        {passLabel}
      </button>
    </div>
  )
}

/* ---------- 結算 ---------- */
export function SummaryScreen({
  log,
  onReplay,
  onSetup,
  teams,
}: {
  log: RoundLog[]
  onReplay: () => void
  onSetup: () => void
  teams?: { name: string; score: number }[]
}) {
  const correct = log.filter((l) => l.outcome === 'correct').length
  const rate = log.length ? Math.round((correct / log.length) * 100) : 0
  const rank = rate >= 90 ? '🏆 卓越' : rate >= 70 ? '🥇 優秀' : rate >= 50 ? '🥈 良好' : rate >= 30 ? '🥉 及格' : '💪 再接再厲'

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="rounded-3xl border border-amber-400/20 bg-gradient-to-b from-amber-400/10 to-transparent p-6 text-center">
        <Trophy className="mx-auto mb-2 h-12 w-12 text-amber-400" />
        <h2 className="text-2xl font-black">遊戲結束</h2>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-black/25 p-3">
            <div className="text-2xl font-black text-emerald-300">{correct}</div>
            <div className="text-[11px] text-white/40">答對</div>
          </div>
          <div className="rounded-xl bg-black/25 p-3">
            <div className="text-2xl font-black text-white/70">{log.length}</div>
            <div className="text-[11px] text-white/40">總題數</div>
          </div>
          <div className="rounded-xl bg-black/25 p-3">
            <div className="text-2xl font-black text-amber-300">{rate}%</div>
            <div className="text-[11px] text-white/40">命中率</div>
          </div>
        </div>
        <div className="mt-3 text-lg font-bold text-amber-200">{rank}</div>
      </div>

      {teams && teams.length > 0 && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <h3 className="mb-2 text-sm font-bold">🏅 隊伍得分</h3>
          <div className="space-y-1.5">
            {[...teams].sort((a, b) => b.score - a.score).map((t, i) => (
              <div key={t.name} className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${i === 0 ? 'bg-amber-400/15' : 'bg-black/20'}`}>
                <span className="flex items-center gap-2">
                  <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold ${i === 0 ? 'bg-amber-400 text-stone-900' : 'bg-white/10'}`}>{i + 1}</span>
                  {t.name}
                </span>
                <span className="font-black text-amber-300">{t.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <h3 className="mb-2 text-sm font-bold">📋 題目回顧</h3>
        <div className="max-h-72 space-y-1 overflow-y-auto pr-1">
          {log.map((l, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg bg-black/20 px-3 py-2 text-sm">
              <span className={l.outcome === 'correct' ? 'text-emerald-400' : l.outcome === 'pass' ? 'text-white/30' : 'text-rose-400'}>
                {l.outcome === 'correct' ? '✓' : l.outcome === 'pass' ? '⤼' : '✗'}
              </span>
              {l.question.emoji && <span className="text-base">{l.question.emoji}</span>}
              <span className="font-medium">{l.question.answer}</span>
              <span className="text-[10px] text-white/25">{l.question.category}</span>
              <span className={`ml-auto text-[10px] ${DIFFICULTY_META[l.question.level].color}`}>
                {DIFFICULTY_META[l.question.level].short}
              </span>
              {l.team && <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px]">{l.team}</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <button onClick={onReplay} className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-400 py-3 text-sm font-bold text-stone-900 transition hover:bg-amber-300">
          <RotateCcw className="h-4 w-4" /> 再玩一次
        </button>
        <button onClick={onSetup} className="rounded-xl bg-white/10 py-3 text-sm font-semibold text-white/70 transition hover:bg-white/15">
          重新設定
        </button>
        <Link to="/" className="flex items-center justify-center gap-1.5 rounded-xl bg-white/5 py-3 text-sm text-white/50 transition hover:bg-white/10">
          <HomeIcon className="h-4 w-4" /> 主頁
        </Link>
      </div>
    </div>
  )
}

/* ---------- 隊伍計分列 ---------- */
export function TeamBar({
  teams,
  active,
  onActive,
}: {
  teams: { name: string; score: number }[]
  active: number
  onActive: (i: number) => void
}) {
  if (teams.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2">
      {teams.map((t, i) => (
        <button
          key={t.name}
          onClick={() => onActive(i)}
          className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
            i === active
              ? 'border-amber-400/60 bg-amber-400/15 text-amber-100'
              : 'border-white/10 bg-black/20 text-white/45 hover:text-white/70'
          }`}
        >
          <span className="font-medium">{t.name}</span>
          <span className="rounded-full bg-black/30 px-2 py-0.5 text-xs font-black tabular-nums">{t.score}</span>
        </button>
      ))}
    </div>
  )
}
