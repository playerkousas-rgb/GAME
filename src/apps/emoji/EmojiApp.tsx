/**
 * EMOJI 猜謎 — 看 emoji 組合猜詞語
 * Copyright (c) 2026 Scout System. All rights reserved.
 */
import { useCallback, useEffect, useState } from 'react'
import { Lightbulb, Sparkles, Send } from 'lucide-react'
import QuestionManager from '../../components/QuestionManager'
import BankFilters from '../../components/BankFilters'
import SetupShell from '../../components/SetupShell'
import { TimerRing, CountdownScreen, SummaryScreen, TeamBar } from '../../components/RoundUI'
import { PlayHeader, OptionGroup, Section, CopyrightMark } from '../../components/ui'
import { EMOJI_BANK } from '../../data/emojiBank'
import { useQuestionBank } from '../../shared/useQuestionBank'
import { useRoundEngine } from '../../shared/useRoundEngine'
import { useTeams } from '../../shared/useTeams'
import { GameSound } from '../../shared/gameSound'
import { DIFFICULTY_META, type QDifficulty } from '../../shared/questionBank'

const TIME_OPTIONS = [20, 30, 45, 60, 0]
const COUNT_OPTIONS = [10, 15, 20, 30]

/** 正規化答案以便比對（移除空白與標點、統一大小寫） */
function norm(s: string) {
  return s.toLowerCase().replace(/[\s·・、，,。.!！?？'""()（）\-—_]/g, '')
}

export default function EmojiApp() {
  const bank = useQuestionBank('emoji', EMOJI_BANK)
  const teamState = useTeams()
  const [levels, setLevels] = useState<QDifficulty[]>(['easy', 'medium'])
  const [cats, setCats] = useState<string[]>([])
  const [seconds, setSeconds] = useState(30)
  const [count, setCount] = useState(15)
  const [soundOn, setSoundOn] = useState(true)
  const [full, setFull] = useState(false)
  const [inputMode, setInputMode] = useState(true)
  const [guess, setGuess] = useState('')
  const [feedback, setFeedback] = useState<'none' | 'wrong'>('none')
  const [revealed, setRevealed] = useState(false)
  const [showHint, setShowHint] = useState(false)

  useEffect(() => GameSound.setEnabled(soundOn), [soundOn])

  const matching = bank.countMatching({ levels, categories: cats })

  const engine = useRoundEngine({
    seconds,
    countdownFrom: 3,
    onTimeout: () => {
      setRevealed(true)
      GameSound.timeUp()
    },
  })

  const nextQuestion = useCallback(
    (outcome: 'correct' | 'pass' | 'timeout') => {
      if (outcome === 'correct' && teamState.teams.length) teamState.score(1, teamState.active)
      setGuess('')
      setFeedback('none')
      setRevealed(false)
      setShowHint(false)
      const more = engine.advance(outcome, teamState.teams[teamState.active]?.name)
      if (more && teamState.teams.length) teamState.nextTurn()
    },
    [engine, teamState],
  )

  const currentQuestion = engine.current

  const submitGuess = useCallback(() => {
    const q = currentQuestion
    if (!q || !guess.trim()) return
    if (norm(guess) === norm(q.answer)) {
      GameSound.correct()
      setRevealed(true)
      setTimeout(() => nextQuestion('correct'), 900)
    } else {
      GameSound.wrong()
      setFeedback('wrong')
      setTimeout(() => setFeedback('none'), 700)
    }
  }, [currentQuestion, guess, nextQuestion])

  const start = useCallback(() => {
    GameSound.unlock()
    teamState.resetScores()
    setGuess('')
    setRevealed(false)
    engine.begin(bank.draw({ levels, categories: cats, count }))
  }, [bank, levels, cats, count, engine, teamState])

  /* 鍵盤（非輸入模式） */
  useEffect(() => {
    if (engine.phase !== 'playing' || inputMode) return
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault()
        if (!revealed) {
          setRevealed(true)
          GameSound.reveal()
        } else nextQuestion('correct')
      } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 's') {
        e.preventDefault()
        GameSound.skip()
        nextQuestion('pass')
      } else if (e.key.toLowerCase() === 'p') {
        engine.setPaused((p) => !p)
      } else if (e.key.toLowerCase() === 'f') {
        setFull((f) => !f)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [engine, inputMode, revealed, nextQuestion])

  /* ---------- SETUP ---------- */
  if (engine.phase === 'setup') {
    return (
      <SetupShell
        emoji="🧩"
        title="EMOJI 猜謎"
        subtitle="Emoji Puzzle"
        howTo={[
          '螢幕會顯示一組 Emoji，代表一個詞語、電影、成語或地方。',
          '「輸入模式」：隊員直接打答案，系統自動判對錯（適合小組圍住平板玩）。',
          '「主持模式」：全屏投影 Emoji，隊員口頭搶答，主持按鍵公布答案與計分。',
          '卡住可按提示（部分題目設有），或跳過去下一題。',
          '快捷鍵（主持模式）：空白鍵 = 公布/答對、→ = 跳過、F = 全屏、P = 暫停。',
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
              <div>
                <div className="mb-1.5 text-xs font-medium muted">🎮 遊戲模式</div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setInputMode(true)}
                    className={`chip !justify-start !p-3 text-left ${inputMode ? 'chip-on' : ''}`}
                  >
                    <div>
                      <div className="text-xs font-bold">⌨️ 輸入模式</div>
                      <div className="mt-0.5 text-[10px] font-normal muted">打字作答，自動判分</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode(false)}
                    className={`chip !justify-start !p-3 text-left ${!inputMode ? 'chip-on' : ''}`}
                  >
                    <div>
                      <div className="text-xs font-bold">📽️ 主持模式</div>
                      <div className="mt-0.5 text-[10px] font-normal muted">投影搶答，人手計分</div>
                    </div>
                  </button>
                </div>
              </div>
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

        <QuestionManager bank="emoji" builtIn={EMOJI_BANK} custom={bank.custom} onChange={bank.setCustom} />
      </SetupShell>
    )
  }

  if (engine.phase === 'countdown') return <CountdownScreen n={engine.countdown} />

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
      </div>
    )
  }

  /* ---------- PLAYING ---------- */
  const q = engine.current
  const emojiLen = [...(q?.emoji ?? '')].length
  const emojiClass = emojiLen <= 2 ? 'text-[22vw]' : emojiLen <= 4 ? 'text-[15vw]' : 'text-[10vw]'

  return (
    <div className={`flex flex-col bg-[#02133e] text-white ${full ? 'fixed inset-0 z-50' : 'min-h-[100dvh]'}`}>
      <PlayHeader
        emoji="🧩"
        progress={`${Math.min(engine.idx + 1, engine.queue.length)} / ${engine.queue.length}`}
        score={engine.stats.correct}
        meta={q && <span className={DIFFICULTY_META[q.level].color}>{q.category}</span>}
        onPause={() => engine.setPaused((p) => !p)}
        full={full}
        onToggleFull={() => setFull((f) => !f)}
        timed={seconds > 0}
        onTimeMinus={() => engine.addTime(-10)}
        onTimePlus={() => engine.addTime(10)}
      />

      {/* Emoji 題面 */}
      <div className="relative grid min-h-0 flex-1 place-items-center px-4 py-4">
        <div className="w-full text-center">
          <div className={`leading-none ${emojiClass}`} style={{ lineHeight: 1.15 }}>
            {q?.emoji}
          </div>

          {revealed ? (
            <div className="mt-6 animate-[pulse_0.6s_ease-out_1]">
              <div className="text-[10px] uppercase tracking-widest muted">答案</div>
              <div className="text-4xl font-black text-emerald-300 md:text-6xl">{q?.answer}</div>
            </div>
          ) : (
            <div className="mt-6 text-sm muted">
              {q ? `${[...q.answer].length} 個字` : ''}
            </div>
          )}

          {q?.hint && !revealed && (
            <button
              type="button"
              onClick={() => setShowHint((h) => !h)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/25 px-4 py-2 text-sm muted transition hover:text-amber-200"
            >
              <Lightbulb className="h-4 w-4" />
              {showHint ? q.hint : '顯示提示'}
            </button>
          )}
        </div>

        <div className="absolute right-4 top-2">
          <TimerRing remaining={engine.remaining} total={seconds} size={88} />
        </div>

        {teamState.teams.length > 0 && (
          <div className="absolute bottom-2 left-4 max-w-[60vw]">
            <TeamBar teams={teamState.teams} active={teamState.active} onActive={teamState.setActive} />
          </div>
        )}
      </div>

      {/* 操作區 */}
      <div className="border-t border-white/10 p-3">
        {inputMode && !revealed ? (
          <div className="mx-auto flex max-w-xl flex-wrap gap-2">
            <input
              autoFocus
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitGuess()}
              placeholder="輸入答案後按 Enter..."
              className={`min-w-0 flex-1 rounded-xl border-2 bg-black/30 px-4 py-3 text-lg outline-none transition ${
                feedback === 'wrong'
                  ? 'animate-[shake_0.4s] border-rose-500 text-rose-200'
                  : 'border-white/10 focus:border-amber-400/60'
              }`}
            />
            <button
              type="button"
              onClick={submitGuess}
              className="flex min-h-12 items-center gap-1.5 rounded-xl bg-amber-400 px-5 font-bold text-stone-900 transition hover:bg-amber-300"
            >
              <Send className="h-4 w-4" /> 作答
            </button>
            <button
              type="button"
              onClick={() => {
                setRevealed(true)
                GameSound.reveal()
              }}
              className="min-h-12 rounded-xl bg-white/10 px-4 text-sm muted transition hover:bg-white/15"
              title="放棄並公布答案"
            >
              <Sparkles className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="mx-auto grid max-w-3xl grid-cols-2 gap-3">
            {!revealed ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setRevealed(true)
                    GameSound.reveal()
                  }}
                  className="min-h-14 rounded-2xl bg-indigo-500 text-lg font-black text-white transition hover:bg-indigo-400 active:scale-[0.98]"
                >
                  ✨ 公布答案
                </button>
                <button
                  type="button"
                  onClick={() => {
                    GameSound.skip()
                    nextQuestion('pass')
                  }}
                  className="min-h-14 rounded-2xl bg-white/10 text-lg font-black text-white/70 transition hover:bg-white/15 active:scale-[0.98]"
                >
                  ⤼ 跳過
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => nextQuestion('correct')}
                  className="min-h-14 rounded-2xl bg-emerald-500 text-lg font-black text-white transition hover:bg-emerald-400 active:scale-[0.98]"
                >
                  ✓ 猜中了（加分）
                </button>
                <button
                  type="button"
                  onClick={() => nextQuestion('pass')}
                  className="min-h-14 rounded-2xl bg-white/10 text-lg font-black text-white/70 transition hover:bg-white/15 active:scale-[0.98]"
                >
                  ✗ 無人猜中
                </button>
              </>
            )}
          </div>
        )}
        <p className="mt-2 text-center text-[10px] muted-2">
          {inputMode ? 'Enter = 作答 · ✨ = 放棄並看答案' : '空白鍵 = 公布/答對 · → = 跳過 · F = 全屏 · P = 暫停'}
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

      <CopyrightMark />
    </div>
  )
}
