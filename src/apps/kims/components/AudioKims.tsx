import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Timer, Medal, ArrowLeft, Info, CheckCircle2, XCircle, HelpCircle, Volume2, VolumeX, Headphones, Play, Trash2, Music } from 'lucide-react'
import { GameConfig, GameResult, AudioClip } from '../types'
import { shuffleArray } from '../data/items'
import { Sound, playSoundEffect, SOUND_LIBRARY, SoundItem } from '../hooks/useSound'

interface Props {
  config: GameConfig
  playerName?: string
  onBack: () => void
  onResult: (result: GameResult) => void
}

type Phase = 'setup' | 'listening' | 'answering' | 'results'

export default function AudioKims({ config, playerName, onBack, onResult }: Props) {
  const [phase, setPhase] = useState<Phase>('setup')
  const [roundSounds, setRoundSounds] = useState<(SoundItem | AudioClip)[]>([])
  const [currentSoundIndex, setCurrentSoundIndex] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [allPlayed, setAllPlayed] = useState(false)
  const [timer, setTimer] = useState(0)
  const [selectedChoices, setSelectedChoices] = useState<string[]>([])
  const [score, setScore] = useState(0)
  const [showAnswers, setShowAnswers] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [startTime, setStartTime] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [uploadedAudio, setUploadedAudio] = useState<AudioClip[]>([])
  const [nowPlaying, setNowPlaying] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const difficulty = config.difficulty

  const gameConfig = useMemo(() => ({
    easy: { count: 4, answerTime: 60, poolSize: 12 },
    medium: { count: 6, answerTime: 50, poolSize: 18 },
    hard: { count: 8, answerTime: 40, poolSize: 24 },
  }), [])

  // Get all available sounds (built-in + uploaded)
  const allSounds = useMemo(() => {
    const builtIn: (SoundItem | AudioClip)[] = SOUND_LIBRARY
    const uploaded = uploadedAudio
    return [...builtIn, ...uploaded]
  }, [uploadedAudio])

  // Handle audio file upload
  const handleAudioUpload = useCallback((files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        // Create audio element to measure duration
        const audio = new Audio(dataUrl)
        audio.onloadedmetadata = () => {
          // Auto-trim: if longer than 3 seconds, we note the duration
          setUploadedAudio(prev => [...prev, {
            id: `audio-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: file.name.replace(/\.[^/.]+$/, ''),
            dataUrl,
            duration: audio.duration,
          }])
        }
        // Fallback if can't get duration
        setTimeout(() => {
          setUploadedAudio(prev => {
            if (prev.some(a => a.dataUrl === dataUrl)) return prev
            return [...prev, {
              id: `audio-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              name: file.name.replace(/\.[^/.]+$/, ''),
              dataUrl,
              duration: 3,
            }]
          })
        }, 500)
      }
      reader.readAsDataURL(file)
    })
    if (soundEnabled) Sound.playerJoin()
  }, [soundEnabled])

  // Delete uploaded audio
  const deleteAudio = useCallback((id: string) => {
    setUploadedAudio(prev => prev.filter(a => a.id !== id))
  }, [])

  // Play a sound (built-in or uploaded)
  const playSound = useCallback((sound: SoundItem | AudioClip) => {
    if ('effectId' in sound) {
      // Built-in sound
      playSoundEffect(sound.effectId)
      setNowPlaying(sound.id)
      setTimeout(() => setNowPlaying(null), 600)
    } else {
      // Uploaded audio
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
      const audio = new Audio(sound.dataUrl)
      audioRef.current = audio
      audio.play()
      setNowPlaying(sound.id)
      audio.onended = () => setNowPlaying(null)
    }
  }, [])

  const initGame = useCallback(() => {
    const cfg = gameConfig[difficulty]
    const pool = shuffleArray(allSounds).slice(0, cfg.poolSize)
    const selected = pool.slice(0, cfg.count)
    setRoundSounds(selected)
    setCurrentSoundIndex(-1)
    setAllPlayed(false)
    setIsPlaying(false)
    setSelectedChoices([])
    setScore(0)
    setShowAnswers(false)
    setSubmitted(false)
    setStartTime(Date.now())
    setPhase('listening')
    if (soundEnabled) Sound.gameStart()
  }, [difficulty, gameConfig, allSounds, soundEnabled])

  // Play all sounds
  const playAll = useCallback(() => {
    setCurrentSoundIndex(-1)
    setIsPlaying(true)
    setAllPlayed(false)
    let idx = 0
    const playNextSound = () => {
      if (idx >= roundSounds.length) {
        setAllPlayed(true)
        setIsPlaying(false)
        return
      }
      setCurrentSoundIndex(idx)
      const s = roundSounds[idx]
      playSound(s)
      idx++
      setTimeout(playNextSound, 1500)
    }
    playNextSound()
  }, [roundSounds, playSound])

  // Auto transition to answering
  useEffect(() => {
    if (phase !== 'listening') return
    if (allPlayed) {
      const delay = setTimeout(() => {
        setPhase('answering')
        const cfg = gameConfig[difficulty]
        setTimer(cfg.answerTime)
        if (soundEnabled) Sound.submit()
      }, 1500)
      return () => clearTimeout(delay)
    }
  }, [phase, allPlayed, soundEnabled, difficulty, gameConfig])

  // Answer timer
  useEffect(() => {
    if (phase !== 'answering') return
    if (timer <= 0) {
      if (!submitted) { setSubmitted(true); if (soundEnabled) Sound.timeout(); setPhase('results') }
      return
    }
    if (timer <= 5 && timer > 0 && soundEnabled) Sound.tick()
    const interval = window.setInterval(() => setTimer(prev => prev - 1), 1000)
    return () => window.clearInterval(interval)
  }, [phase, timer, soundEnabled, submitted])

  const answerPool = useMemo(() => {
    const pool = shuffleArray(allSounds).slice(0, 30)
    return shuffleArray([...roundSounds, ...pool]).slice(0, roundSounds.length * 2 + 4)
  }, [roundSounds, allSounds])

  const result = useMemo((): GameResult => {
    const targetIds = roundSounds.map(s => s.id)
    const guessed = selectedChoices
    const correct = guessed.filter(id => targetIds.includes(id)).length
    const wrong = guessed.filter(id => !targetIds.includes(id)).length
    const missed = roundSounds.length - correct
    const accuracy = roundSounds.length ? Math.round((correct / roundSounds.length) * 100) : 0
    let rank = '初學聽眾'
    if (accuracy >= 90) rank = '金耳朵大師'
    else if (accuracy >= 75) rank = '銀耳朵高手'
    else if (accuracy >= 60) rank = '銅耳朵'
    return { correct, wrong, missed, accuracy, score: correct * 15 - wrong * 5, rank, timeUsed: Math.round((Date.now() - startTime) / 1000) }
  }, [roundSounds, selectedChoices, startTime])

  /* 遊戲結束時回報成績（更新積分榜） */
  const reportedRef = useRef(false)
  useEffect(() => {
    if (phase !== 'results' || reportedRef.current) return
    reportedRef.current = true
    onResult(result)
  }, [phase, result, onResult])

  const handleSubmit = useCallback(() => {
    if (submitted) return
    setSubmitted(true)
    if (soundEnabled) Sound.submit()
    setPhase('results')
  }, [submitted, soundEnabled])

  return (
    <div className="space-y-4">
      {/* Hidden audio element for file playback */}
      <audio ref={audioRef} className="hidden" />

      <div className="flex items-center justify-between rounded-xl bg-[#02133E]/60 border border-blue-800/30 p-2.5">
        <button onClick={onBack} className="flex items-center gap-1 text-blue-100 hover:text-blue-100 text-xs"><ArrowLeft size={14} /> 返回</button>
        <div className="flex items-center gap-2 text-xs text-blue-200">
          <Headphones size={14} />
          <span>聽覺金氏</span>
          {playerName && (<><span className="text-blue-200">|</span><span className="text-white">{playerName}</span></>)}
          <span className="text-blue-200">|</span>
          <span className="text-amber-300 font-bold">{score} 分</span>
        </div>
        <button onClick={() => setSoundEnabled(!soundEnabled)} className="text-blue-100 hover:text-white">{soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}</button>
      </div>

      {/* Setup */}
      {phase === 'setup' && (
        <div className="rounded-2xl border border-blue-800/30 bg-[#02133E]/60 p-5">
          <div className="text-center mb-4">
            <div className="text-5xl mb-2">🎧</div>
            <h2 className="text-xl font-bold text-white">聽覺金氏遊戲</h2>
            <p className="text-blue-100 text-xs">聆聽聲音序列，考驗聽覺記憶力</p>
            {playerName && <div className="mt-1 inline-block rounded-full bg-amber-400/20 px-3 py-0.5 text-xs text-amber-300">🎯 {playerName}</div>}
            <div className="mt-2 flex justify-center gap-4 text-xs text-blue-200">
              <span>🎵 {gameConfig[difficulty].count} 種聲音</span>
              <span>✍️ {gameConfig[difficulty].answerTime}s</span>
            </div>
          </div>

          {/* Audio upload */}
          <div className="rounded-lg border border-blue-700/30 bg-[#0a1e4a]/40 p-3 mb-3">
            <label className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-blue-700/40 px-4 py-3 text-xs text-blue-100 cursor-pointer hover:border-amber-400/50 transition-colors">
              <Music size={16} />
              上傳音訊檔（MP3/WAV）
              <input type="file" multiple accept="audio/*" onChange={e => handleAudioUpload(e.target.files)} className="hidden" />
            </label>
            {uploadedAudio.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-[10px] text-blue-200">已上傳 {uploadedAudio.length} 個音訊</p>
                {uploadedAudio.map(a => (
                  <div key={a.id} className="flex items-center justify-between rounded bg-blue-900/30 px-2 py-1 text-xs">
                    <span className="text-blue-200 truncate max-w-[150px]">{a.name}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-blue-200">{Math.round(a.duration)}s</span>
                      <button onClick={() => playSound(a)} className="text-blue-100 hover:text-white p-0.5"><Play size={10} /></button>
                      <button onClick={() => deleteAudio(a.id)} className="text-rose-400 hover:text-rose-300 p-0.5"><Trash2 size={10} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={initGame} className="w-full rounded-xl bg-amber-400 py-3 font-bold text-stone-900 hover:bg-amber-300 text-sm">🎧 開始聆聽</button>
        </div>
      )}

      {/* Listening */}
      {phase === 'listening' && (
        <div className="rounded-2xl border border-blue-800/30 bg-[#02133E]/60 p-5 text-center">
          <div className="text-5xl mb-2 animate-bounce">🎧</div>
          <h2 className="text-lg font-bold text-white mb-2">👂 仔細聆聽</h2>
          <p className="text-blue-100 text-xs mb-3">{allPlayed ? '全部播放完畢！' : isPlaying ? '正在播放...' : '準備就緒'}</p>

          {roundSounds.length > 0 && (
            <div className="flex justify-center gap-1.5 mb-3">
              {roundSounds.map((s, idx) => (
                <div key={s.id} className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all ${
                  idx < currentSoundIndex ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40' :
                  idx === currentSoundIndex ? 'bg-amber-500/30 text-amber-300 border border-amber-400 animate-pulse' :
                  'bg-blue-900/30 text-blue-200 border border-blue-700/20'
                }`}>
                  {idx < currentSoundIndex ? '✓' : idx === currentSoundIndex ? '🔊' : '🎵'}
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-center gap-2">
            {!allPlayed ? (
              <button onClick={playAll} disabled={isPlaying} className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-900 font-bold text-sm disabled:opacity-70">
                {isPlaying ? '🔊 播放中...' : '▶️ 播放全部'}
              </button>
            ) : (
              <button onClick={() => { setPhase('answering'); setTimer(gameConfig[difficulty].answerTime) }} className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-900 font-bold text-sm animate-pulse">
                ✍️ 開始作答
              </button>
            )}
          </div>

          {allPlayed && (
            <div className="mt-3 flex flex-wrap justify-center gap-1">
              {roundSounds.map(s => (
                <button key={s.id} onClick={() => playSound(s)} className="flex items-center gap-1 rounded-full bg-[#0a1e4a]/50 border border-blue-700/20 px-2 py-0.5 text-[10px] text-blue-200 hover:border-amber-400/50">
                  <Play size={8} /> {'emoji' in s ? s.emoji : '🔊'} {'name' in s ? s.name : (s as AudioClip).name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Answering */}
      {phase === 'answering' && (
        <div className="rounded-2xl border border-blue-800/30 bg-[#02133E]/60 p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-white">✍️ 回答</h2>
            <div className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold ${timer <= 5 ? 'bg-rose-500 text-white animate-pulse' : 'bg-amber-400/80 text-stone-900'}`}>
              <Timer size={12} /> {timer}s
            </div>
          </div>

          <div className="flex flex-wrap gap-1 mb-2">
            {roundSounds.map(s => (
              <button key={s.id} onClick={() => playSound(s)} className="flex items-center gap-1 rounded-full bg-[#0a1e4a]/40 border border-blue-700/20 px-2 py-0.5 text-[10px] text-blue-200 hover:border-amber-400/50">
                <Play size={8} /> {'emoji' in s ? s.emoji : '🔊'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-1.5 md:grid-cols-4">
            {answerPool.map(item => {
              const checked = selectedChoices.includes(item.id)
              const isCurrentlyPlaying = nowPlaying === item.id
              return (
                <button key={item.id} onClick={() => {
                  setSelectedChoices(prev => checked ? prev.filter(x => x !== item.id) : [...prev, item.id])
                  playSound(item)
                }}
                  className={`rounded-lg border px-2 py-2 text-left transition-all ${checked ? 'border-amber-300/60 bg-amber-300/10 text-amber-200' : 'border-blue-700/20 bg-[#0a1e4a]/30 text-blue-200 hover:bg-blue-800/20'} ${isCurrentlyPlaying ? 'ring-2 ring-amber-400' : ''}`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{'emoji' in item ? item.emoji : '🔊'}</span>
                    <div>
                      <div className="text-xs font-medium truncate max-w-[80px]">{item.name}</div>
                      <div className="text-[10px] text-blue-200">{'category' in item ? item.category : '自訂'}</div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          <button onClick={handleSubmit} disabled={submitted} className={`mt-3 w-full rounded-xl py-2.5 text-xs font-bold ${submitted ? 'bg-blue-900/30 text-blue-200' : 'bg-amber-400 text-stone-900 hover:bg-amber-300'}`}>
            {submitted ? '已提交' : `📤 提交 (${selectedChoices.length} 項)`}
          </button>
        </div>
      )}

      {/* Results */}
      {phase === 'results' && (
        <div className="rounded-2xl border border-blue-800/30 bg-[#02133E]/60 p-5">
          <h2 className="text-sm font-bold text-white mb-3">📊 結果</h2>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="rounded-lg bg-emerald-900/30 p-2 text-center"><CheckCircle2 className="mx-auto mb-0.5 text-emerald-400" size={16} /><div className="text-[10px] text-emerald-300">正確</div><div className="text-lg font-bold text-emerald-400">{result.correct}</div></div>
            <div className="rounded-lg bg-rose-900/30 p-2 text-center"><XCircle className="mx-auto mb-0.5 text-rose-400" size={16} /><div className="text-[10px] text-rose-300">錯誤</div><div className="text-lg font-bold text-rose-400">{result.wrong}</div></div>
            <div className="rounded-lg bg-cyan-900/30 p-2 text-center"><HelpCircle className="mx-auto mb-0.5 text-cyan-400" size={16} /><div className="text-[10px] text-cyan-300">遺漏</div><div className="text-lg font-bold text-cyan-400">{result.missed}</div></div>
          </div>
          <div className="rounded-lg border border-amber-300/30 bg-amber-300/10 p-3 text-center mb-3">
            <div className="text-[10px] text-amber-200">聽覺記憶準確率</div>
            <div className="text-2xl font-bold text-amber-400">{result.accuracy}%</div>
            <div className="flex items-center justify-center gap-1 mt-1 text-xs text-amber-200"><Medal size={14} /> {result.rank}</div>
            <div className="text-sm font-bold text-white mt-1">+{result.score} 分</div>
          </div>
          <div className="mb-3">
            <button onClick={() => setShowAnswers(!showAnswers)} className="text-xs text-blue-100 hover:text-blue-100 flex items-center gap-1"><Info size={12} />{showAnswers ? '隱藏' : '顯示'}答案</button>
            {showAnswers && <div className="mt-1 flex flex-wrap gap-1">{roundSounds.map(s => <button key={s.id} onClick={() => playSound(s)} className="flex items-center gap-1 rounded-full bg-blue-900/40 px-2 py-0.5 text-[10px] text-blue-200 hover:border-amber-400/50"><Play size={8} /> {'emoji' in s ? s.emoji : '🔊'} {'name' in s ? s.name : (s as AudioClip).name}</button>)}</div>}
          </div>
          <div className="flex gap-2">
            <button onClick={initGame} className="flex-1 rounded-lg bg-amber-400 py-2.5 text-xs font-bold text-stone-900 hover:bg-amber-300">🔄 再來</button>
            <button onClick={onBack} className="flex-1 rounded-lg border border-blue-600/50 bg-blue-900/30 py-2.5 text-xs text-blue-200">⬅️ 返回</button>
          </div>
        </div>
      )}
    </div>
  )
}