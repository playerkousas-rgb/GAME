/**
 * 遊戲設定頁共用外殼 — 標題、題庫統計、隊伍設定、開始按鈕
 * Copyright (c) 2026 Scout System. All rights reserved.
 */
import { type ReactNode, useState } from 'react'
import { Play, Plus, X, Users, Volume2, VolumeX } from 'lucide-react'
import type { Team } from '../shared/useTeams'
import Footer from './Footer'

interface Props {
  emoji: string
  title: string
  subtitle: string
  howTo: string[]
  stats: { total: number; easy: number; medium: number; hard: number; categories: number; custom: number }
  teams: Team[]
  onAddTeam: (n: string) => void
  onRemoveTeam: (n: string) => void
  soundOn: boolean
  onSound: (v: boolean) => void
  canStart: boolean
  startLabel?: string
  onStart: () => void
  children: ReactNode
}

export default function SetupShell({
  emoji, title, subtitle, howTo, stats,
  teams, onAddTeam, onRemoveTeam,
  soundOn, onSound, canStart, startLabel = '開始遊戲', onStart, children,
}: Props) {
  const [newTeam, setNewTeam] = useState('')

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#02133e] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#02133e]/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{emoji}</span>
            <div>
              <h1 className="text-sm font-bold leading-tight">{title}</h1>
              <p className="text-[10px] text-white/75">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={() => onSound(!soundOn)}
            className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="音效開關"
          >
            {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 space-y-4 px-4 py-5">
        {/* 題庫統計 */}
        <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
          {[
            { label: '總題數', value: stats.total, color: 'text-white' },
            { label: '初級', value: stats.easy, color: 'text-emerald-300' },
            { label: '中級', value: stats.medium, color: 'text-amber-300' },
            { label: '高級', value: stats.hard, color: 'text-rose-300' },
            { label: '分類', value: stats.categories, color: 'text-indigo-300' },
            { label: '自訂', value: stats.custom, color: 'text-fuchsia-300' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-center">
              <div className={`text-xl font-black tabular-nums ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-white/75">{s.label}</div>
            </div>
          ))}
        </div>

        {/* 玩法 */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <h3 className="mb-2 text-sm font-bold">📖 玩法</h3>
          <ol className="space-y-1 text-xs leading-relaxed text-white/75">
            {howTo.map((h, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-amber-400">{i + 1}.</span>
                <span>{h}</span>
              </li>
            ))}
          </ol>
        </div>

        {children}

        {/* 隊伍 */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold">
            <Users className="h-4 w-4 text-amber-400" /> 隊伍設定
            <span className="text-[10px] font-normal text-white/75">（可選，用於計分）</span>
          </h3>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {teams.map((t) => (
              <span key={t.name} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/25 py-1 pl-3 pr-1.5 text-xs">
                {t.name}
                <button onClick={() => onRemoveTeam(t.name)} className="rounded-full p-0.5 text-white/75 transition hover:bg-rose-500/20 hover:text-rose-300">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {teams.length === 0 && <span className="text-[11px] text-white/75">未設定隊伍 — 將以自由模式進行</span>}
          </div>
          <div className="flex gap-2">
            <input
              value={newTeam}
              onChange={(e) => setNewTeam(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onAddTeam(newTeam)
                  setNewTeam('')
                }
              }}
              placeholder="新增隊伍名稱..."
              className="flex-1 rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-xs outline-none focus:border-amber-400/50"
            />
            <button
              onClick={() => {
                onAddTeam(newTeam)
                setNewTeam('')
              }}
              className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold transition hover:bg-white/15"
            >
              <Plus className="h-3.5 w-3.5" /> 加入
            </button>
          </div>
        </div>

        <button
          onClick={onStart}
          disabled={!canStart}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 py-4 text-lg font-black text-stone-900 shadow-lg shadow-amber-500/20 transition enabled:hover:bg-amber-300 enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Play className="h-5 w-5" />
          {startLabel}
        </button>
        {!canStart && <p className="text-center text-[11px] text-rose-300/70">目前篩選條件下沒有題目，請放寬難度或分類</p>}
      </main>

      <Footer />
    </div>
  )
}
