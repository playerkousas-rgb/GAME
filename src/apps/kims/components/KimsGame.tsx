import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Timer, ShieldCheck, Medal, ArrowLeft, Info, CheckCircle2, XCircle, HelpCircle, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react'
import { Item, GameConfig, GameResult } from '../types'
import { DISTRACTORS, shuffleArray, normalizeText } from '../data/items'
import { Sound } from '../hooks/useSound'

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
    if (phase !== 'observe' && phase !== 'answer') return
    if (timer <= 5 && timer > 0 && soundEnabled) Sound.tick()
    if (timer <= 0) {
      // 以 timeout 延後，避免在 effect 內同步 setState
      if (phase === 'observe') {
        if (soundEnabled) Sound.submit()
        const toHidden = window.setTimeout(() => { setPhase('hidden'); setShowItems(false); setAnimating(true) }, 0)
        const toAnswer = window.setTimeout(() => { setAnimating(false); setPhase('answer'); setTimer(answerSeconds) }, 1500)
        return () => { window.clearTimeout(toHidden); window.clearTimeout(toAnswer) }
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

  // 以物品 id 產生穩定亂數，令擺位每輪固定（渲染期間保持純函式）
  const itemPositions = useMemo(() => {
    const gridCols = Math.min(roundItems.length <= 12 ? 4 : roundItems.length <= 20 ? 5 : 6, 6)
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
        x: (idx % gridCols) * (92 / gridCols) + 4 + (jitter(key, 1) - 0.5) * 6,
        y: Math.floor(idx / gridCols) * 76 + 20 + (jitter(key, 2) - 0.5) * 10,
        rotation: (jitter(key, 3) - 0.5) * 6,
        scale: 0.85 + jitter(key, 4) * 0.3,
      }
    })
  }, [roundItems])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl bg-[#02133E]/60 border border-blue-800/30 p-2.5">
        <button onClick={onBack} className="flex items-center gap-1 text-blue-300 hover:text-blue-100 text-xs"><ArrowLeft size={14} /> 返回</button>
        <div className="flex items-center gap-2 text-xs text-blue-200">
          <span className="font-bold text-amber-300">{score} 分</span>
          {playerName && (<><span className="text-blue-400">|</span><span className="text-white">{playerName}</span></>)}
        </div>
        <div className="flex gap-1">
          <button onClick={toggleFullscreen} className="text-blue-300 hover:text-white p-1">{isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}</button>
          <button onClick={() => setSoundEnabled(!soundEnabled)} className="text-blue-300 hover:text-white">{soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}</button>
        </div>
      </div>

      {phase === 'setup' && (
        <div className="rounded-2xl border border-blue-800/30 bg-[#02133E]/60 p-6 text-center">
          <div className="text-5xl mb-3">🏕️</div>
          <h2 className="text-xl font-bold text-white">金氏遊戲</h2>
          <p className="text-blue-300 text-xs mt-1">物品展示後遮蓋，考驗記憶力</p>
          {playerName && <div className="mt-2 inline-block rounded-full bg-amber-400/20 px-3 py-0.5 text-xs text-amber-300">🎯 {playerName}</div>}
          <div className="mt-3 flex justify-center gap-4 text-xs text-blue-200">
            <span>📦 {itemsCount} 件</span><span>⏱️ {observeSeconds}s</span><span>✍️ {answerSeconds}s</span>
          </div>
          <button onClick={startGame} className="mt-5 px-8 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-900 font-bold text-sm">🚀 開始</button>
        </div>
      )}

      {phase === 'observe' && (
        <div className="rounded-2xl border border-blue-800/30 bg-[#02133E]/60 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white">👀 觀察</h2>
            <div className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold ${timer <= 5 ? 'bg-rose-500 text-white animate-pulse' : 'bg-amber-400/80 text-stone-900'}`}>
              <Timer size={12} /> {timer}s
            </div>
          </div>
          <div className="relative min-h-[280px] bg-[#0a1e4a]/40 rounded-xl overflow-hidden">
            {showItems && roundItems.map((item, idx) => {
              const pos = itemPositions[idx]
              return (
                <div key={item.id} className="absolute flex flex-col items-center gap-0.5 transition-all duration-200"
                  style={{ left: `${pos.x}%`, top: `${pos.y}px`, transform: `rotate(${pos.rotation}deg) scale(${pos.scale})`, zIndex: idx }}>
                  {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-10 h-10 object-contain drop-shadow-lg" /> : <span className="text-3xl drop-shadow-lg">{item.emoji}</span>}
                  <span className="text-[10px] text-blue-200/70 font-light">{item.name}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {phase === 'hidden' && (
        <div className="rounded-2xl border border-blue-800/30 bg-[#02133E]/60 p-8 text-center">
          <ShieldCheck className="mx-auto mb-2 text-blue-300/60" size={36} />
          <h2 className="text-lg font-bold text-white">🔒 已遮蓋</h2>
          <p className="text-blue-300/60 text-xs mt-1">準備作答...</p>
        </div>
      )}

      {phase === 'answer' && (
        <div className="rounded-2xl border border-blue-800/30 bg-[#02133E]/60 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white">✍️ 回答</h2>
            <div className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold ${timer <= 5 ? 'bg-rose-500 text-white animate-pulse' : 'bg-amber-400/80 text-stone-900'}`}><Timer size={12} /> {timer}s</div>
          </div>
          {config.answerMode === 'input' ? (
            <textarea value={inputText} onChange={e => setInputText(e.target.value)} placeholder="輸入記得的物品，逗號分隔" className="min-h-32 w-full rounded-xl border border-blue-700/40 bg-[#0a1e4a]/50 p-3 text-sm text-white placeholder-blue-400/50 focus:border-amber-400/50 focus:outline-none" />
          ) : (
            <div className="grid grid-cols-2 gap-1.5 md:grid-cols-4">
              {answerPool.map(item => {
                const checked = selectedChoices.includes(item.id)
                return (
                  <button key={item.id} onClick={() => setSelectedChoices(prev => checked ? prev.filter(x => x !== item.id) : [...prev, item.id])}
                    className={`rounded-lg border px-2 py-1.5 text-xs text-left transition-all ${checked ? 'border-amber-300/60 bg-amber-300/10 text-amber-200' : 'border-blue-700/20 bg-[#0a1e4a]/30 text-blue-200 hover:bg-blue-800/20'}`}>
                    {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-4 h-4 inline-block mr-1" /> : <span className="mr-0.5">{item.emoji}</span>}{item.name}
                  </button>
                )
              })}
            </div>
          )}
          <button onClick={handleSubmit} disabled={submitted} className={`mt-3 w-full rounded-xl py-2.5 text-xs font-bold ${submitted ? 'bg-blue-900/30 text-blue-500' : 'bg-amber-400 text-stone-900 hover:bg-amber-300'}`}>
            {submitted ? '已提交' : '📤 提交'}
          </button>
        </div>
      )}

      {phase === 'results' && (
        <div className="rounded-2xl border border-blue-800/30 bg-[#02133E]/60 p-5">
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
            <button onClick={() => setShowAnswers(!showAnswers)} className="text-xs text-blue-300 hover:text-blue-100 flex items-center gap-1"><Info size={12} />{showAnswers ? '隱藏' : '顯示'}答案</button>
            {showAnswers && <div className="mt-1 flex flex-wrap gap-1">{roundItems.map(item => <span key={item.id} className="rounded-full bg-blue-900/40 px-2 py-0.5 text-[10px] text-blue-200">{item.emoji} {item.name}</span>)}</div>}
          </div>
          <div className="flex gap-2">
            <button onClick={startGame} className="flex-1 rounded-lg bg-amber-400 py-2.5 text-xs font-bold text-stone-900 hover:bg-amber-300">🔄 再來</button>
            <button onClick={onBack} className="flex-1 rounded-lg border border-blue-600/50 bg-blue-900/30 py-2.5 text-xs text-blue-200">⬅️ 返回</button>
          </div>
        </div>
      )}
    </div>
  )
}