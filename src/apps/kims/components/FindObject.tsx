import { useState, useEffect, useMemo, useCallback } from 'react'
import { Timer, ArrowLeft, Target, Volume2, VolumeX, Upload, Search, Maximize, Minimize } from 'lucide-react'
import { GameConfig, GameResult } from '../types'
import { shuffleArray } from '../data/items'
import { Sound } from '../hooks/useSound'

interface Props {
  config: GameConfig
  playerName?: string
  onBack: () => void
  onResult: (result: GameResult) => void
}

interface HiddenObject {
  id: string
  name: string
  emoji: string
  x: number
  y: number
  size: number
  found: boolean
}

export default function FindObject({ config, playerName, onBack, onResult }: Props) {
  const [phase, setPhase] = useState<'setup' | 'upload-bg' | 'playing' | 'results'>('setup')
  const [bgImage, setBgImage] = useState<string | null>(null)
  const [hiddenObjects, setHiddenObjects] = useState<HiddenObject[]>([])
  const [targetObjects, setTargetObjects] = useState<HiddenObject[]>([])
  const [foundCount, setFoundCount] = useState(0)
  const [wrongClicks, setWrongClicks] = useState(0)
  const [score, setScore] = useState(0)
  const [timer, setTimer] = useState(0)
  const [message, setMessage] = useState('')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [startTime, setStartTime] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const difficulty = config.difficulty

  const gameConfig = useMemo(() => ({
    easy: { objects: 4, time: 90, sizeRange: [32, 42] as [number, number] },
    medium: { objects: 6, time: 70, sizeRange: [28, 38] as [number, number] },
    hard: { objects: 8, time: 50, sizeRange: [22, 32] as [number, number] },
  }), [])

  const OBJECT_EMOJIS = ['⭐', '🔑', '💎', '🍀', '🎯', '🦋', '🐞', '🌸', '📌', '👑', '💍', '🔔', '🪙', '🎀', '🕯️', '🧲', '🔮', '🪄']

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen?.().catch(() => {})
      setIsFullscreen(false)
    }
  }, [])

  const handleBgUpload = useCallback((files: FileList | null) => {
    if (!files || !files[0]) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      setBgImage(dataUrl)
      startObjectGame(dataUrl)
    }
    reader.readAsDataURL(files[0])
  }, [difficulty])

  const startObjectGame = useCallback((bgDataUrl?: string) => {
    const cfg = gameConfig[difficulty]
    const bg = bgDataUrl || bgImage
    if (!bg) return

    const objects: HiddenObject[] = []
    const selectedEmojis = shuffleArray(OBJECT_EMOJIS).slice(0, cfg.objects)

    // Place objects in different quadrants to spread them out
    selectedEmojis.forEach((emoji, idx) => {
      // Divide the image into zones to ensure spread
      const zoneX = (idx % 3) / 3
      const zoneY = Math.floor(idx / 3) / 3
      objects.push({
        id: `obj-${idx}`,
        name: `目標 ${idx + 1}`,
        emoji,
        x: zoneX * 100 + 5 + Math.random() * 20,
        y: zoneY * 100 + 5 + Math.random() * 20,
        size: cfg.sizeRange[0] + Math.random() * (cfg.sizeRange[1] - cfg.sizeRange[0]),
        found: false,
      })
    })

    setHiddenObjects(objects)
    setTargetObjects(objects)
    setFoundCount(0)
    setWrongClicks(0)
    setScore(0)
    setMessage(`🔍 找出 ${cfg.objects} 個隱藏圖標`)
    setPhase('playing')
    setTimer(cfg.time)
    setStartTime(Date.now())
    setSubmitted(false)
    if (bgDataUrl) setBgImage(bgDataUrl)
    if (soundEnabled) Sound.gameStart()
  }, [difficulty, gameConfig, bgImage, soundEnabled])

  useEffect(() => {
    if (phase !== 'playing') return
    if (timer <= 0) {
      if (!submitted) { setSubmitted(true); if (soundEnabled) Sound.timeout(); setPhase('results') }
      return
    }
    if (timer <= 5 && timer > 0 && soundEnabled) Sound.tick()
    const interval = window.setInterval(() => setTimer(prev => prev - 1), 1000)
    return () => window.clearInterval(interval)
  }, [phase, timer, soundEnabled, submitted])

  // Listen for fullscreen change
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const handleSceneClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (phase !== 'playing') return
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = ((e.clientX - rect.left) / rect.width) * 100
    const clickY = ((e.clientY - rect.top) / rect.height) * 100

    let found = false
    for (const obj of hiddenObjects) {
      if (obj.found) continue
      const dist = Math.sqrt((clickX - obj.x) ** 2 + (clickY - obj.y) ** 2)
      if (dist < 10) {
        setHiddenObjects(prev => prev.map(o => o.id === obj.id ? { ...o, found: true } : o))
        setFoundCount(prev => {
          const newCount = prev + 1
          const bonus = Math.max(0, 30 - Math.round((Date.now() - startTime) / 1000) * 0.3)
          setScore(s => s + 15 + Math.round(bonus))
          if (soundEnabled) Sound.correct()
          if (newCount >= targetObjects.length) {
            setMessage('🎉 全部找到！')
            setTimeout(() => setPhase('results'), 1500)
          } else {
            setMessage(`✅ 找到 ${newCount}/${targetObjects.length} 個！`)
          }
          return newCount
        })
        found = true
        break
      }
    }
    if (!found) {
      setWrongClicks(prev => {
        setScore(s => Math.max(0, s - 2))
        if (soundEnabled) Sound.wrong()
        setMessage('❌ 這裡沒有')
        return prev + 1
      })
    }
  }, [phase, hiddenObjects, targetObjects.length, startTime, soundEnabled])

  const result = useMemo((): GameResult => ({
    correct: foundCount,
    wrong: wrongClicks,
    missed: targetObjects.length - foundCount,
    accuracy: targetObjects.length ? Math.round((foundCount / targetObjects.length) * 100) : 0,
    score: Math.max(0, score),
    rank: foundCount === targetObjects.length ? '尋寶王' : foundCount >= targetObjects.length * 0.7 ? '尋寶專家' : '初階尋寶者',
    timeUsed: Math.round((Date.now() - startTime) / 1000),
  }), [foundCount, wrongClicks, targetObjects.length, score, startTime])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl bg-[#02133E]/60 border border-blue-800/30 p-2.5">
        <button onClick={onBack} className="flex items-center gap-1 text-blue-300 hover:text-blue-100 text-xs"><ArrowLeft size={14} /> 返回</button>
        <div className="flex items-center gap-2 text-xs text-blue-200">
          <Search size={14} /><span>找物件</span>
          {playerName && (<><span className="text-blue-400">|</span><span className="text-white">{playerName}</span></>)}
          <span className="text-blue-400">|</span>
          <span className="text-amber-300 font-bold">{Math.max(0, score)} 分</span>
        </div>
        <div className="flex gap-1">
          <button onClick={toggleFullscreen} className="text-blue-300 hover:text-white p-1" title={isFullscreen ? '離開全屏' : '全屏顯示'}>
            {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
          </button>
          <button onClick={() => setSoundEnabled(!soundEnabled)} className="text-blue-300 hover:text-white">{soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}</button>
        </div>
      </div>

      {phase === 'setup' && (
        <div className="rounded-2xl border border-blue-800/30 bg-[#02133E]/60 p-6 text-center">
          <div className="text-5xl mb-3">🔍</div>
          <h2 className="text-xl font-bold text-white">找物件遊戲</h2>
          <p className="text-blue-300 text-xs mt-1">上傳圖片做底圖，找出圖中隱藏的小圖標</p>
          {playerName && <div className="mt-2 inline-block rounded-full bg-amber-400/20 px-3 py-0.5 text-xs text-amber-300">🎯 {playerName}</div>}
          <div className="mt-4 flex justify-center gap-4 text-xs text-blue-200">
            <span>🎯 {gameConfig[difficulty].objects} 個</span><span>⏱️ {gameConfig[difficulty].time}秒</span>
          </div>
          <label className="mt-5 block cursor-pointer rounded-xl border-2 border-dashed border-blue-700/40 p-6 hover:border-amber-400/50">
            <Upload size={32} className="mx-auto mb-2 text-blue-400" />
            <p className="text-sm text-blue-300 font-medium">點擊上傳底圖</p>
            <p className="text-[10px] text-blue-500 mt-1">上傳圖片後會在上面放置隱藏小圖標</p>
            <input type="file" accept="image/*" onChange={e => handleBgUpload(e.target.files)} className="hidden" />
          </label>
        </div>
      )}

      {phase === 'playing' && (
        <div>
          <div className="flex items-center justify-between rounded-xl bg-[#02133E]/60 border border-blue-800/30 p-2.5 mb-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-blue-200">找到</span><span className="text-amber-300 font-bold">{foundCount}/{targetObjects.length}</span>
              <span className="text-blue-400">|</span><span className="text-rose-300 text-[10px]">錯誤 {wrongClicks}</span>
            </div>
            <div className={`rounded-lg px-2.5 py-1 text-xs font-bold ${timer <= 10 ? 'bg-rose-500 text-white animate-pulse' : 'bg-amber-400/80 text-stone-900'}`}>
              <Timer size={12} className="inline mr-1" />{timer}s
            </div>
          </div>
          {message && (
            <div className={`text-center text-xs mb-2 p-1.5 rounded-lg ${message.includes('🎉') || message.includes('✅') ? 'bg-emerald-900/30 text-emerald-400' : 'bg-rose-900/30 text-rose-400'}`}>
              {message}
            </div>
          )}

          {/* 場景圖 - 修正：圖填滿容器，物件在圖之上 */}
          <div className="relative rounded-xl overflow-hidden cursor-crosshair border border-blue-700/30 bg-black"
            onClick={handleSceneClick}
            style={{ minHeight: 300, maxHeight: '80vh' }}
          >
            {/* 底圖 - 用 object-cover 填滿不變形裁切 */}
            {bgImage && (
              <img src={bgImage} alt="場景" className="w-full h-full object-contain pointer-events-none" draggable={false} style={{ maxHeight: '80vh' }} />
            )}
            {/* 隱藏物件 - 在圖之上 (z-index > img) */}
            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
              {hiddenObjects.map(obj => (
                <div
                  key={obj.id}
                  className="absolute transition-all duration-300"
                  style={{
                    left: `${obj.x}%`,
                    top: `${obj.y}%`,
                    fontSize: `${obj.size}px`,
                    opacity: obj.found ? 1 : 0.6,
                    transform: obj.found ? 'scale(1.3) translateY(-5px)' : 'scale(1)',
                    filter: obj.found ? 'drop-shadow(0 0 10px #fbbf24) brightness(1.3)' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                    zIndex: 20,
                    pointerEvents: 'auto',
                    textShadow: obj.found ? '0 0 20px rgba(251,191,36,0.8)' : '0 2px 4px rgba(0,0,0,0.8)',
                    cursor: 'pointer',
                  }}
                >
                  {obj.emoji}
                  {obj.found && (
                    <span className="absolute -top-2 -right-2 text-xs bg-emerald-500 rounded-full w-5 h-5 flex items-center justify-center text-white font-bold shadow-lg">✓</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 目標提示條 */}
          <div className="mt-2 flex flex-wrap gap-1.5 justify-center">
            {targetObjects.map(obj => {
              const h = hiddenObjects.find(h => h.id === obj.id)
              return (
                <div key={obj.id} className={`rounded-lg px-2 py-1 text-xs flex items-center gap-1 transition-all ${h?.found ? 'bg-emerald-900/40 border border-emerald-500/30 text-emerald-300' : 'bg-blue-900/30 border border-blue-700/20 text-blue-300'}`}>
                  <span className="text-lg">{obj.emoji}</span>
                  {h?.found ? '✓' : '?'}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {phase === 'results' && (
        <div className="rounded-2xl border border-blue-800/30 bg-[#02133E]/60 p-5 text-center">
          <div className="text-5xl mb-2">{foundCount === targetObjects.length ? '🎉' : '🔍'}</div>
          <h2 className="text-lg font-bold text-white">{foundCount === targetObjects.length ? '全部找到了！' : '時間到了！'}</h2>
          <div className="mt-3 grid grid-cols-3 gap-2 max-w-xs mx-auto">
            <div className="rounded-lg bg-emerald-900/30 p-2 border border-emerald-700/20"><div className="text-[10px] text-emerald-300">找到</div><div className="text-lg font-bold text-emerald-400">{foundCount}/{targetObjects.length}</div></div>
            <div className="rounded-lg bg-rose-900/30 p-2 border border-rose-700/20"><div className="text-[10px] text-rose-300">錯誤</div><div className="text-lg font-bold text-rose-400">{wrongClicks}</div></div>
            <div className="rounded-lg bg-blue-900/30 p-2 border border-blue-700/20"><div className="text-[10px] text-blue-300">得分</div><div className="text-lg font-bold text-amber-400">{Math.max(0, score)}</div></div>
          </div>
          <button onClick={() => setPhase('setup')} className="mt-4 px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-900 font-bold text-sm">🔄 再玩</button>
        </div>
      )}
    </div>
  )
}