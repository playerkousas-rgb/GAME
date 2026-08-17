import { useState, useEffect, useMemo, useCallback } from 'react'
import { Timer, ShieldCheck, Medal, ArrowLeft, Info, CheckCircle2, XCircle, HelpCircle, Volume2, VolumeX, Type, Maximize, Minimize, Trash2, Plus } from 'lucide-react'
import { GameConfig, GameResult, BORDER_COLORS, TEXT_COLORS } from '../types'
import { Sound } from '../hooks/useSound'

interface Props {
  config: GameConfig
  playerName?: string
  onBack: () => void
  onResult: (result: GameResult) => void
}

type Phase = 'setup' | 'observe' | 'hidden' | 'answer' | 'results'

interface CharCard {
  id: string
  text: string
  textColor: string
  bgColor: string
}

export default function TextMemory({ config, playerName, onBack, onResult }: Props) {
  const [phase, setPhase] = useState<Phase>('setup')
  const [cards, setCards] = useState<CharCard[]>([])
  const [timer, setTimer] = useState(0)
  const [inputText, setInputText] = useState('')
  const [score, setScore] = useState(0)
  const [showAnswers, setShowAnswers] = useState(false)
  const [observeSeconds] = useState(config.observeSeconds)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentCharIndex, setCurrentCharIndex] = useState(0)

  // === Setup State ===
  const [charInput, setCharInput] = useState('')
  const [textColor, setTextColor] = useState('#FFFFFF')
  const [bgColor, setBgColor] = useState('#1E3A5F')

  const difficulty = config.difficulty
  const maxCards = useMemo(() => ({ easy: 6, medium: 10, hard: 15 }), [])[difficulty]

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen?.().catch(() => {})
      setIsFullscreen(false)
    }
  }, [])

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  useEffect(() => {
    if (phase !== 'observe') return
    if (timer <= 0) {
      if (soundEnabled) Sound.submit()
      setPhase('hidden')
      window.setTimeout(() => {
        setPhase('answer')
        setTimer(config.answerSeconds)
      }, 1500)
      return
    }
    if (timer <= 5 && timer > 0 && soundEnabled) Sound.tick()
    const interval = window.setInterval(() => setTimer(prev => {
      // Auto-advance character every few seconds
      if (prev > 0 && prev % 3 === 0 && currentCharIndex < cards.length - 1) {
        setCurrentCharIndex(i => Math.min(i + 1, cards.length - 1))
      }
      return prev - 1
    }), 1000)
    return () => window.clearInterval(interval)
  }, [phase, timer, soundEnabled, config.answerSeconds, cards.length, currentCharIndex])

  // Answer timer
  useEffect(() => {
    if (phase !== 'answer') return
    if (timer <= 0) { if (!submitted) { setSubmitted(true); if (soundEnabled) Sound.timeout(); setPhase('results') } return }
    if (timer <= 5 && timer > 0 && soundEnabled) Sound.tick()
    const interval = window.setInterval(() => setTimer(prev => prev - 1), 1000)
    return () => window.clearInterval(interval)
  }, [phase, timer, soundEnabled, submitted])

  const addCard = useCallback(() => {
    if (!charInput.trim() || cards.length >= maxCards) return
    setCards(prev => [...prev, { id: `char-${Date.now()}`, text: charInput.trim(), textColor, bgColor }])
    setCharInput('')
    if (soundEnabled) Sound.click()
  }, [charInput, cards.length, maxCards, textColor, bgColor, soundEnabled])

  const removeCard = useCallback((id: string) => setCards(prev => prev.filter(c => c.id !== id)), [])

  const startGame = useCallback(() => {
    if (cards.length === 0) return
    setCurrentCharIndex(0)
    setPhase('observe')
    setTimer(observeSeconds)
    setInputText('')
    setScore(0)
    setSubmitted(false)
    setShowAnswers(false)
    if (soundEnabled) Sound.gameStart()
  }, [cards.length, observeSeconds, soundEnabled])

  const inputParsed = useMemo(() => inputText.split(/[、,\n]/).map(x => x.trim()).filter(Boolean), [inputText])

  const result = useMemo((): GameResult => {
    const targetTexts = cards.map(c => c.text.trim())
    const guessed = inputParsed
    const correct = guessed.filter(g => targetTexts.includes(g)).length
    const wrong = guessed.filter(g => !targetTexts.includes(g)).length
    const missed = targetTexts.length - correct
    const accuracy = cards.length ? Math.round((correct / cards.length) * 100) : 0
    let rank = '初學者'
    if (accuracy >= 90) rank = '文字大師'
    else if (accuracy >= 75) rank = '記憶高手'
    else if (accuracy >= 60) rank = '記憶新星'
    return { correct, wrong, missed, accuracy, score: correct * 10 - wrong * 3, rank, timeUsed: 0 }
  }, [cards, inputParsed])

  const handleSubmit = useCallback(() => { if (!submitted) { setSubmitted(true); if (soundEnabled) Sound.submit(); setPhase('results') }}, [submitted, soundEnabled])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl bg-[#02133E]/60 border border-blue-800/30 p-2.5">
        <button onClick={onBack} className="flex items-center gap-1 text-blue-300 hover:text-blue-100 text-xs"><ArrowLeft size={14} /> 返回</button>
        <div className="flex items-center gap-2 text-xs text-blue-200">
          <Type size={14} /><span>文字記憶</span>
          {playerName && (<><span className="text-blue-400">|</span><span className="text-white">{playerName}</span></>)}
          <span className="text-blue-400">|</span>
          <span className="text-amber-300 font-bold">{score} 分</span>
        </div>
        <div className="flex gap-1">
          <button onClick={toggleFullscreen} className="text-blue-300 hover:text-white p-1" title={isFullscreen ? '離開全屏' : '全屏顯示'}>{isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}</button>
          <button onClick={() => setSoundEnabled(!soundEnabled)} className="text-blue-300 hover:text-white">{soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}</button>
        </div>
      </div>

      {/* SETUP */}
      {phase === 'setup' && (
        <div className="rounded-2xl border border-blue-800/30 bg-[#02133E]/60 p-5">
          <div className="text-center mb-4">
            <div className="text-4xl mb-2">📝</div>
            <h2 className="text-xl font-bold text-white">文字記憶遊戲</h2>
            <p className="text-blue-300 text-xs">全螢幕大字顯示，適合領袖投影給成員記憶</p>
            {playerName && <div className="mt-1 inline-block rounded-full bg-amber-400/20 px-3 py-0.5 text-xs text-amber-300">🎯 {playerName}</div>}
          </div>

          <div className="rounded-lg bg-[#0a1e4a]/40 border border-blue-700/30 p-3 mb-3 space-y-2">
            <div className="flex gap-1">
              <input value={charInput} onChange={e => setCharInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCard()}
                placeholder="輸入中文字（如 紅、藍、互助）" maxLength={10}
                className="flex-1 rounded-lg border border-blue-700/50 bg-[#02133E] p-2 text-xs text-white placeholder-blue-500 focus:border-amber-400/50 focus:outline-none" />
              <button onClick={addCard} disabled={cards.length >= maxCards}
                className="rounded-lg bg-amber-400 px-3 py-2 text-xs font-bold text-stone-900 hover:bg-amber-300 disabled:opacity-50 flex items-center gap-1"><Plus size={12} /> 加入</button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-blue-400">文字顏色</label>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {TEXT_COLORS.map(c => (
                    <button key={c.value} onClick={() => setTextColor(c.value)}
                      className={`w-6 h-6 rounded-full border ${textColor === c.value ? 'ring-2 ring-white scale-125' : ''}`}
                      style={{ backgroundColor: c.value }} title={c.name} />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] text-blue-400">背景顏色</label>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {[
                    { name: '深藍', value: '#1E3A5F' }, { name: '紅色', value: '#7F1D1D' },
                    { name: '深綠', value: '#064E3B' }, { name: '深紫', value: '#4C1D95' },
                    { name: '深灰', value: '#374151' }, { name: '黑色', value: '#111827' },
                    { name: '白色', value: '#F8FAFC' }, { name: '天藍', value: '#0C4A6E' },
                  ].map(c => (
                    <button key={c.value} onClick={() => setBgColor(c.value)}
                      className={`w-6 h-6 rounded-full border ${bgColor === c.value ? 'ring-2 ring-white scale-125' : ''}`}
                      style={{ backgroundColor: c.value }} title={c.name} />
                  ))}
                </div>
              </div>
            </div>

            {/* 預覽 */}
            {charInput && (
              <div className="flex justify-center py-3 rounded-lg" style={{ backgroundColor: bgColor }}>
                <span className="text-5xl font-bold" style={{ color: textColor }}>{charInput}</span>
              </div>
            )}
          </div>

          {/* Card list */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-blue-300">已建立 {cards.length}/{maxCards} 字</span>
              {cards.length > 0 && <button onClick={() => setCards([])} className="text-[10px] text-rose-400 hover:text-rose-300">全部清除</button>}
            </div>
            <div className="flex flex-wrap gap-2">
              {cards.map(card => (
                <div key={card.id} className="relative group">
                  <div className="rounded-lg px-3 py-1.5 text-sm font-bold" style={{ color: card.textColor, backgroundColor: card.bgColor }}>
                    {card.text}
                  </div>
                  <button onClick={() => removeCard(card.id)} className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 text-[8px]">✕</button>
                </div>
              ))}
            </div>
          </div>

          <button onClick={startGame} disabled={cards.length === 0}
            className={`w-full rounded-xl py-2.5 text-sm font-bold ${cards.length > 0 ? 'bg-amber-400 text-stone-900 hover:bg-amber-300' : 'bg-blue-900/30 text-blue-500'}`}>
            🚀 開始（{observeSeconds}s 展示）
          </button>
        </div>
      )}

      {/* OBSERVE - 全螢幕大字 */}
      {phase === 'observe' && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: cards[currentCharIndex]?.bgColor || '#02133E' }}>
          {/* 頂部控制條 */}
          <div className="flex items-center justify-between px-4 py-2 bg-black/30">
            <button onClick={() => { setPhase('setup'); if (soundEnabled) Sound.click(); }} className="text-white/60 hover:text-white text-xs">✕ 結束</button>
            <div className="flex items-center gap-3 text-xs text-white/60">
              <span>{currentCharIndex + 1} / {cards.length}</span>
              <div className={`rounded px-2 py-0.5 font-bold ${timer <= 5 ? 'bg-rose-500 text-white animate-pulse' : 'bg-white/20 text-white'}`}>
                <Timer size={12} className="inline mr-1" />{timer}s
              </div>
            </div>
            <button onClick={toggleFullscreen} className="text-white/60 hover:text-white">
              {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
            </button>
          </div>

          {/* 大字體全螢幕顯示 - 像 Word 打一個字 */}
          <div className="flex-1 flex items-center justify-center px-4">
            <span className="font-bold text-center break-all leading-tight"
              style={{
                color: cards[currentCharIndex]?.textColor || '#FFFFFF',
                fontSize: 'clamp(6rem, 25vw, 20rem)',
                textShadow: '0 4px 20px rgba(0,0,0,0.3)',
              }}
            >
              {cards[currentCharIndex]?.text || '字'}
            </span>
          </div>

          {/* 底部進度點 */}
          <div className="flex justify-center gap-1.5 pb-4">
            {cards.map((_, idx) => (
              <div key={idx} className={`w-2 h-2 rounded-full transition-all ${idx === currentCharIndex ? 'bg-amber-400 scale-150' : idx < currentCharIndex ? 'bg-emerald-400' : 'bg-white/30'}`} />
            ))}
          </div>

          {/* 手動切換按鈕 */}
          {currentCharIndex < cards.length - 1 && (
            <button
              onClick={() => setCurrentCharIndex(prev => Math.min(prev + 1, cards.length - 1))}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 text-3xl"
            >
              ›
            </button>
          )}
          {currentCharIndex > 0 && (
            <button
              onClick={() => setCurrentCharIndex(prev => Math.max(prev - 1, 0))}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 text-3xl"
            >
              ‹
            </button>
          )}
        </div>
      )}

      {/* HIDDEN */}
      {phase === 'hidden' && (
        <div className="rounded-2xl border border-blue-800/30 bg-[#02133E]/60 p-8 text-center">
          <ShieldCheck className="mx-auto mb-2 text-blue-300/60" size={36} />
          <h2 className="text-lg font-bold text-white">🔒 已遮蓋</h2>
          <p className="text-blue-300/60 text-xs mt-1">準備作答...</p>
        </div>
      )}

      {/* ANSWER */}
      {phase === 'answer' && (
        <div className="rounded-2xl border border-blue-800/30 bg-[#02133E]/60 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white">✍️ 回答</h2>
            <div className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold ${timer <= 5 ? 'bg-rose-500 text-white animate-pulse' : 'bg-amber-400/80 text-stone-900'}`}>
              <Timer size={12} /> {timer}s
            </div>
          </div>
          <textarea value={inputText} onChange={e => setInputText(e.target.value)}
            placeholder={`輸入你記得的 ${cards.length} 個字，用逗號分隔`}
            className="min-h-32 w-full rounded-xl border border-blue-700/40 bg-[#0a1e4a]/50 p-3 text-sm text-white placeholder-blue-400/50 focus:border-amber-400/50 focus:outline-none" />
          <button onClick={handleSubmit} disabled={submitted}
            className={`mt-3 w-full rounded-xl py-2.5 text-xs font-bold ${submitted ? 'bg-blue-900/30 text-blue-500' : 'bg-amber-400 text-stone-900 hover:bg-amber-300'}`}>
            📤 提交
          </button>
        </div>
      )}

      {/* RESULTS */}
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
            {showAnswers && <div className="mt-1 flex flex-wrap gap-2">{cards.map(c => <span key={c.id} className="rounded-lg px-2.5 py-1 text-sm font-bold" style={{ color: c.textColor, backgroundColor: c.bgColor }}>{c.text}</span>)}</div>}
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