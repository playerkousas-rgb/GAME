import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Timer, ShieldCheck, Medal, ArrowLeft, Info, CheckCircle2, XCircle, HelpCircle, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react'
import { Item, GameConfig, GameResult } from '../types'
import { DISTRACTORS, shuffleArray, normalizeText } from '../data/items'
import { Sound } from '../hooks/useSound'
import { DemoCaption, GameIntro, type IntroSection } from '../../../components/GameIntro'

const KIMS_INTRO: IntroSection[] = [
  {
    title: '🎯 玩法',
    items: [
      '物品（Emoji／圖形／相片）展示一段時間後自動遮蓋。',
      '靠記憶作答：「選擇模式」點選記得的物品（混有干擾項），或「輸入模式」打字輸入。',
      '系統計算正確／錯誤／遺漏，換算準確率與勳章積分。',
    ],
  },
  {
    title: '⚙️ 可調參數',
    items: [
      '物品數量、觀察秒數、作答秒數——愈多愈難。',
      '選擇模式可開關「干擾項」；輸入模式不設干擾，考驗拼寫記憶。',
    ],
  },
  {
    title: '📦 物品庫與自訂',
    items: [
      '主頁「物品庫」內建 90+ 童軍主題物品，分 25+ 類。',
      '可自行新增自訂物品（Emoji＋名稱，含「自訂」分類），本裝置保存。',
      '💡 首次使用建議按「🎬 觀看示範」，15 秒看懂整個流程。',
    ],
  },
]

interface Props {
  config: GameConfig
  uploadedItems?: Item[]
  allItems?: Item[]
  playerName?: string
  onBack: () => void
  onResult: (result: GameResult) => void
  onSoundEnabled?: boolean
}

type Phase = 'setup' | 'observe' | 'hidden' | 'answer' | 'results'

