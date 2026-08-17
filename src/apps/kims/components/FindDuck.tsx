import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Timer, ArrowLeft, Target, Volume2, VolumeX } from 'lucide-react'
import { GameConfig, GameResult } from '../types'
import { STICKER_LIBRARY, shuffleArray } from '../data/items'
import { Sound } from '../hooks/useSound'

interface Props {
  config: GameConfig
  playerName?: string
  onBack: () => void
  onResult: (result: GameResult) => void
}

interface Sticker {
  id: string
  name: string
  emoji: string
  x: number
  y: number
  size: number
  rotation: number
  isTarget: boolean
}

export default function FindDuck({ config, playerName, onBack, onResult }: Props) {
  const [phase, setPhase] = useState<'setup' | 'playing' | 'results'>('setup')
  const [timer, setTimer] = useState(0)
  const [stickers, setStickers] = useState<Sticker[]>([])
  const [targetItem, setTargetItem] = useState<{ id: string; name: string; emoji: string } | null>(null)
  const [found, setFound] = useState(false)
  const [score, setScore] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [startTime, setStartTime] = useState(0)
  const [targetFound, setTargetFound] = useState(false)
  const [message, setMessage] = useState('')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [submitted, setSubmitted] = useState(false)

  const difficulty = config.difficulty

  const gameConfig = useMemo(() => ({
    easy: { total: 20, targetCount: 1, time: 60, sizeRange: [28, 40] as [number, number] },
    medium: { total: 35, targetCount: 2, time: 45, sizeRange: [22, 36] as [number, number] },
    hard: { total: 50, targetCount: 3, time: 30, sizeRange: [16, 30] as [number, number] },
  }), [])

  const initGame = useCallback(() => {
    const cfg = gameConfig[difficulty]
    const pool = shuffleArray(STICKER_LIBRARY)
    const targets = pool.slice(0, cfg.targetCount)
    const rest = pool.slice(cfg.targetCount)

    const items: Sticker[] = []

    targets.forEach(t => {
      const size = cfg.sizeRange[0] + Math.random() * (cfg.sizeRange[1] - cfg.sizeRange[0])
      items.push({
        id: t.id,
        name: t.name,
        emoji: t.emoji,
        x: Math.random() * 85 + 5,
        y: Math.random() * 80 + 5,
        size,
        rotation: (Math.random() - 0.5) * 30,
        isTarget: true,
      })
    })

    const remaining = cfg.total - cfg.targetCount
    for (let i = 0; i < remaining && i < rest.length; i++) {
      const r = rest[i]
      const size = cfg.sizeRange[0] + Math.random() * (cfg.sizeRange[1] - cfg.sizeRange[0])
      items.push({
        id: r.id,
        name: r.name,
        emoji: r.emoji,
        x: Math.random() * 85 + 5,
        y: Math.random() * 80 + 5,
        size,
        rotation: (Math.random() - 0.5) * 30,
        isTarget: false,
      })
    }

    setStickers(shuffleArray(items))
    setTargetItem(targets[0])
    setFound(false)
    setTargetFound(false)
    setAttempts(0)
    setScore(0)
    setMessage(`找出所有「${targets.map(t => t.emoji + t.name).join('、')}」`)
    setPhase('playing')
    setTimer(cfg.time)
    setStartTime(Date.now())
    setSubmitted(false)
    if (soundEnabled) Sound.gameStart()
  }, [difficulty, gameConfig, soundEnabled])

  // Timer
  useEffect(() => {
    if (phase !== 'playing') return
    if (timer <= 0) {
      if (!submitted) {
        setSubmitted(true)
        if (soundEnabled) Sound.timeout()
        setPhase('results')
      }
      return
    }

    // Tick 音效最後5秒
    if (timer <= 5 && timer > 0 && soundEnabled) {
      Sound.tick()
    }

    const interval = window.setInterval(() => setTimer(prev => prev - 1), 1000)
    return () => window.clearInterval(interval)
  }, [phase, timer, soundEnabled, submitted])

  const handleClick = (sticker: Sticker) => {
    if (phase !== 'playing' || targetFound) return
    setAttempts(prev => prev + 1)

    if (sticker.isTarget) {
      setFound(true)
      setTargetFound(true)
      const timeUsed = Math.round((Date.now() - startTime) / 1000)
      const bonus = Math.max(0, 50 - timeUsed * 2)
      const finalScore = bonus + 10
      setScore(finalScore)
      setMessage(`🎉 找到了！用了 ${timeUsed} 秒！`)
      if (soundEnabled) Sound.correct()
      setTimeout(() => setPhase('results'), 1500)
    } else {
      setScore(prev => Math.max(0, prev - 2))
      setMessage('❌ 不對哦，再找找！')
      if (soundEnabled) Sound.wrong()
    }
  }

  const result = useMemo((): GameResult => ({
    correct: found ? 1 : 0,
    wrong: attempts - (found ? 1 : 0),
    missed: found ? 0 : 1,
    accuracy: found ? 100 : 0,
    score,
    rank: found ? '偵察兵' : '新丁',
    timeUsed: Math.round((Date.now() - startTime) / 1000),
  }), [found, attempts, score, startTime])

  // 當結果產生，通知上層
  useEffect(() => {
    if (phase === 'results' && !submitted) {
      setSubmitted(true)
    }
  }, [phase, submitted])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl bg-[#02133E]/80 border border-blue-800/50 p-3">
        <button onClick={onBack} className="flex items-center gap-1 text-blue-300 hover:text-blue-100 text-sm">
          <ArrowLeft size={16} /> 返回
        </button>
        <div className="flex items-center gap-2 text-sm text-blue-200">
          <Target size={14} />
          <span>找物件</span>
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
          <div className="text-6xl mb-3">🔍</div>
          <h2 className="text-2xl font-bold text-white">找物件遊戲</h2>
          <p className="text-blue-300 mt-1">在雜亂的圖案中找出指定的目標</p>
          {playerName && (
            <div className="mt-2 inline-block rounded-full bg-amber-400/20 border border-amber-400/30 px-4 py-1 text-sm text-amber-300">
              🎯 參賽者：{playerName}
            </div>
          )}
          <div className="mt-4 flex justify-center gap-6 text-sm text-blue-200">
            <span>🎯 {gameConfig[difficulty].targetCount} 個目標</span>
            <span>📦 {gameConfig[difficulty].total} 個圖案</span>
            <span>⏱️ {gameConfig[difficulty].time} 秒限時</span>
          </div>
          <button onClick={initGame} className="mt-6 px-8 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-900 font-bold text-lg transition-all hover:scale-105 active:scale-95">
            🔍 開始尋找
          </button>
        </div>
      )}

      {phase === 'playing' && (
        <div>
          <div className="flex items-center justify-between rounded-xl bg-[#02133E]/80 border border-blue-800/40 p-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">{targetItem?.emoji}</span>
              <span className="text-white font-semibold">找出所有 {targetItem?.name}</span>
            </div>
            <div className={`rounded-lg px-3 py-1 font-bold ${timer <= 5 ? 'bg-rose-500 text-white animate-pulse' : 'bg-amber-400 text-stone-900'}`}>
              <Timer size={16} className="inline mr-1" />{timer}s
            </div>
          </div>

          {message && (
            <div className={`text-center text-sm mb-2 p-2 rounded-lg ${message.includes('🎉') ? 'bg-emerald-900/30 text-emerald-400' : 'bg-rose-900/30 text-rose-400'}`}>
              {message}
            </div>
          )}

          <div className="relative min-h-[400px] bg-[#0a1e4a] rounded-xl border border-blue-700/30 p-4 overflow-hidden cursor-pointer">
            {stickers.map(sticker => (
              <button
                key={sticker.id}
                onClick={() => handleClick(sticker)}
                className="absolute hover:scale-125 transition-all duration-200 hover:z-50 active:scale-90"
                style={{
                  left: `${sticker.x}%`,
                  top: `${sticker.y}%`,
                  fontSize: `${sticker.size}px`,
                  transform: `rotate(${sticker.rotation}deg)`,
                  zIndex: sticker.isTarget ? 10 : 5,
                  filter: !sticker.isTarget && targetFound ? 'grayscale(0.5) opacity(0.5)' : 'none',
                }}
                title={sticker.name}
              >
                {sticker.emoji}
              </button>
            ))}
          </div>

          <div className="mt-2 text-xs text-blue-400 text-center">
            嘗試次數：{attempts} | 扣分：{Math.max(0, attempts - (found ? 1 : 0)) * 2}
          </div>
        </div>
      )}

      {phase === 'results' && (
        <div className="rounded-2xl border border-blue-800/40 bg-[#02133E]/80 p-6 text-center">
          <div className="text-6xl mb-3">{found ? '🎉' : '😅'}</div>
          <h2 className="text-2xl font-bold text-white">{found ? '恭喜找到目標！' : '時間到了！'}</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 max-w-xs mx-auto">
            <div className="rounded-xl bg-blue-900/40 p-3 border border-blue-700/30">
              <div className="text-xs text-blue-300">得分</div>
              <div className="text-2xl font-bold text-amber-400">{score}</div>
            </div>
            <div className="rounded-xl bg-blue-900/40 p-3 border border-blue-700/30">
              <div className="text-xs text-blue-300">嘗試</div>
              <div className="text-2xl font-bold text-white">{attempts}</div>
            </div>
          </div>
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