/**
 * 大電視 — 全屏出題 + 計時，演員看題做動作，隊友猜
 * Copyright (c) 2026 Scout System. All rights reserved.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Lightbulb, EyeOff, Eye } from 'lucide-react'
import QuestionManager from '../../components/QuestionManager'
import BankFilters from '../../components/BankFilters'
import SetupShell from '../../components/SetupShell'
import { DemoCaption, type IntroSection } from '../../components/GameIntro'
import { TimerRing, CountdownScreen, ActionButtons, SummaryScreen, TeamBar } from '../../components/RoundUI'
import { PlayHeader, OptionGroup, Section, CopyrightMark } from '../../components/ui'
import { ACT_BANK } from '../../data/actBank'
import { useQuestionBank } from '../../shared/useQuestionBank'
import { useRoundEngine } from '../../shared/useRoundEngine'
import { useTeams } from '../../shared/useTeams'
import { GameSound } from '../../shared/gameSound'
import { DIFFICULTY_META, type QDifficulty } from '../../shared/questionBank'

const TIME_OPTIONS = [30, 45, 60, 90, 0]
const COUNT_OPTIONS = [5, 10, 15, 20, 30]

const ACT_INTRO: IntroSection[] = [
  {
    title: '🎯 玩法',
    items: [
      '題目以超大字顯示在大電視，只有面向螢幕的隊員看得到。',
      '「演員」背向電視（或由主持讀題），只能用身體動作演繹。',
      '不可出聲、不可說出題目中的任何字；隊友大聲喊出猜想。',
      '猜中由主持按「答對了」自動進下一題；卡住按「跳過」。',
    ],
  },
  {
    title: '⌨️ 操作與快捷鍵',
    items: [
      '空白鍵 = 答對、→ = 跳過、B = 遮蔽題目、F = 全屏、P = 暫停。',
      '每題倒數計時，時間到自動進下一題，全部完成自動結算。',
    ],
  },
  {
    title: '✏️ 題庫與自訂題目',
    items: [
      `內建 ${ACT_BANK.length} 題，可先按難度／分類篩選。`,
      '下方「題目管理」可加入自訂題目或批次匯入，只存於本裝置。',
      '💡 首次使用建議按「🎬 觀看示範」，30 秒看懂整個流程。',
    ],
  },
]

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

  /* ---------- 示範模式（MOCK） ---------- */
  const [demoMode, setDemoMode] = useState(false)
  const [demoCaption, setDemoCaption] = useState('')

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

  /* 示範模式：自動走一輪（看題 → 遮蔽 → 猜中） */
  const outcomeRef = useRef(handleOutcome)
  useEffect(() => { outcomeRef.current = handleOutcome })

  const startDemo = useCallback(() => {
    setDemoMode(true)
    setDemoCaption('🎬 示範開始——3 秒倒數後自動進行')
    start()
  }, [start])

  useEffect(() => {
    if (!demoMode || engine.phase !== 'playing') return
    setBlurred(false)
    setDemoCaption(`本題：只有面向大電視的隊員看得到，「演員」背向螢幕看隊友` )
    const t1 = setTimeout(() => {
      setBlurred(true)
      setDemoCaption('主持遮蔽題目——演員只能用動作演繹，隊友大聲猜')
    }, 3000)
    const t2 = setTimeout(() => {
      outcomeRef.current(engine.idx % 3 === 2 ? 'pass' : 'correct')
    }, 6500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [demoMode, engine.phase, engine.idx])

  useEffect(() => {
    if (demoMode && engine.phase === 'summary') {
      setDemoCaption('🎉 示範完成——流程就是這樣！按「結束」再開始你自己的遊戲')
    }
  }, [demoMode, engine.phase])

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
        intro={{ sections: ACT_INTRO, onDemo: startDemo }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Section icon={<span>🎯</span>} title="題目篩選">
            <BankFilters
              levels={levels}
              onLevels={setLevels}
              categories={bank.categories}
              selected={cats}
              onSelected={setCats}
              matching={matching}
            />
          </Section>

          <Section icon={<span>⏱️</span>} title="遊戲節奏">
            <div className="space-y-3">
              <OptionGroup
                label="每題時間"
                value={seconds}
                onChange={setSeconds}
                cols={5}
                options={TIME_OPTIONS.map((s) => ({ value: s, label: s === 0 ? '手動' : `${s}秒` }))}
              />
              <OptionGroup
                label="題目數量"
                value={count}
                onChange={setCount}
                cols={5}
                options={COUNT_OPTIONS.map((c) => ({ value: c, label: `${c} 題` }))}
              />
              <div className="rounded-xl border border-indigo-400/25 bg-indigo-500/10 p-3">
                <p className="text-[11px] leading-relaxed muted">
                  💡 <span className="font-semibold text-indigo-300">投影小貼士</span>：開始後按 <kbd className="rounded bg-white/10 px-1">F</kbd> 進入全屏，
                  字體會自動放到最大。主持可站在螢幕側面用鍵盤操作。
                </p>
              </div>
            </div>
          </Section>
        </div>

        <QuestionManager bank="act" builtIn={ACT_BANK} custom={bank.custom} onChange={bank.setCustom} />
      </SetupShell>
    )
  }

  if (engine.phase === 'countdown') {
    return (
      <>
        <CountdownScreen n={engine.countdown} />
        {demoMode && <DemoCaption text={demoCaption} onExit={() => setDemoMode(false)} />}
      </>
    )
  }

  if (engine.phase === 'summary') {
    return (
      <div className="ss-page relative">
        <SummaryScreen
          log={engine.log}
          teams={teamState.teams}
          onReplay={start}
          onSetup={() => {
            engine.reset()
            teamState.resetScores()
          }}
        />
        {demoMode && <DemoCaption text={demoCaption} onExit={() => setDemoMode(false)} />}
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
      <PlayHeader
        emoji="📺"
        progress={`${Math.min(engine.idx + 1, engine.queue.length)} / ${engine.queue.length}`}
        score={engine.stats.correct}
        meta={q && <span className={DIFFICULTY_META[q.level].color}>{q.category}</span>}
        extra={
          <button onClick={() => setBlurred((b) => !b)} className="icon-btn" title="遮蔽 (B)" aria-label="遮蔽">
            {blurred ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
        onPause={() => engine.setPaused((p) => !p)}
        full={full}
        onToggleFull={() => setFull((f) => !f)}
        timed={seconds > 0}
        onTimeMinus={() => engine.addTime(-10)}
        onTimePlus={() => engine.addTime(10)}
      />

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
              type="button"
              onClick={() => setShowHint((h) => !h)}
              className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/25 px-4 py-2 text-sm muted transition hover:text-amber-200"
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
          <div className="absolute bottom-3 left-4 max-w-[60vw]">
            <p className="mb-1.5 text-[11px] muted">
              輪到：<span className="font-bold text-amber-200">{teamState.teams[teamState.active]?.name}</span>
            </p>
            <TeamBar teams={teamState.teams} active={teamState.active} onActive={teamState.setActive} />
          </div>
        )}
      </div>

      {/* 底部操作 */}
      <div className="border-t border-white/10 p-3">
        <ActionButtons onCorrect={() => handleOutcome('correct')} onPass={() => handleOutcome('pass')} />
        <p className="mt-2 text-center text-[10px] muted-2">
          空白鍵 = 答對 · → = 跳過 · B = 遮蔽 · F = 全屏 · P = 暫停
        </p>
      </div>

      {engine.paused && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 backdrop-blur">
          <div className="text-center">
            <p className="mb-4 text-5xl font-black">⏸ 已暫停</p>
            <button onClick={() => engine.setPaused(false)} className="btn-primary">
              繼續遊戲
            </button>
          </div>
        </div>
      )}

      {demoMode && <DemoCaption text={demoCaption} onExit={() => setDemoMode(false)} />}
      <CopyrightMark />
    </div>
  )
}
