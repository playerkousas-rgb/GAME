/**
 * EMOJI 猜謎 — 看 emoji 組合猜詞語
 * Copyright (c) 2026 Scout System. All rights reserved.
 */
import { useCallback, useEffect, useState } from 'react'
import { Pause, Plus, Minus, Maximize2, Minimize2, Lightbulb, Sparkles, Send } from 'lucide-react'
import QuestionManager from '../../components/QuestionManager'
import BankFilters from '../../components/BankFilters'
import SetupShell from '../../components/SetupShell'
import { TimerRing, CountdownScreen, SummaryScreen, TeamBar } from '../../components/RoundUI'
import { EMOJI_BANK } from '../../data/emojiBank'
import { useQuestionBank } from '../../shared/useQuestionBank'
import { useRoundEngine } from '../../shared/useRoundEngine'
import { useTeams } from '../../shared/useTeams'
import { GameSound } from '../../shared/gameSound'
import { DIFFICULTY_META, type QDifficulty } from '../../shared/questionBank'
import { COPYRIGHT_UPPER } from '../../shared/brand'

const TIME_OPTIONS = [20, 30, 45, 60, 0]
const COUNT_OPTIONS = [10, 15, 20, 30]

/** 正規化答案以便比對（移除空白與標點、統一大小寫） */
function norm(s: string) {
  return s.toLowerCase().replace(/[\s·・、，,。.!！?？'"'"()（）\-—_]/g, '')
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
              <label className="mb-1.5 block text-xs font-medium text-white/60">🎮 遊戲模式</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setInputMode(true)}
                  className={`rounded-lg border p-2.5 text-left transition ${
                    inputMode ? 'border-amber-400/60 bg-amber-400/15' : 'border-white/10 bg-black/20 hover:bg-white/5'
                  }`}
                >
                  <div className="text-xs font-bold">⌨️ 輸入模式</div>
                  <div className="mt-0.5 text-[10px] text-white/40">打字作答，自動判分</div>
                </button>
                <button
                  onClick={() => setInputMode(false)}
                  className={`rounded-lg border p-2.5 text-left transition ${
                    !inputMode ? 'border-amber-400/60 bg-amber-400/15' : 'border-white/10 bg-black/20 hover:bg-white/5'
                  }`}
                >
                  <div className="text-xs font-bold">📽️ 主持模式</div>
                  <div className="mt-0.5 text-[10px] text-white/40">投影搶答，人手計分</div>
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/60">⏱️ 每題時間</label>
              <div className="grid grid-cols-5 gap-1.5">
                {TIME_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSeconds(s)}
                    className={`rounded-lg border py-2 text-xs font-medium transition ${
                      seconds === s
                        ? 'border-amber-400/60 bg-amber-400/15 text-amber-200'
                        : 'border-white/10 bg-black/20 text-white/40 hover:text-white/70'
                    }`}
                  >
                    {s === 0 ? '手動' : `${s}秒`}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/60">🎲 題目數量</label>
              <div className="grid grid-cols-4 gap-1.5">
                {COUNT_OPTIONS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCount(c)}
                    className={`rounded-lg border py-2 text-xs font-medium transition ${
                      count === c
                        ? 'border-amber-400/60 bg-amber-400/15 text-amber-200'
                        : 'border-white/10 bg-black/20 text-white/40 hover:text-white/70'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <QuestionManager bank="emoji" builtIn={EMOJI_BANK} custom={bank.custom} onChange={bank.setCustom} />
      </SetupShell>
    )
  }

  if (engine.phase === 'countdown') return <CountdownScreen n={engine.countdown} />

  if (engine.phase === 'summary') {
    return (
      <div className="min-h-screen bg-[#02133e] text-white">
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
    <div className={`flex flex-col bg-[#02133e] text-white ${full ? 'fixed inset-0 z-50' : 'min-h-screen'}`}>
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-2">
        <span className="text-lg">🧩</span>
        <span className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-bold tabular-nums">
          {Math.min(engine.idx + 1, engine.queue.length)} / {engine.queue.length}
        </span>
        <span className="rounded-lg bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-300 tabular-nums">
          ✓ {engine.stats.correct}
        </span>
        {q && <span className={`hidden text-[11px] sm:inline ${DIFFICULTY_META[q.level].color}`}>{q.category}</span>}
        <div className="ml-auto flex items-center gap-1">
          <button onClick={() => engine.setPaused((p) => !p)} className="rounded-lg p-2 text-white/40 transition hover:bg-white/10 hover:text-white">
            <Pause className="h-4 w-4" />
          </button>
          {seconds > 0 && (
            <>
              <button onClick={() => engine.addTime(-10)} className="rounded-lg p-2 text-white/40 transition hover:bg-white/10 hover:text-white">
                <Minus className="h-4 w-4" />
              </button>
              <button onClick={() => engine.addTime(10)} className="rounded-lg p-2 text-white/40 transition hover:bg-white/10 hover:text-white">
                <Plus className="h-4 w-4" />
              </button>
            </>
          )}
          <button onClick={() => setFull((f) => !f)} className="rounded-lg p-2 text-white/40 transition hover:bg-white/10 hover:text-white">
            {full ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Emoji 題面 */}
      <div className="relative grid min-h-0 flex-1 place-items-center px-4 py-4">
        <div className="w-full text-center">
          <div className={`leading-none ${emojiClass}`} style={{ lineHeight: 1.15 }}>
            {q?.emoji}
          </div>

          {revealed ? (
            <div className="mt-6 animate-[pulse_0.6s_ease-out_1]">
              <div className="text-[10px] uppercase tracking-widest text-white/30">答案</div>
              <div className="text-4xl font-black text-emerald-300 md:text-6xl">{q?.answer}</div>
            </div>
          ) : (
            <div className="mt-6 text-sm text-white/25">
              {q ? `${[...q.answer].length} 個字` : ''}
            </div>
          )}

          {q?.hint && !revealed && (
            <button
              onClick={() => setShowHint((h) => !h)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/25 px-4 py-2 text-sm text-white/45 transition hover:text-amber-200"
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
          <div className="absolute bottom-2 left-4">
            <TeamBar teams={teamState.teams} active={teamState.active} onActive={teamState.setActive} />
          </div>
        )}
      </div>

      {/* 操作區 */}
      <div className="border-t border-white/10 p-3">
        {inputMode && !revealed ? (
          <div className="mx-auto flex max-w-xl gap-2">
            <input
              autoFocus
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitGuess()}
              placeholder="輸入答案後按 Enter..."
              className={`flex-1 rounded-xl border-2 bg-black/30 px-4 py-3 text-lg outline-none transition ${
                feedback === 'wrong'
                  ? 'animate-[shake_0.4s] border-rose-500 text-rose-200'
                  : 'border-white/10 focus:border-amber-400/60'
              }`}
            />
            <button
              onClick={submitGuess}
              className="flex items-center gap-1.5 rounded-xl bg-amber-400 px-5 py-3 font-bold text-stone-900 transition hover:bg-amber-300"
            >
              <Send className="h-4 w-4" /> 作答
            </button>
            <button
              onClick={() => {
                setRevealed(true)
                GameSound.reveal()
              }}
              className="rounded-xl bg-white/10 px-4 py-3 text-sm text-white/60 transition hover:bg-white/15"
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
                  onClick={() => {
                    setRevealed(true)
                    GameSound.reveal()
                  }}
                  className="rounded-2xl bg-indigo-500 py-4 text-lg font-black text-white transition hover:bg-indigo-400 active:scale-[0.98]"
                >
                  ✨ 公布答案
                </button>
                <button
                  onClick={() => {
                    GameSound.skip()
                    nextQuestion('pass')
                  }}
                  className="rounded-2xl bg-white/10 py-4 text-lg font-black text-white/70 transition hover:bg-white/15 active:scale-[0.98]"
                >
                  ⤼ 跳過
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => nextQuestion('correct')}
                  className="rounded-2xl bg-emerald-500 py-4 text-lg font-black text-white transition hover:bg-emerald-400 active:scale-[0.98]"
                >
                  ✓ 猜中了（加分）
                </button>
                <button
                  onClick={() => nextQuestion('pass')}
                  className="rounded-2xl bg-white/10 py-4 text-lg font-black text-white/70 transition hover:bg-white/15 active:scale-[0.98]"
                >
                  ✗ 無人猜中
                </button>
              </>
            )}
          </div>
        )}
        <p className="mt-2 text-center text-[10px] text-white/20">
          {inputMode ? 'Enter = 作答 · ✨ = 放棄並看答案' : '空白鍵 = 公布/答對 · → = 跳過 · F = 全屏 · P = 暫停'}
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
