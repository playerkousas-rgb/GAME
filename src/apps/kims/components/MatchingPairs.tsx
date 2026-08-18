import { useState, useEffect, useMemo, useCallback } from 'react'
import { Timer, ArrowLeft, Star, Volume2, VolumeX } from 'lucide-react'
import { GameConfig, GameResult } from '../types'
import { STICKER_LIBRARY, shuffleArray } from '../data/items'
import { Sound } from '../hooks/useSound'

interface Props {
  config: GameConfig
  playerName?: string
  onBack: () => void
  onResult: (result: GameResult) => void
}

interface Card {
  id: string
  pairId: string
  emoji: string
  name: string
  flipped: boolean
  matched: boolean
}

export default function MatchingPairs({ config, playerName, onBack }: Props) {
  const [phase, setPhase] = useState<'setup' | 'playing' | 'results'>('setup')
  const [cards, setCards] = useState<Card[]>([])
  const [flippedIds, setFlippedIds] = useState<string[]>([])
  const [matchedPairs, setMatchedPairs] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [timer, setTimer] = useState(0)
  const [score, setScore] = useState(0)
  const [isChecking, setIsChecking] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [submitted, setSubmitted] = useState(false)

  const pairCount = useMemo(() => {
    if (config.difficulty === 'easy') return 6
    if (config.difficulty === 'medium') return 10
    return 15
  }, [config.difficulty])

  const timeLimit = useMemo(() => {
    if (config.difficulty === 'easy') return 120
    if (config.difficulty === 'medium') return 180
    return 300
  }, [config.difficulty])

  const initGame = useCallback(() => {
    const selected = shuffleArray(STICKER_LIBRARY).slice(0, pairCount)
    const cardPairs: Card[] = []
    selected.forEach(item => {
      cardPairs.push({
        id: `${item.id}-a`,
        pairId: item.id,
        emoji: item.emoji,
        name: item.name,
        flipped: false,
        matched: false,
      })
      cardPairs.push({
        id: `${item.id}-b`,
        pairId: item.id,
        emoji: item.emoji,
        name: item.name,
        flipped: false,
        matched: false,
      })
    })
    setCards(shuffleArray(cardPairs))
    setFlippedIds([])
    setMatchedPairs(0)
    setAttempts(0)
    setScore(0)
    setIsChecking(false)
    setPhase('playing')
    setTimer(timeLimit)
    setSubmitted(false)
    if (soundEnabled) Sound.gameStart()
  }, [pairCount, timeLimit, soundEnabled])

  useEffect(() => {
    if (phase !== 'playing') return
    if (timer <= 0) {
      if (submitted) return
      // 以 timeout 延後，避免在 effect 內同步 setState
      const t = window.setTimeout(() => {
        setSubmitted(true)
        if (soundEnabled) Sound.timeout()
        setPhase('results')
      }, 0)
      return () => window.clearTimeout(t)
    }

    if (timer <= 5 && timer > 0 && soundEnabled) {
      Sound.tick()
    }

    const interval = window.setInterval(() => setTimer(prev => prev - 1), 1000)
    return () => window.clearInterval(interval)
  }, [phase, timer, soundEnabled, submitted])

  const handleCardClick = (cardId: string) => {
    if (isChecking || flippedIds.length >= 2) return
    const card = cards.find(c => c.id === cardId)
    if (!card || card.flipped || card.matched) return

    if (soundEnabled) Sound.click()

    const newCards = cards.map(c => c.id === cardId ? { ...c, flipped: true } : c)
    setCards(newCards)
    const newFlipped = [...flippedIds, cardId]
    setFlippedIds(newFlipped)

    if (newFlipped.length === 2) {
      setIsChecking(true)
      setAttempts(prev => prev + 1)
      const [first, second] = newFlipped.map(id => newCards.find(c => c.id === id)!)
      
      if (first.pairId === second.pairId) {
        if (soundEnabled) Sound.match()
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            c.id === first.id || c.id === second.id ? { ...c, matched: true } : c
          ))
          setMatchedPairs(prev => {
            const newVal = prev + 1
            setScore(s => s + 20 + Math.max(0, 30 - attempts * 2))
            if (newVal >= pairCount) {
              setTimeout(() => {
                if (soundEnabled) Sound.victory()
                setPhase('results')
              }, 800)
            }
            return newVal
          })
          setFlippedIds([])
          setIsChecking(false)
        }, 500)
      } else {
        if (soundEnabled) Sound.wrong()
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === first.id || c.id === second.id ? { ...c, flipped: false } : c
          ))
          setFlippedIds([])
          setIsChecking(false)
        }, 800)
      }
    }
  }

  const result = useMemo((): GameResult => ({
    correct: matchedPairs,
    wrong: attempts - matchedPairs,
    missed: pairCount - matchedPairs,
    accuracy: Math.round((matchedPairs / pairCount) * 100),
    score,
    rank: matchedPairs === pairCount ? '記憶大師' : matchedPairs >= pairCount * 0.7 ? '記憶高手' : '初學記憶者',
    timeUsed: Math.max(0, timeLimit - timer),
  }), [matchedPairs, attempts, pairCount, score, timeLimit, timer])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl bg-[#02133E]/80 border border-blue-800/50 p-3">
        <button onClick={onBack} className="flex items-center gap-1 text-blue-300 hover:text-blue-100 text-sm">
          <ArrowLeft size={16} /> 返回
        </button>
        <div className="flex items-center gap-2 text-sm text-blue-200">
          <Star size={14} />
          <span>配對記憶</span>
          {playerName && (
            <>
              <span className="text-blue-400">|</span>
              <span className="text-white">{playerName}</span>
            </>
          )}
          <span className="text-blue-400">|</span>
          <span className="text-amber-300 font-bold">{score} 分</span>
        </div>
        <button onClick={() => setSoundEnabled(!soundEnabled)} className="text-blue-300 hover:text-white">
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
      </div>

      {phase === 'setup' && (
        <div className="rounded-2xl border border-blue-800/40 bg-[#02133E]/80 p-6 text-center">
          <div className="text-6xl mb-3">🧠</div>
          <h2 className="text-2xl font-bold text-white">配對記憶遊戲</h2>
          <p className="text-blue-300 mt-1">翻開卡片，找出相同的配對</p>
          {playerName && (
            <div className="mt-2 inline-block rounded-full bg-amber-400/20 border border-amber-400/30 px-4 py-1 text-sm text-amber-300">
              🎯 參賽者：{playerName}
            </div>
          )}
          <div className="mt-4 flex justify-center gap-6 text-sm text-blue-200">
            <span>🃏 {pairCount * 2} 張卡</span>
            <span>🎯 {pairCount} 對</span>
            <span>⏱️ {timeLimit} 秒限時</span>
          </div>
          <button onClick={initGame} className="mt-6 px-8 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-900 font-bold text-lg transition-all hover:scale-105 active:scale-95">
            🃏 開始遊戲
          </button>
        </div>
      )}

      {phase === 'playing' && (
        <div>
          <div className="flex items-center justify-between rounded-xl bg-[#02133E]/80 border border-blue-800/40 p-3 mb-3">
            <div className="text-sm text-blue-200">
              已配對：{matchedPairs}/{pairCount} | 嘗試：{attempts}
            </div>
            <div className={`rounded-lg px-3 py-1 font-bold ${timer <= 10 ? 'bg-rose-500 text-white animate-pulse' : 'bg-amber-400 text-stone-900'}`}>
              <Timer size={16} className="inline mr-1" />{timer}s
            </div>
          </div>

          <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
            {cards.map(card => (
              <button
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                className={`aspect-square rounded-xl border-2 transition-all duration-300 flex items-center justify-center text-2xl ${
                  card.matched
                    ? 'bg-emerald-900/50 border-emerald-500/50 opacity-60 scale-95'
                    : card.flipped
                    ? 'bg-[#0a1e4a] border-amber-400/70 scale-105 shadow-lg shadow-amber-400/20'
                    : 'bg-blue-900/60 border-blue-700/30 hover:border-blue-500/50 hover:scale-105'
                } ${isChecking ? 'pointer-events-none' : ''}`}
                disabled={card.matched || isChecking}
              >
                <span className={`transition-all duration-300 ${card.flipped || card.matched ? 'scale-100' : 'scale-90'}`}>
                  {card.flipped || card.matched ? card.emoji : '❓'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'results' && (
        <div className="rounded-2xl border border-blue-800/40 bg-[#02133E]/80 p-6 text-center">
          <div className="text-6xl mb-3">{matchedPairs === pairCount ? '🏆' : '💪'}</div>
          <h2 className="text-2xl font-bold text-white">
            {matchedPairs === pairCount ? '全部配對成功！' : '遊戲結束！'}
          </h2>
          <div className="mt-4 grid grid-cols-3 gap-3 max-w-sm mx-auto">
            <div className="rounded-xl bg-blue-900/40 p-3 border border-blue-700/30">
              <div className="text-xs text-blue-300">配對</div>
              <div className="text-xl font-bold text-emerald-400">{matchedPairs}/{pairCount}</div>
            </div>
            <div className="rounded-xl bg-blue-900/40 p-3 border border-blue-700/30">
              <div className="text-xs text-blue-300">嘗試</div>
              <div className="text-xl font-bold text-white">{attempts}</div>
            </div>
            <div className="rounded-xl bg-blue-900/40 p-3 border border-blue-700/30">
              <div className="text-xs text-blue-300">得分</div>
              <div className="text-xl font-bold text-amber-400">{score}</div>
            </div>
          </div>
          <div className="mt-4 text-sm text-blue-300">評級：{result.rank}</div>
          <div className="mt-6 flex gap-3 justify-center">
            <button onClick={initGame} className="px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-900 font-bold">
              🔄 再玩一次
            </button>
            <button onClick={onBack} className="px-6 py-3 rounded-xl border border-blue-600 text-blue-200 font-bold hover:bg-blue-900/50">
              ⬅️ 返回
            </button>
          </div>
        </div>
      )}
    </div>
  )
}