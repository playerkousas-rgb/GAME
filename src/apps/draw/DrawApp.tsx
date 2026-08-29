/**
 * 猜猜畫畫 — 一人看題作畫，其他人猜
 * Copyright (c) 2026 Scout System. All rights reserved.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Eye, EyeOff, Lightbulb, Smartphone } from 'lucide-react'
import DrawCanvas from './DrawCanvas'
import SecretDrawHost from './SecretDrawHost'
import QuestionManager from '../../components/QuestionManager'
import BankFilters from '../../components/BankFilters'
import SetupShell from '../../components/SetupShell'
import { DemoCaption, type IntroSection } from '../../components/GameIntro'
import { TimerRing, CountdownScreen, ActionButtons, SummaryScreen, TeamBar } from '../../components/RoundUI'
import { PlayHeader, OptionGroup, Section, CopyrightMark } from '../../components/ui'
import { DRAW_BANK } from '../../data/drawBank'
import { useQuestionBank } from '../../shared/useQuestionBank'
import { useRoundEngine } from '../../shared/useRoundEngine'
import { useTeams } from '../../shared/useTeams'
import { GameSound } from '../../shared/gameSound'
import { DIFFICULTY_META, type QDifficulty } from '../../shared/questionBank'

const TIME_OPTIONS = [60, 90, 120, 180, 0]
const COUNT_OPTIONS = [5, 10, 15, 20]

const DRAW_INTRO: IntroSection[] = [
  {
    title: '🎯 玩法',
    items: [
      '一名隊員擔任「畫家」，只有他看得到題目（可隱藏防止偷看）。',
      '畫家只能畫圖——不可寫字、講話或做手勢。',
      '其他隊員在限時內喊出答案，猜中由主持按「答對了」。',
      '答不出按「跳過」；可設定隊伍計分，輪流作答。',
    ],
  },
  {
    title: '⌨️ 操作與快捷鍵',
    items: [
      '空白鍵 = 答對、→ = 跳過、H = 顯示/隱藏題目、P = 暫停。',
      '「+10s / -10s」可現場調整每題時間；每題倒數到自動跳過。',
    ],
  },
  {
    title: '📱 秘密派題模式',
    items: [
      '每人掃一個專屬 QR，題目直接送到畫家自己的手機，其他人一片空白。',
      '適合人多場合——主持機永遠不會有人看到題目。',
    ],
  },
  {
    title: '✏️ 題庫與自訂題目',
    items: [
      `內建 ${DRAW_BANK.length} 題，可按難度／分類篩選。`,
      '「題目管理」可加入自訂題目或批次匯入，只存於本裝置。',
      '💡 首次使用建議按「🎬 觀看示範」，30 秒看懂整個流程。',
    ],
  },
]

export default function DrawApp() {
  const bank = useQuestionBank('draw', DRAW_BANK)
  const teamState = useTeams()
  const [levels, setLevels] = useState<QDifficulty[]>(['easy', 'medium'])
  const [cats, setCats] = useState<string[]>([])
  const [seconds, setSeconds] = useState(90)
  const [count, setCount] = useState(10)
  const [soundOn, setSoundOn] = useState(true)

  /* ---------- 示範模式（MOCK） ---------- */
  const [demoMode, setDemoMode] = useState(false)
  const [demoCaption, setDemoCaption] = useState('')
  const [showWord, setShowWord] = useState(true)
  const [showHint, setShowHint] = useState(false)
  const [full, setFull] = useState(false)
  const [secretMode, setSecretMode] = useState(false)

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

  /* 示範模式：自動走一輪（畫家出題 → 猜中） */
  const outcomeRef = useRef(handleOutcome)
  useEffect(() => { outcomeRef.current = handleOutcome })

  const startDemo = useCallback(() => {
    setDemoMode(true)
    setDemoCaption('🎬 示範開始——3 秒倒數後自動進行')
    start()
  }, [start])

  useEffect(() => {
    if (!demoMode || engine.phase !== 'playing') return
    setDemoCaption(`畫家的題目是「${engine.current?.answer}」，立即動筆（示範略過真正繪畫）`)
    const t1 = setTimeout(() => {
      setDemoCaption('猜題者圍住畫布大聲喊答案——猜中時主持按「答對了」')
    }, 3200)
    const t2 = setTimeout(() => {
      outcomeRef.current(engine.idx % 3 === 2 ? 'pass' : 'correct')
    }, 6800)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [demoMode, engine.phase, engine.idx, engine.current])

  useEffect(() => {
    if (demoMode && engine.phase === 'summary') {
      setDemoCaption('🎉 示範完成——流程就是這樣！按「結束」再開始你自己的遊戲')
    }
  }, [demoMode, engine.phase])

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

  /* ---------- 秘密派題模式 ---------- */
  if (secretMode) {
    return (
      <SecretDrawHost
        levels={levels}
        categories={cats}
        customAnswers={bank.custom.map((q) => q.answer)}
        onBack={() => setSecretMode(false)}
      />
    )
  }

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
        intro={{ sections: DRAW_INTRO, onDemo: startDemo }}
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
                cols={4}
                options={COUNT_OPTIONS.map((c) => ({ value: c, label: `${c} 題` }))}
              />
            </div>
          </Section>
        </div>

        <button
          type="button"
          onClick={() => setSecretMode(true)}
          className="card w-full border-emerald-400/35 bg-gradient-to-br from-emerald-500/10 to-transparent p-4 text-left transition active:scale-[0.99]"
        >
          <div className="flex items-center gap-2 text-sm font-black text-emerald-300">
            <Smartphone className="h-4 w-4" /> 🔒 秘密派題模式（手機出題）
          </div>
          <p className="mt-1.5 text-xs leading-relaxed muted">
            每人掃一個專屬 QR，題目直接送到畫家自己部手機 —— 其他人手機一片空白，
            唔會有人偷望到主持機。領袖畫面只顯示「下一局：N 號玩家」，等佢出到嚟先開始。
          </p>
        </button>

        <QuestionManager bank="draw" builtIn={DRAW_BANK} custom={bank.custom} onChange={bank.setCustom} />
      </SetupShell>
    )
  }

  /* ---------- COUNTDOWN ---------- */
  if (engine.phase === 'countdown') {
    return (
      <>
        <CountdownScreen n={engine.countdown} />
        {demoMode && <DemoCaption text={demoCaption} onExit={() => setDemoMode(false)} />}
      </>
    )
  }

  /* ---------- SUMMARY ---------- */
  if (engine.phase === 'summary') {
    return (
      <div className="ss-page">
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

  /* ---------- PLAYING ---------- */
  const q = engine.current
  return (
    <div className={`flex flex-col bg-[#02133e] text-white ${full ? 'fixed inset-0 z-50' : 'min-h-[100dvh]'}`}>
      <PlayHeader
        emoji="🎨"
        progress={progress}
        meta={q && (
          <span className={DIFFICULTY_META[q.level].color}>
            {DIFFICULTY_META[q.level].label} · {q.category}
          </span>
        )}
        onPause={() => engine.setPaused((p) => !p)}
        full={full}
        onToggleFull={() => setFull((f) => !f)}
        timed={seconds > 0}
        onTimeMinus={() => engine.addTime(-10)}
        onTimePlus={() => engine.addTime(10)}
      />

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
                type="button"
                onClick={() => setShowWord((v) => !v)}
                className="icon-btn !h-8 !w-8"
                title="顯示/隱藏 (H)"
              >
                {showWord ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            </div>
            {showWord ? (
              <div className="text-3xl font-black leading-tight text-amber-100">{q?.answer}</div>
            ) : (
              <div className="select-none py-2 text-3xl font-black text-white/10">● ● ●</div>
            )}
            {q?.hint && (
              <button
                type="button"
                onClick={() => setShowHint((h) => !h)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/25 px-3.5 py-1.5 text-xs muted transition hover:text-amber-200"
              >
                <Lightbulb className="h-3.5 w-3.5" />
                {showHint ? q.hint : '顯示提示'}
              </button>
            )}
          </div>

          <ActionButtons onCorrect={() => handleOutcome('correct')} onPass={() => handleOutcome('pass')} />

          {teamState.teams.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="mb-2 text-[11px] muted">
                輪到：<span className="font-bold text-amber-200">{teamState.teams[teamState.active]?.name}</span>
              </p>
              <TeamBar teams={teamState.teams} active={teamState.active} onActive={teamState.setActive} />
            </div>
          )}

          <p className="text-center text-[10px] muted-2">
            空白鍵 = 答對 · → = 跳過 · H = 隱藏題目 · P = 暫停
          </p>
        </div>
      </div>

      {engine.paused && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur">
          <div className="text-center">
            <p className="mb-4 text-4xl font-black">⏸ 已暫停</p>
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
