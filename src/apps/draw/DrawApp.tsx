/**
 * 猜猜畫畫 — 一人看題作畫，其他人猜
 * Copyright (c) 2026 Scout System. All rights reserved.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Eye, EyeOff, Pause, Plus, Minus, Maximize2, Minimize2, Lightbulb } from 'lucide-react'
import DrawCanvas from './DrawCanvas'
import QuestionManager from '../../components/QuestionManager'
import BankFilters from '../../components/BankFilters'
import SetupShell from '../../components/SetupShell'
import { TimerRing, CountdownScreen, ActionButtons, SummaryScreen, TeamBar } from '../../components/RoundUI'
import { DRAW_BANK } from '../../data/drawBank'
import { useQuestionBank } from '../../shared/useQuestionBank'
import { useRoundEngine } from '../../shared/useRoundEngine'
import { useTeams } from '../../shared/useTeams'
import { GameSound } from '../../shared/gameSound'
import { DIFFICULTY_META, type QDifficulty } from '../../shared/questionBank'
import { COPYRIGHT_UPPER } from '../../shared/brand'

const TIME_OPTIONS = [60, 90, 120, 180, 0]
const COUNT_OPTIONS = [5, 10, 15, 20]

export default function DrawApp() {
  const bank = useQuestionBank('draw', DRAW_BANK)
  const teamState = useTeams()
  const [levels, setLevels] = useState<QDifficulty[]>(['easy', 'medium'])
  const [cats, setCats] = useState<string[]>([])
  const [seconds, setSeconds] = useState(90)
  const [count, setCount] = useState(10)
  const [soundOn, setSoundOn] = useState(true)
  const [showWord, setShowWord] = useState(true)
  const [showHint, setShowHint] = useState(false)
  const [full, setFull] = useState(false)

  useEffect(() => GameSound.setEnabled(soundOn), [soundOn])

  const matching = bank.countMatching({ levels, categories: cats })

  const engine = useRoundEngine({
    seconds,
    countdownFrom: 3,
    onTimeout: () => {
      handleOutcome('timeout')
    },
  })

  const handleOutcome = useCallback(
    (outcome: 'correct' | 'pass' | 'timeout') => {
      if (outcome === 'correct') {
        GameSound.correct()
        if (teamState.teams.length) teamState.score(1, teamState.active)
      } else if (outcome === 'pass') {
        GameSound.skip()
      }
      setShowHint(false)
      setShowWord(true)
      const more = engine.advance(outcome, teamState.teams[teamState.active]?.name)
      if (more && teamState.teams.length) teamState.nextTurn()
    },
    [engine, teamState],
  )

  const start = useCallback(() => {
    GameSound.unlock()
    teamState.resetScores()
    engine.begin(bank.draw({ levels, categories: cats, count }))
  }, [bank, levels, cats, count, engine, teamState])

  /* 鍵盤快捷鍵 */
  useEffect(() => {
    if (engine.phase !== 'playing') return
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return
      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault()
        handleOutcome('correct')
      } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 's') {
        e.preventDefault()
        handleOutcome('pass')
      } else if (e.key.toLowerCase() === 'h') {
        setShowWord((v) => !v)
      } else if (e.key.toLowerCase() === 'p') {
        engine.setPaused((p) => !p)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [engine, handleOutcome])

  const progress = useMemo(
    () => `${Math.min(engine.idx + 1, engine.queue.length)} / ${engine.queue.length}`,
    [engine.idx, engine.queue.length],
  )

  /* ---------- SETUP ---------- */
  if (engine.phase === 'setup') {
    return (
      <SetupShell
        emoji="🎨"
        title="猜猜畫畫"
        subtitle="Draw & Guess"
        howTo={[
          '一名隊員擔任「畫家」，只有他可以看到題目（可按「隱藏題目」防止其他人偷看）。',
          '畫家只能畫圖，不可寫字、講話或做手勢。',
          '其他隊員在限時內喊出答案，猜中由主持按「答對了」。',
          '答不出可按「跳過」，輪到下一隊或下一位畫家。',
          '快捷鍵：空白鍵 = 答對、→ = 跳過、H = 顯示/隱藏題目、P = 暫停。',
        ]}
        stats={bank.stats}
        teams={teamState.teams}
        onAddTeam={teamState.addTeam}
        onRemoveTeam={teamState.removeTeam}
        soundOn={soundOn}
        onSound={setSoundOn}
        canStart={matching > 0}
        startLabel={`開始（抽 ${Math.min(count, matching)} 題）`}
        onStart={start}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <BankFilters
              levels={levels}
              onLevels={setLevels}
              categories={bank.categories}
              selected={cats}
              onSelected={setCats}
              matching={matching}
            />
          </div>

          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/75">⏱️ 每題時間</label>
              <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
                {TIME_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSeconds(s)}
                    className={`rounded-lg border py-2 text-xs font-medium transition ${
                      seconds === s
                        ? 'border-amber-400/60 bg-amber-400/15 text-amber-200'
                        : 'border-white/10 bg-black/20 text-white/70 hover:text-white/70'
                    }`}
                  >
                    {s === 0 ? '手動' : `${s}秒`}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/75">🎲 題目數量</label>
              <div className="grid grid-cols-4 gap-1.5">
                {COUNT_OPTIONS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCount(c)}
                    className={`rounded-lg border py-2 text-xs font-medium transition ${
                      count === c
                        ? 'border-amber-400/60 bg-amber-400/15 text-amber-200'
                        : 'border-white/10 bg-black/20 text-white/70 hover:text-white/70'
                    }`}
                  >
                    {c} 題
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <QuestionManager bank="draw" builtIn={DRAW_BANK} custom={bank.custom} onChange={bank.setCustom} />
      </SetupShell>
    )
  }

  /* ---------- COUNTDOWN ---------- */
  if (engine.phase === 'countdown') return <CountdownScreen n={engine.countdown} />

  /* ---------- SUMMARY ---------- */
  if (engine.phase === 'summary') {
    return (
      <div className="min-h-[100dvh] bg-[#02133e] text-white">
        <SummaryScreen
          log={engine.log}
          teams={teamState.teams}
          onReplay={start}
          onSetup={() => {
            engine.reset()
            teamState.resetScores()
          }}
        />
      </div>
    )
  }

  /* ---------- PLAYING ---------- */
  const q = engine.current
  return (
    <div className={`flex flex-col bg-[#02133e] text-white ${full ? 'fixed inset-0 z-50' : 'min-h-[100dvh]'}`}>
      {/* 頂列 */}
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-2.5">
        <span className="text-xl">🎨</span>
        <span className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-bold tabular-nums">{progress}</span>
        {q && (
          <span className={`text-[11px] ${DIFFICULTY_META[q.level].color}`}>
            {DIFFICULTY_META[q.level].label} · {q.category}
          </span>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={() => engine.setPaused((p) => !p)}
            className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
            title="暫停 (P)"
          >
            <Pause className="h-4 w-4" />
          </button>
          {seconds > 0 && (
            <>
              <button onClick={() => engine.addTime(-10)} className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white" title="減 10 秒">
                <Minus className="h-4 w-4" />
              </button>
              <button onClick={() => engine.addTime(10)} className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white" title="加 10 秒">
                <Plus className="h-4 w-4" />
              </button>
            </>
          )}
          <button onClick={() => setFull((f) => !f)} className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white">
            {full ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 p-3 lg:grid-cols-[1fr_300px]">
        {/* 畫布 */}
        <DrawCanvas disabled={engine.paused} />

        {/* 側欄 */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-4">
            <TimerRing remaining={engine.remaining} total={seconds} size={104} />
          </div>

          {/* 題目卡 */}
          <div className="rounded-2xl border border-amber-400/25 bg-gradient-to-b from-amber-400/10 to-transparent p-4 text-center">
            <div className="mb-2 flex items-center justify-center gap-2">
              <span className="text-[11px] font-medium text-amber-200/70">畫家題目</span>
              <button
                onClick={() => setShowWord((v) => !v)}
                className="rounded-lg p-1 text-white/70 transition hover:bg-white/10 hover:text-white"
                title="顯示/隱藏 (H)"
              >
                {showWord ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              </button>
            </div>
            {showWord ? (
              <div className="text-3xl font-black leading-tight text-amber-100">{q?.answer}</div>
            ) : (
              <div className="select-none py-2 text-3xl font-black text-white/10">● ● ●</div>
            )}
            {q?.hint && (
              <button
                onClick={() => setShowHint((h) => !h)}
                className="mt-3 inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] text-white/75 transition hover:text-amber-200"
              >
                <Lightbulb className="h-3 w-3" />
                {showHint ? q.hint : '顯示提示'}
              </button>
            )}
          </div>

          <ActionButtons onCorrect={() => handleOutcome('correct')} onPass={() => handleOutcome('pass')} />

          {teamState.teams.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="mb-2 text-[11px] text-white/70">
                輪到：<span className="font-bold text-amber-200">{teamState.teams[teamState.active]?.name}</span>
              </p>
              <TeamBar teams={teamState.teams} active={teamState.active} onActive={teamState.setActive} />
            </div>
          )}

          <p className="text-center text-[10px] text-white/75">
            空白鍵 = 答對 · → = 跳過 · H = 隱藏題目 · P = 暫停
          </p>
        </div>
      </div>

      {engine.paused && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur">
          <div className="text-center">
            <p className="mb-4 text-4xl font-black">⏸ 已暫停</p>
            <button onClick={() => engine.setPaused(false)} className="rounded-xl bg-amber-400 px-6 py-3 font-bold text-stone-900">
              繼續遊戲
            </button>
          </div>
        </div>
      )}

      <div className="pointer-events-none fixed bottom-1 right-2 text-[10px] text-white/10">{COPYRIGHT_UPPER}</div>
    </div>
  )
}
