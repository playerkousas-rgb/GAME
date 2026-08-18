/**
 * 大電視 — 全屏出題 + 計時，演員看題做動作，隊友猜
 * Copyright (c) 2026 Scout System. All rights reserved.
 */
import { useCallback, useEffect, useState } from 'react'
import { Pause, Plus, Minus, Maximize2, Minimize2, Lightbulb, EyeOff, Eye } from 'lucide-react'
import QuestionManager from '../../components/QuestionManager'
import BankFilters from '../../components/BankFilters'
import SetupShell from '../../components/SetupShell'
import { TimerRing, CountdownScreen, ActionButtons, SummaryScreen, TeamBar } from '../../components/RoundUI'
import { ACT_BANK } from '../../data/actBank'
import { useQuestionBank } from '../../shared/useQuestionBank'
import { useRoundEngine } from '../../shared/useRoundEngine'
import { useTeams } from '../../shared/useTeams'
import { GameSound } from '../../shared/gameSound'
import { DIFFICULTY_META, type QDifficulty } from '../../shared/questionBank'
import { COPYRIGHT_UPPER } from '../../shared/brand'

const TIME_OPTIONS = [30, 45, 60, 90, 0]
const COUNT_OPTIONS = [5, 10, 15, 20, 30]

export default function ActApp() {
  const bank = useQuestionBank('act', ACT_BANK)
  const teamState = useTeams()
  const [levels, setLevels] = useState<QDifficulty[]>(['easy', 'medium'])
  const [cats, setCats] = useState<string[]>([])
  const [seconds, setSeconds] = useState(60)
  const [count, setCount] = useState(15)
  const [soundOn, setSoundOn] = useState(true)
  const [full, setFull] = useState(false)
  const [blurred, setBlurred] = useState(false)
  const [showHint, setShowHint] = useState(false)

  useEffect(() => GameSound.setEnabled(soundOn), [soundOn])

  const matching = bank.countMatching({ levels, categories: cats })

  const engine = useRoundEngine({
    seconds,
    countdownFrom: 3,
    onTimeout: () => handleOutcome('timeout'),
  })

  const handleOutcome = useCallback(
    (outcome: 'correct' | 'pass' | 'timeout') => {
      if (outcome === 'correct') {
        GameSound.correct()
        if (teamState.teams.length) teamState.score(1, teamState.active)
      } else if (outcome === 'pass') GameSound.skip()
      setShowHint(false)
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

  /* 鍵盤 + 全屏請求 */
  useEffect(() => {
    if (engine.phase !== 'playing') return
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault()
        handleOutcome('correct')
      } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 's') {
        e.preventDefault()
        handleOutcome('pass')
      } else if (e.key.toLowerCase() === 'b') {
        setBlurred((b) => !b)
      } else if (e.key.toLowerCase() === 'p') {
        engine.setPaused((p) => !p)
      } else if (e.key.toLowerCase() === 'f') {
        setFull((f) => !f)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [engine, handleOutcome])

  /* ---------- SETUP ---------- */
  if (engine.phase === 'setup') {
    return (
      <SetupShell
        emoji="📺"
        title="大電視"
        subtitle="Act & Guess"
        howTo={[
          '把畫面投影到電視／投影機，「演員」背向大電視站立（或戴上眼罩由主持讀題）。',
          '題目會以超大字顯示，只有面向螢幕的隊員看到。',
          '演員只能用身體動作演繹，不可出聲、不可說出題目中的任何字。',
          '猜中按「答對了」自動下一題；卡住按「跳過」。時間到會自動結算。',
          '快捷鍵：空白鍵 = 答對、→ = 跳過、B = 遮蔽題目、F = 全屏、P = 暫停。',
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
              <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
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
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-indigo-400/20 bg-indigo-400/5 p-3">
              <p className="text-[11px] leading-relaxed text-white/70">
                💡 <span className="font-semibold text-indigo-200">投影小貼士</span>：開始後按 <kbd className="rounded bg-white/10 px-1">F</kbd> 進入全屏，
                字體會自動放到最大。主持可站在螢幕側面用鍵盤操作。
              </p>
            </div>
          </div>
        </div>

        <QuestionManager bank="act" builtIn={ACT_BANK} custom={bank.custom} onChange={bank.setCustom} />
      </SetupShell>
    )
  }

  if (engine.phase === 'countdown') return <CountdownScreen n={engine.countdown} />

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

  /* ---------- PLAYING（大電視主畫面） ---------- */
  const q = engine.current
  const wordLen = q?.answer.length ?? 0
  // 依字數自動縮放，投影時盡量填滿螢幕
  const fontClass =
    wordLen <= 3 ? 'text-[18vw]' : wordLen <= 5 ? 'text-[13vw]' : wordLen <= 8 ? 'text-[9vw]' : 'text-[6.5vw]'

  return (
    <div className={`flex flex-col bg-[#02133e] text-white ${full ? 'fixed inset-0 z-50' : 'min-h-[100dvh]'}`}>
      {/* 頂列 */}
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-2">
        <span className="text-lg">📺</span>
        <span className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-bold tabular-nums">
          {Math.min(engine.idx + 1, engine.queue.length)} / {engine.queue.length}
        </span>
        <span className="rounded-lg bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-300 tabular-nums">
          ✓ {engine.stats.correct}
        </span>
        {q && <span className={`hidden text-[11px] sm:inline ${DIFFICULTY_META[q.level].color}`}>{q.category}</span>}
        <div className="ml-auto flex items-center gap-1">
          <button onClick={() => setBlurred((b) => !b)} className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white" title="遮蔽 (B)">
            {blurred ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <button onClick={() => engine.setPaused((p) => !p)} className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white" title="暫停 (P)">
            <Pause className="h-4 w-4" />
          </button>
          {seconds > 0 && (
            <>
              <button onClick={() => engine.addTime(-10)} className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white">
                <Minus className="h-4 w-4" />
              </button>
              <button onClick={() => engine.addTime(10)} className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white">
                <Plus className="h-4 w-4" />
              </button>
            </>
          )}
          <button onClick={() => setFull((f) => !f)} className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white" title="全屏 (F)">
            {full ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* 超大題目 */}
      <div className="relative grid min-h-0 flex-1 place-items-center px-4">
        <div className="w-full text-center">
          <div
            className={`font-black leading-none tracking-tight transition ${fontClass} ${
              blurred ? 'select-none blur-2xl' : ''
            }`}
          >
            {q?.answer}
          </div>
          {q?.hint && !blurred && (
            <button
              onClick={() => setShowHint((h) => !h)}
              className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/25 px-4 py-2 text-sm text-white/70 transition hover:text-amber-200"
            >
              <Lightbulb className="h-4 w-4" />
              {showHint ? q.hint : '顯示提示'}
            </button>
          )}
        </div>

        {/* 角落計時 */}
        <div className="absolute right-4 top-2">
          <TimerRing remaining={engine.remaining} total={seconds} size={92} />
        </div>

        {/* 隊伍 */}
        {teamState.teams.length > 0 && (
          <div className="absolute bottom-3 left-4">
            <p className="mb-1.5 text-[11px] text-white/75">
              輪到：<span className="font-bold text-amber-200">{teamState.teams[teamState.active]?.name}</span>
            </p>
            <TeamBar teams={teamState.teams} active={teamState.active} onActive={teamState.setActive} />
          </div>
        )}
      </div>

      {/* 底部操作 */}
      <div className="border-t border-white/10 p-3">
        <ActionButtons onCorrect={() => handleOutcome('correct')} onPass={() => handleOutcome('pass')} />
        <p className="mt-2 text-center text-[10px] text-white/75">
          空白鍵 = 答對 · → = 跳過 · B = 遮蔽 · F = 全屏 · P = 暫停
        </p>
      </div>

      {engine.paused && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 backdrop-blur">
          <div className="text-center">
            <p className="mb-4 text-5xl font-black">⏸ 已暫停</p>
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