export default function KimsGame({ config, uploadedItems = [], allItems, playerName, onBack, onResult, onSoundEnabled = true }: Props) {
  const [phase, setPhase] = useState<Phase>('setup')
  const [timer, setTimer] = useState(0)
  const [roundItems, setRoundItems] = useState<Item[]>([])
  const [selectedChoices, setSelectedChoices] = useState<string[]>([])
  const [inputText, setInputText] = useState('')
  const [score, setScore] = useState(0)
  const [showAnswers, setShowAnswers] = useState(false)
  const [observeSeconds] = useState(config.observeSeconds)
  const [answerSeconds] = useState(config.answerSeconds)
  const [showItems, setShowItems] = useState(true)
  const [, setAnimating] = useState(false)
  const [usedTime, setUsedTime] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(onSoundEnabled)
  const [submitted, setSubmitted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showNames, setShowNames] = useState(false)

  /* ---------- 示範模式（MOCK） ---------- */
  const [demoMode, setDemoMode] = useState(false)
  const [demoCaption, setDemoCaption] = useState('')
  const [introOpen, setIntroOpen] = useState(false)

  const allItemsPool = useMemo(() => allItems || [...uploadedItems], [allItems, uploadedItems])
  const filteredItems = useMemo(() => {
    if (config.difficulty === 'easy') return allItemsPool.filter(i => i.level === 'easy')
    if (config.difficulty === 'medium') return allItemsPool.filter(i => i.level === 'easy' || i.level === 'medium')
    return allItemsPool
  }, [allItemsPool, config.difficulty])

  const itemsCount = useMemo(() => {
    if (config.difficulty === 'easy') return Math.min(config.itemsCount, 12)
    if (config.difficulty === 'medium') return Math.min(config.itemsCount, 20)
    return Math.min(config.itemsCount, 36)
  }, [config.difficulty, config.itemsCount])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) { document.documentElement.requestFullscreen?.().catch(() => {}); setIsFullscreen(true) }
    else { document.exitFullscreen?.().catch(() => {}); setIsFullscreen(false) }
  }, [])

  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', h)
    return () => document.removeEventListener('fullscreenchange', h)
  }, [])

  useEffect(() => {
    if (phase !== 'observe' && phase !== 'answer' && phase !== 'hidden') return
    // 遮蓋完 1.5 秒緩衝後進入作答（獨立 effect 段，避免被 phase 變更的 cleanup 取消）
    if (phase === 'hidden') {
      const toAnswer = window.setTimeout(() => { setAnimating(false); setPhase('answer'); setTimer(answerSeconds) }, 1500)
      return () => { window.clearTimeout(toAnswer) }
    }
    if (timer <= 5 && timer > 0 && soundEnabled) Sound.tick()
    if (timer <= 0) {
      // 以 timeout 延後，避免在 effect 內同步 setState
      if (phase === 'observe') {
        if (soundEnabled) Sound.submit()
        const toHidden = window.setTimeout(() => { setPhase('hidden'); setShowItems(false); setAnimating(true) }, 0)
        return () => { window.clearTimeout(toHidden) }
      }
      if (submitted) return
      const t = window.setTimeout(() => {
        setSubmitted(true)
        if (soundEnabled) Sound.timeout()
        setPhase('results')
      }, 0)
      return () => window.clearTimeout(t)
    }
    const interval = window.setInterval(() => { setTimer(p => p - 1); setUsedTime(p => p + 1) }, 1000)
    return () => window.clearInterval(interval)
  }, [phase, timer, answerSeconds, soundEnabled, submitted])

  const startGame = useCallback(() => {
    const pool = shuffleArray(filteredItems)
    setRoundItems(pool.slice(0, itemsCount))
    setInputText(''); setSelectedChoices([]); setPhase('observe'); setTimer(observeSeconds)
    setShowItems(true); setShowAnswers(false); setUsedTime(0); setScore(0); setSubmitted(false)
    if (soundEnabled) Sound.gameStart()
  }, [filteredItems, itemsCount, observeSeconds, soundEnabled])

  const answerPool = useMemo(() => {
    if (config.answerMode === 'input') return []
    const base = [...roundItems]
    const extra = config.enableDistractors ? DISTRACTORS : shuffleArray(allItemsPool.filter(i => !roundItems.some(r => r.id === i.id))).slice(0, Math.max(8, roundItems.length))
    return shuffleArray([...base, ...extra]).slice(0, roundItems.length + 10)
  }, [config.answerMode, roundItems, config.enableDistractors, allItemsPool])

  const inputParsed = useMemo(() => inputText.split(/[、,\n]/).map(x => x.trim()).filter(Boolean), [inputText])

  const result = useMemo((): GameResult => {
    const targetNames = roundItems.map(i => normalizeText(i.name))
    const guessed = config.answerMode === 'input' ? inputParsed.map(normalizeText) : selectedChoices.map(id => normalizeText(answerPool.find(i => i.id === id)?.name || ''))
    const correctSet = new Set<string>(); guessed.forEach(g => { if (targetNames.includes(g)) correctSet.add(g) })
    const correct = correctSet.size; const wrong = Math.max(0, guessed.filter(g => !targetNames.includes(g)).length); const missed = Math.max(0, targetNames.length - correct)
    const accuracy = roundItems.length ? Math.round((correct / roundItems.length) * 100) : 0
    let rank = '新苗挑戰者'
    if (accuracy >= 90) rank = '金鷹勳章'
    else if (accuracy >= 75) rank = '銀狼勳章'
    else if (accuracy >= 60) rank = '銅熊勳章'
    return { correct, wrong, missed, accuracy, score: correct * 10 - wrong * 5, rank, timeUsed: usedTime }
  }, [roundItems, config.answerMode, answerPool, inputParsed, selectedChoices, usedTime])

  /* 遊戲結束時回報成績（更新積分榜） */
  const reportedRef = useRef(false)
  useEffect(() => {
    if (phase !== 'results' || reportedRef.current) return
    reportedRef.current = true
    onResult(result)
  }, [phase, result, onResult])

  const handleSubmit = useCallback(() => { if (!submitted) { setSubmitted(true); if (soundEnabled) Sound.submit(); setPhase('results') }}, [submitted, soundEnabled])

  /* 示範模式：快進走完整流程（觀察→遮蓋→作答→結果） */
  const submitRef = useRef(handleSubmit)
  useEffect(() => { submitRef.current = handleSubmit })

  const startDemo = useCallback(() => {
    setDemoMode(true)
    setDemoCaption('🎬 示範開始——物品出現，努力記住！')
    startGame()
  }, [startGame])

  useEffect(() => {
    if (!demoMode) return
    if (phase === 'observe') {
      const t = setTimeout(() => { setShowItems(false); setPhase('hidden') }, 3200)
      return () => clearTimeout(t)
    }
    if (phase === 'hidden') {
      setDemoCaption('遮蓋了！現在全憑記憶')
      const t = setTimeout(() => setPhase('answer'), 1600)
      return () => clearTimeout(t)
    }
    if (phase === 'answer') {
      setDemoCaption(config.answerMode === 'input' ? '輸入記得的物品（逗號分隔）→ 提交' : '點選記得的物品——選項區混入了干擾項')
      const t1 = setTimeout(() => {
        if (config.answerMode === 'input') {
          setInputText(roundItems.map(i => i.name).slice(0, Math.max(2, roundItems.length - 1)).join('、'))
        } else {
          const correctIds = answerPool
            .filter(i => roundItems.some(r => r.id === i.id))
            .slice(0, Math.max(2, roundItems.length - 1))
            .map(i => i.id)
          setSelectedChoices(correctIds)
        }
        setDemoCaption('示範：故意漏記一件，示範「遺漏」如何計分')
      }, 2600)
      const t2 = setTimeout(() => submitRef.current(), 4600)
      return () => { clearTimeout(t1); clearTimeout(t2) }
    }
    if (phase === 'results') {
      setDemoCaption('🎉 示範完成——正確／錯誤／遺漏自動計分。按「結束」回到正常遊戲')
    }
  }, [demoMode, phase, config.answerMode, roundItems, answerPool])

  // 手機優先的欄數
  const gridCols = useMemo(() => {
    const n = roundItems.length
    if (n <= 4) return 2
    if (n <= 9) return 3
    if (n <= 16) return 4
    return 5
  }, [roundItems.length])

  // 以物品 id 產生穩定亂數（配色與輕微傾斜每輪固定）
  const itemPositions = useMemo(() => {
    const palette = ['#12224f', '#7F1D1D', '#064E3B', '#4C1D95', '#334155', '#0C4A6E', '#78350F', '#1E3A5F']
    const jitter = (key: string, salt: number) => {
      let h = 2166136261 ^ salt
      for (let i = 0; i < key.length; i++) {
        h = Math.imul(h ^ key.charCodeAt(i), 16777619)
      }
      return ((h >>> 0) % 10000) / 10000
    }
    return roundItems.map((item, idx) => {
      const key = String(item?.id ?? idx)
      return {
        rotation: (jitter(key, 3) - 0.5) * 4,
        bg: palette[Math.floor(jitter(key, 5) * palette.length) % palette.length],
      }
    })
  }, [roundItems])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 p-2.5">
        <button onClick={onBack} className="flex items-center gap-1 text-white/70 hover:text-white/70 text-xs"><ArrowLeft size={14} /> 返回</button>
        <div className="flex items-center gap-2 text-xs text-white/60">
          <span className="font-bold text-amber-300">{score} 分</span>
          {playerName && (<><span className="text-white/60">|</span><span className="text-white">{playerName}</span></>)}
        </div>
        <div className="flex gap-1">
          <button onClick={toggleFullscreen} className="text-white/70 hover:text-white p-1">{isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}</button>
          <button onClick={() => setSoundEnabled(!soundEnabled)} className="text-white/70 hover:text-white">{soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}</button>
        </div>
      </div>

      {phase === 'setup' && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
          <div className="text-5xl mb-3">🏕️</div>
          <h2 className="text-xl font-bold text-white">金氏遊戲</h2>
          <p className="text-white/70 text-xs mt-1">物品展示後遮蓋，考驗記憶力</p>
          {playerName && <div className="mt-2 inline-block rounded-full bg-amber-400/20 px-3 py-0.5 text-xs text-amber-300">🎯 {playerName}</div>}
          <div className="mt-3 flex justify-center gap-4 text-xs text-white/60">
            <span>📦 {itemsCount} 件</span><span>⏱️ {observeSeconds}s</span><span>✍️ {answerSeconds}s</span>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <button onClick={startGame} className="px-8 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-900 font-bold text-sm">🚀 開始</button>
            <button onClick={startDemo} className="px-4 py-2.5 rounded-xl border border-indigo-400/40 bg-indigo-500/15 text-indigo-200 hover:bg-indigo-500/25 font-bold text-sm">🎬 觀看示範</button>
            <button onClick={() => setIntroOpen(true)} className="px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 text-white/90 hover:bg-white/10 font-bold text-sm">📖 玩法介紹</button>
          </div>
          <GameIntro open={introOpen} onClose={() => setIntroOpen(false)} emoji="🏕️" title="金氏遊戲" tagline="物品展示後遮蓋，考驗記憶力" sections={KIMS_INTRO} />
        </div>
      )}

      {phase === 'observe' && (
        <div className="rounded-2xl border border-white/15 bg-black/30 p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-white">👀 觀察 · {roundItems.length} 件</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowNames(v => !v)}
                className="rounded-lg border border-white/20 bg-black/25 px-2.5 py-1 text-[11px] text-white/70"
              >
                {showNames ? '隱藏名稱' : '顯示名稱'}
              </button>
              <div className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold ${timer <= 5 ? 'bg-rose-500 text-white animate-pulse' : 'bg-amber-400 text-stone-900'}`}>
                <Timer size={12} /> {timer}s
              </div>
            </div>
          </div>
          <div
            className="grid gap-2 sm:gap-3"
            style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0,1fr))` }}
          >
            {showItems && roundItems.map((item, idx) => {
              const pos = itemPositions[idx]
              return (
                <div
                  key={item.id}
                  className="flex aspect-square flex-col items-center justify-center rounded-2xl border border-white/10 p-1 shadow-lg"
                  style={{ backgroundColor: pos.bg, transform: `rotate(${pos.rotation}deg)` }}
                >
                  {item.imageUrl
                    ? <img src={item.imageUrl} alt={item.name} className="max-h-[70%] max-w-[80%] object-contain drop-shadow-lg" />
                    : <span className="leading-none drop-shadow-lg" style={{ fontSize: 'clamp(1.7rem, 8vw, 4rem)' }}>{item.emoji}</span>}
                  {showNames && <span className="mt-1 truncate text-[10px] text-white/85">{item.name}</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {phase === 'hidden' && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
          <ShieldCheck className="mx-auto mb-2 text-white/40" size={36} />
          <h2 className="text-lg font-bold text-white">🔒 已遮蓋</h2>
          <p className="text-white/40 text-xs mt-1">準備作答...</p>
        </div>
      )}

      {phase === 'answer' && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white">✍️ 回答</h2>
            <div className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold ${timer <= 5 ? 'bg-rose-500 text-white animate-pulse' : 'bg-amber-400/80 text-stone-900'}`}><Timer size={12} /> {timer}s</div>
          </div>
          {config.answerMode === 'input' ? (
            <textarea value={inputText} onChange={e => setInputText(e.target.value)} placeholder="輸入記得的物品，逗號分隔" className="min-h-32 w-full rounded-xl border border-white/15 bg-black/25 p-3 text-sm text-white placeholder:text-white/40 focus:border-amber-400/50 focus:outline-none" />
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6">
              {answerPool.map(item => {
                const checked = selectedChoices.includes(item.id)
                return (
                  <button key={item.id} onClick={() => setSelectedChoices(prev => checked ? prev.filter(x => x !== item.id) : [...prev, item.id])}
                    className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 p-1 transition active:scale-95 ${checked ? 'border-amber-400 bg-amber-400/25' : 'border-white/15 bg-black/25'}`}>
                    {item.imageUrl
                      ? <img src={item.imageUrl} alt={item.name} className="max-h-[55%] max-w-[80%] object-contain" />
                      : <span style={{ fontSize: 'clamp(1.4rem, 6vw, 2.4rem)', lineHeight: 1 }}>{item.emoji}</span>}
                    <span className={`w-full truncate px-0.5 text-center text-[10px] ${checked ? 'text-amber-100' : 'text-white/70'}`}>{item.name}</span>
                  </button>
                )
              })}
            </div>
          )}
          <button onClick={handleSubmit} disabled={submitted} className={`mt-3 w-full rounded-xl py-2.5 text-xs font-bold ${submitted ? 'bg-black/25 text-white/60' : 'bg-amber-400 text-stone-900 hover:bg-amber-300'}`}>
            {submitted ? '已提交' : '📤 提交'}
          </button>
        </div>
      )}

      {phase === 'results' && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-sm font-bold text-white mb-3">📊 結果</h2>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="rounded-lg bg-emerald-900/30 p-2 text-center"><CheckCircle2 className="mx-auto mb-0.5 text-emerald-400" size={16} /><div className="text-[10px] text-emerald-300">正確</div><div className="text-lg font-bold text-emerald-400">{result.correct}</div></div>
            <div className="rounded-lg bg-rose-900/30 p-2 text-center"><XCircle className="mx-auto mb-0.5 text-rose-400" size={16} /><div className="text-[10px] text-rose-300">錯誤</div><div className="text-lg font-bold text-rose-400">{result.wrong}</div></div>
            <div className="rounded-lg bg-cyan-900/30 p-2 text-center"><HelpCircle className="mx-auto mb-0.5 text-cyan-400" size={16} /><div className="text-[10px] text-cyan-300">遺漏</div><div className="text-lg font-bold text-cyan-400">{result.missed}</div></div>
          </div>
          <div className="rounded-lg border border-amber-300/30 bg-amber-300/10 p-3 text-center mb-3">
            <div className="text-[10px] text-amber-200">準確率</div>
            <div className="text-2xl font-bold text-amber-400">{result.accuracy}%</div>
            <div className="flex items-center justify-center gap-1 mt-1 text-xs text-amber-200"><Medal size={14} /> {result.rank}</div>
            <div className="text-sm font-bold text-white mt-1">+{result.score} 分</div>
          </div>
          <div className="mb-3">
            <button onClick={() => setShowAnswers(!showAnswers)} className="text-xs text-white/70 hover:text-white/70 flex items-center gap-1"><Info size={12} />{showAnswers ? '隱藏' : '顯示'}答案</button>
            {showAnswers && <div className="mt-1 flex flex-wrap gap-1">{roundItems.map(item => <span key={item.id} className="rounded-full bg-black/30 px-2 py-0.5 text-[10px] text-white/60">{item.emoji} {item.name}</span>)}</div>}
          </div>
          <div className="flex gap-2">
            <button onClick={startGame} className="flex-1 rounded-lg bg-amber-400 py-2.5 text-xs font-bold text-stone-900 hover:bg-amber-300">🔄 再來</button>
            <button onClick={onBack} className="flex-1 rounded-lg border border-white/20 bg-black/25 py-2.5 text-xs text-white/60">⬅️ 返回</button>
          </div>
        </div>
      )}

      {demoMode && phase !== 'setup' && <DemoCaption text={demoCaption} onExit={() => setDemoMode(false)} />}
    </div>
  )
}