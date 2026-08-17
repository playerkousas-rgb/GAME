import { useState, useEffect, useMemo, useCallback } from 'react'
import { Timer, ArrowLeft, CheckCircle2, XCircle, Volume2, VolumeX, Eye, Upload, Maximize, Minimize } from 'lucide-react'
import { GameConfig, GameResult } from '../types'
import { Sound } from '../hooks/useSound'

interface Props {
  config: GameConfig
  playerName?: string
  onBack: () => void
  onResult: (result: GameResult) => void
}

interface DiffZone {
  id: string
  x: number
  y: number
  w: number
  h: number
  found: boolean
}

export default function SpotTheDifference({ config, playerName, onBack, onResult }: Props) {
  const [phase, setPhase] = useState<'setup' | 'playing' | 'results'>('setup')
  const [baseImage, setBaseImage] = useState<string | null>(null)
  const [timer, setTimer] = useState(0)
  const [diffZones, setDiffZones] = useState<DiffZone[]>([])
  const [foundCount, setFoundCount] = useState(0)
  const [diffCount, setDiffCount] = useState(0)
  const [wrongClicks, setWrongClicks] = useState(0)
  const [score, setScore] = useState(0)
  const [message, setMessage] = useState('')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [startTime, setStartTime] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const difficulty = config.difficulty

  const gameConfig = useMemo(() => ({
    easy: { diffs: 3, time: 90, zoneSize: 8 },
    medium: { diffs: 5, time: 70, zoneSize: 6 },
    hard: { diffs: 7, time: 50, zoneSize: 5 },
  }), [])

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

  const generateDifferences = useCallback((imageUrl: string) => {
    const cfg = gameConfig[difficulty]
    const zones: DiffZone[] = []
    const positions = new Set<string>()

    for (let i = 0; i < cfg.diffs; i++) {
      let x: number, y: number, key: string
      do {
        x = 8 + Math.random() * 74
        y = 8 + Math.random() * 74
        key = `${Math.round(x)}-${Math.round(y)}`
      } while (positions.has(key))
      positions.add(key)
      zones.push({ id: `diff-${i}`, x, y, w: cfg.zoneSize, h: cfg.zoneSize, found: false })
    }

    setDiffZones(zones)
    setDiffCount(cfg.diffs)
    setFoundCount(0)
    setWrongClicks(0)
    setScore(0)
    setMessage(`🔍 找出 ${cfg.diffs} 處不同！`)
    setPhase('playing')
    setTimer(cfg.time)
    setStartTime(Date.now())
    setSubmitted(false)
    if (soundEnabled) Sound.gameStart()
  }, [difficulty, gameConfig, soundEnabled])

  const handleUpload = useCallback((files: FileList | null) => {
    if (!files || !files[0]) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      setBaseImage(dataUrl)
      generateDifferences(dataUrl)
    }
    reader.readAsDataURL(files[0])
  }, [generateDifferences])

  useEffect(() => {
    if (phase !== 'playing') return
    if (timer <= 0) { if (!submitted) { setSubmitted(true); if (soundEnabled) Sound.timeout(); setPhase('results') } return }
    if (timer <= 5 && timer > 0 && soundEnabled) Sound.tick()
    const interval = window.setInterval(() => setTimer(prev => prev - 1), 1000)
    return () => window.clearInterval(interval)
  }, [phase, timer, soundEnabled, submitted])

  const handleImageClick = useCallback((e: React.MouseEvent<HTMLDivElement>, side: 'left' | 'right') => {
    if (phase !== 'playing') return
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = ((e.clientX - rect.left) / rect.width) * 100
    const clickY = ((e.clientY - rect.top) / rect.height) * 100

    for (const zone of diffZones) {
      if (zone.found) continue
      if (clickX >= zone.x - zone.w/2 && clickX <= zone.x + zone.w/2 && clickY >= zone.y - zone.h/2 && clickY <= zone.y + zone.h/2) {
        setDiffZones(prev => prev.map(z => z.id === zone.id ? { ...z, found: true } : z))
        setFoundCount(prev => {
          const newCount = prev + 1
          const bonus = Math.max(0, 40 - Math.round((Date.now() - startTime) / 1000))
          setScore(s => s + 20 + Math.round(bonus))
          if (soundEnabled) Sound.correct()
          if (newCount >= diffCount) { setMessage('🎉 全部找出！'); setTimeout(() => setPhase('results'), 1500) }
          else setMessage(`✅ 找到 ${newCount}/${diffCount} 處！`)
          return newCount
        })
        return
      }
    }
    setWrongClicks(prev => { setScore(s => Math.max(0, s - 2)); if (soundEnabled) Sound.wrong(); setMessage('❌ 這裡沒有不同'); return prev + 1 })
  }, [phase, diffZones, diffCount, startTime, soundEnabled])

  const result = useMemo((): GameResult => ({
    correct: foundCount, wrong: wrongClicks, missed: diffCount - foundCount,
    accuracy: diffCount ? Math.round((foundCount / diffCount) * 100) : 0,
    score: Math.max(0, score),
    rank: foundCount === diffCount ? 'Photo Hunt 大師' : foundCount >= diffCount * 0.7 ? '觀察家' : '初學偵探',
    timeUsed: Math.round((Date.now() - startTime) / 1000),
  }), [foundCount, wrongClicks, diffCount, score, startTime])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl bg-[#02133E]/60 border border-blue-800/30 p-2.5">
        <button onClick={onBack} className="flex items-center gap-1 text-blue-300 hover:text-blue-100 text-xs"><ArrowLeft size={14} /> 返回</button>
        <div className="flex items-center gap-2 text-xs text-blue-200">
          <Eye size={14} /><span>找不同</span>
          {playerName && (<><span className="text-blue-400">|</span><span className="text-white">{playerName}</span></>)}
          <span className="text-blue-400">|</span>
          <span className="text-amber-300 font-bold">{Math.max(0, score)} 分</span>
        </div>
        <div className="flex gap-1">
          <button onClick={toggleFullscreen} className="text-blue-300 hover:text-white p-1" title={isFullscreen ? '離開全屏' : '全屏顯示'}>{isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}</button>
          <button onClick={() => setSoundEnabled(!soundEnabled)} className="text-blue-300 hover:text-white">{soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}</button>
        </div>
      </div>

      {phase === 'setup' && (
        <div className="rounded-2xl border border-blue-800/30 bg-[#02133E]/60 p-6 text-center">
          <div className="text-5xl mb-3">🖼️</div>
          <h2 className="text-xl font-bold text-white">Photo Hunt 找不同</h2>
          <p className="text-blue-300 text-xs mt-1">上傳一張圖片，左右比較找出系統標記的不同處</p>
          {playerName && <div className="mt-2 inline-block rounded-full bg-amber-400/20 px-3 py-0.5 text-xs text-amber-300">🎯 {playerName}</div>}
          <div className="mt-4 flex justify-center gap-4 text-xs text-blue-200">
            <span>🎯 {gameConfig[difficulty].diffs} 處不同</span><span>⏱️ {gameConfig[difficulty].time}秒</span>
          </div>
          <label className="mt-5 block cursor-pointer rounded-xl border-2 border-dashed border-blue-700/40 p-6 hover:border-amber-400/50">
            <Upload size={32} className="mx-auto mb-2 text-blue-400" />
            <p className="text-sm text-blue-300 font-medium">點擊上傳圖片</p>
            <p className="text-[10px] text-blue-500 mt-1">圖片會分左右兩側顯示</p>
            <input type="file" accept="image/*" onChange={e => handleUpload(e.target.files)} className="hidden" />
          </label>
        </div>
      )}

      {phase === 'playing' && (
        <div>
          <div className="flex items-center justify-between rounded-xl bg-[#02133E]/60 border border-blue-800/30 p-2.5 mb-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-blue-200">找到</span><span className="text-amber-300 font-bold">{foundCount}/{diffCount}</span>
              <span className="text-blue-400">|</span><span className="text-rose-300 text-[10px]">錯誤 {wrongClicks}</span>
            </div>
            <div className={`rounded-lg px-2.5 py-1 text-xs font-bold ${timer <= 10 ? 'bg-rose-500 text-white animate-pulse' : 'bg-amber-400/80 text-stone-900'}`}>
              <Timer size={12} className="inline mr-1" />{timer}s
            </div>
          </div>
          {message && (
            <div className={`text-center text-xs mb-2 p-1.5 rounded-lg ${message.includes('🎉') || message.includes('✅') ? 'bg-emerald-900/30 text-emerald-400' : 'bg-rose-900/30 text-rose-400'}`}>{message}</div>
          )}
          <div className="grid grid-cols-2 gap-2" style={{ maxHeight: '75vh' }}>
            {/* LEFT */}
            <div className={`rounded-xl overflow-hidden border-2 cursor-crosshair transition-all border-blue-700/30 hover:border-amber-400/30`}
              onClick={(e) => handleImageClick(e, 'left')}>
              <div className="text-[10px] text-center text-blue-400 py-1 bg-[#02133E]/60">左圖</div>
              <div className="relative" style={{ maxHeight: '65vh', overflow: 'hidden' }}>
                {baseImage && <img src={baseImage} alt="左圖" className="w-full h-full object-contain" draggable={false} style={{ maxHeight: '65vh' }} />}
                {diffZones.filter(z => z.found).map(zone => (
                  <div key={zone.id} className="absolute border-2 border-emerald-400 rounded-lg flex items-center justify-center pointer-events-none"
                    style={{ left: `${zone.x - zone.w/2}%`, top: `${zone.y - zone.h/2}%`, width: `${zone.w}%`, height: `${zone.h}%`, background: 'rgba(52,211,153,0.15)' }}>
                    <span className="text-xs text-emerald-400 font-bold">✓</span>
                  </div>
                ))}
              </div>
            </div>
            {/* RIGHT */}
            <div className={`rounded-xl overflow-hidden border-2 cursor-crosshair transition-all border-blue-700/30 hover:border-amber-400/30`}
              onClick={(e) => handleImageClick(e, 'right')}>
              <div className="text-[10px] text-center text-blue-400 py-1 bg-[#02133E]/60">右圖（點擊不同處）</div>
              <div className="relative" style={{ maxHeight: '65vh', overflow: 'hidden' }}>
                {baseImage && <img src={baseImage} alt="右圖" className="w-full h-full object-contain" draggable={false} style={{ maxHeight: '65vh' }} />}
                {diffZones.map(zone => (
                  <div key={zone.id} className="absolute pointer-events-none transition-all duration-300"
                    style={{ left: `${zone.x - zone.w/2}%`, top: `${zone.y - zone.h/2}%`, width: `${zone.w}%`, height: `${zone.h}%` }}>
                    {zone.found ? (
                      <div className="w-full h-full border-2 border-emerald-400 rounded-lg flex items-center justify-center" style={{ background: 'rgba(52,211,153,0.15)' }}>
                        <span className="text-xs text-emerald-400 font-bold">✓</span>
                      </div>
                    ) : (
                      <div className="w-full h-full border-2 border-dashed border-amber-400/40 rounded-lg animate-pulse" />
                    )}
                  </div>
                ))}
                {diffZones.filter(z => !z.found).slice(0, 1).map(zone => (
                  <div key={`hint-${zone.id}`} className="absolute pointer-events-none animate-ping opacity-20"
                    style={{ left: `${zone.x - zone.w/2}%`, top: `${zone.y - zone.h/2}%`, width: `${zone.w}%`, height: `${zone.h}%`, border: '1px solid #fbbf24', borderRadius: '8px' }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {phase === 'results' && (
        <div className="rounded-2xl border border-blue-800/30 bg-[#02133E]/60 p-5 text-center">
          <div className="text-5xl mb-2">{foundCount === diffCount ? '🎉' : '🔍'}</div>
          <h2 className="text-lg font-bold text-white">{foundCount === diffCount ? '全部找出！' : '時間到了！'}</h2>
          <div className="mt-3 grid grid-cols-3 gap-2 max-w-xs mx-auto">
            <div className="rounded-lg bg-emerald-900/30 p-2 border border-emerald-700/20"><div className="text-[10px] text-emerald-300">找到</div><div className="text-lg font-bold text-emerald-400">{foundCount}/{diffCount}</div></div>
            <div className="rounded-lg bg-rose-900/30 p-2 border border-rose-700/20"><div className="text-[10px] text-rose-300">錯誤</div><div className="text-lg font-bold text-rose-400">{wrongClicks}</div></div>
            <div className="rounded-lg bg-blue-900/30 p-2 border border-blue-700/20"><div className="text-[10px] text-blue-300">得分</div><div className="text-lg font-bold text-amber-400">{Math.max(0, score)}</div></div>
          </div>
          <button onClick={() => setPhase('setup')} className="mt-4 px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-900 font-bold text-sm">🔄 再玩</button>
        </div>
      )}
    </div>
  )
}