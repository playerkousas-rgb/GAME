/**
 * 遊戲設定頁共用外殼 — 頁首、題庫統計、玩法、隊伍設定、開始按鈕
 * Copyright (c) 2026 Scout System. All rights reserved.
 */
import { type ReactNode, useState } from 'react'
import { Play, Plus, X, Users } from 'lucide-react'
import type { Team } from '../shared/useTeams'
import Footer from './Footer'
import { PageHeader, SoundToggle, ThemeToggle, Section, Collapsible, StatBox, StartButton } from './ui'

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

  const addTeam = () => {
    if (!newTeam.trim()) return
    onAddTeam(newTeam.trim())
    setNewTeam('')
  }

  return (
    <div className="ss-page flex flex-col">
      <PageHeader
        emoji={emoji}
        title={title}
        subtitle={subtitle}
        actions={
          <>
            <SoundToggle on={soundOn} onToggle={onSound} />
            <ThemeToggle />
          </>
        }
      />

      <main className="mx-auto w-full max-w-5xl flex-1 space-y-4 px-4 py-5">
        {/* 題庫統計 */}
        <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
          <StatBox label="總題數" value={stats.total} />
          <StatBox label="初級" value={stats.easy} tone="emerald" />
          <StatBox label="中級" value={stats.medium} tone="amber" />
          <StatBox label="高級" value={stats.hard} tone="rose" />
          <StatBox label="分類" value={stats.categories} tone="indigo" />
          <StatBox label="自訂" value={stats.custom} tone="fuchsia" />
        </div>

        {/* 玩法（可折疊，手機省空間） */}
        <Collapsible title={<><span className="accent-text">📖</span> 玩法</>}>
          <ol className="space-y-1.5 text-xs leading-relaxed muted">
            {howTo.map((h, i) => (
              <li key={i} className="flex gap-2">
                <span className="accent-text font-bold">{i + 1}.</span>
                <span>{h}</span>
              </li>
            ))}
          </ol>
        </Collapsible>

        {children}

        {/* 隊伍 */}
        <Section icon={<Users className="h-4 w-4" />} title="隊伍設定" hint="可選，用於小隊計分">
          <div className="mb-2.5 flex flex-wrap gap-1.5">
            {teams.map((t) => (
              <span key={t.name} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/25 py-1 pl-3 pr-1.5 text-xs">
                {t.name}
                <button
                  onClick={() => onRemoveTeam(t.name)}
                  className="rounded-full p-1 muted-2 transition hover:bg-rose-500/20 hover:text-rose-300"
                  aria-label={`移除隊伍 ${t.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {teams.length === 0 && <span className="text-[11px] muted-2">未設定隊伍 — 將以自由模式進行</span>}
          </div>
          <div className="flex gap-2">
            <input
              value={newTeam}
              onChange={(e) => setNewTeam(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTeam()}
              placeholder="新增隊伍名稱..."
              className="input"
            />
            <button onClick={addTeam} className="btn-ghost shrink-0 px-3.5" type="button">
              <Plus className="h-4 w-4" /> 加入
            </button>
          </div>
        </Section>

        {/* 開始（底部吸附，手機好撳） */}
        <StartButton onClick={onStart} disabled={!canStart} sticky>
          <Play className="h-5 w-5" />
          {startLabel}
        </StartButton>
        {!canStart && (
          <p className="pb-2 text-center text-[11px] text-rose-300/80">目前篩選條件下沒有題目，請放寬難度或分類</p>
        )}
      </main>

      <Footer />
    </div>
  )
}
