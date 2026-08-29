/**
 * 圖案記憶（前稱文字記憶）— 支援 Emoji 圖案卡、幾何圖形卡、自訂相片卡、文字卡
 * Copyright (c) 2026 Scout System. All rights reserved.
 */
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  Timer, ShieldCheck, Medal, ArrowLeft, Info, CheckCircle2, XCircle, HelpCircle,
  Volume2, VolumeX, Maximize, Minimize, Plus, Shapes, Image as ImageIcon, Type, Trash2, Shuffle,
} from 'lucide-react'
import { GameConfig, GameResult, TEXT_COLORS } from '../types'
import { Sound } from '../hooks/useSound'
import { TEXT_PACKS, packWords } from '../../../data/textPacks'
import { EMOJI_PACKS, SHAPES, SHAPE_COLORS, type ShapeKind } from '../data/symbols'
import ShapeGlyph from './ShapeGlyph'

interface Props {
  config: GameConfig
  playerName?: string
  onBack: () => void
  onResult: (result: GameResult) => void
}

type Phase = 'setup' | 'observe' | 'hidden' | 'answer' | 'results'
type CardKind = 'emoji' | 'shape' | 'image' | 'text'

interface MemCard {
  id: string
  kind: CardKind
  /** 顯示用：emoji 字元 / 文字 */
  glyph: string
  /** 答案名稱 */
  name: string
  shape?: ShapeKind
  color?: string
  imageUrl?: string
  bgColor: string
  textColor: string
}

const BG_PALETTE = ['#12224f', '#7F1D1D', '#064E3B', '#4C1D95', '#334155', '#0C4A6E', '#111827', '#78350F']

const MODES: { id: CardKind; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'emoji', label: '圖案卡', icon: <span className="text-base leading-none">🦁</span>, desc: '大 Emoji 圖案，最易睇' },
  { id: 'shape', label: '圖形卡', icon: <Shapes size={16} />, desc: '形狀＋顏色記憶' },
  { id: 'image', label: '相片卡', icon: <ImageIcon size={16} />, desc: '上傳自訂相片' },
  { id: 'text', label: '文字卡', icon: <Type size={16} />, desc: '傳統中文字卡' },
]

function rnd<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function TextMemory({ config, playerName, onBack, onResult }: Props) {
  const [phase, setPhase] = useState<Phase>('setup')
  const [cards, setCards] = useState<MemCard[]>([])
  const [timer, setTimer] = useState(0)
  const [score] = useState(0)
  const [showAnswers, setShowAnswers] = useState(false)
  const [observeSeconds] = useState(config.observeSeconds)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  const [kind, setKind] = useState<CardKind>('emoji')
  /** 展示方式：逐張全屏 或 一次過網格 */
  const [display, setDisplay] = useState<'sequence' | 'grid'>('grid')
  /** 作答方式：圖案點選 或 打字 */
  const [answerMode, setAnswerMode] = useState<'pick' | 'type'>('pick')

  const [charInput, setCharInput] = useState('')
  const [textColor, setTextColor] = useState('#FFFFFF')
  const [bgColor, setBgColor] = useState('#12224f')

  const [picked, setPicked] = useState<string[]>([])
  const [inputText, setInputText] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

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

  /* 觀察倒數（遮蓋→作答的過渡獨立處理，避免被 phase 變更的 cleanup 取消） */
  useEffect(() => {
    if (phase !== 'observe' && phase !== 'hidden') return
    if (phase === 'hidden') {
      const toAnswer = window.setTimeout(() => {
        setPhase('answer')
        setTimer(config.answerSeconds)
      }, 1500)
      return () => {
        window.clearTimeout(toAnswer)
      }
    }
    if (timer <= 0) {
      if (soundEnabled) Sound.submit()
      const toHidden = window.setTimeout(() => setPhase('hidden'), 0)
      return () => {
        window.clearTimeout(toHidden)
      }
    }
    if (timer <= 5 && timer > 0 && soundEnabled) Sound.tick()
    const interval = window.setInterval(() => setTimer((p) => p - 1), 1000)
    return () => window.clearInterval(interval)
  }, [phase, timer, soundEnabled, config.answerSeconds])

  /* 逐張模式自動翻頁 */
  useEffect(() => {
    if (phase !== 'observe' || display !== 'sequence' || cards.length <= 1) return
    const per = Math.max(1200, Math.floor((observeSeconds * 1000) / cards.length))
    const t = window.setInterval(() => {
      setCurrentIndex((i) => (i + 1 < cards.length ? i + 1 : i))
    }, per)
    return () => window.clearInterval(t)
  }, [phase, display, cards.length, observeSeconds])

  /* 作答倒數 */
  useEffect(() => {
    if (phase !== 'answer') return
    if (timer <= 0) {
      if (submitted) return
      const t = window.setTimeout(() => {
        setSubmitted(true)
        if (soundEnabled) Sound.timeout()
        setPhase('results')
      }, 0)
      return () => window.clearTimeout(t)
    }
    if (timer <= 5 && timer > 0 && soundEnabled) Sound.tick()
    const interval = window.setInterval(() => setTimer((p) => p - 1), 1000)
    return () => window.clearInterval(interval)
  }, [phase, timer, soundEnabled, submitted])

  /* ---------- 產生卡片 ---------- */

  const loadEmojiPack = useCallback(
    (packId: string) => {
      const pack = EMOJI_PACKS.find((p) => p.id === packId)
      if (!pack) return
      const picks = shuffle(pack.items).slice(0, maxCards)
      setCards(
        picks.map((it, i) => ({
          id: `e-${packId}-${Date.now()}-${i}`,
          kind: 'emoji',
          glyph: it.e,
          name: it.n,
          bgColor: rnd(BG_PALETTE),
          textColor: '#FFFFFF',
        })),
      )
      setKind('emoji')
      if (soundEnabled) Sound.click()
    },
    [maxCards, soundEnabled],
  )

  const randomShapes = useCallback(() => {
    const combos = shuffle(
      SHAPES.flatMap((s) => SHAPE_COLORS.map((c) => ({ s, c }))),
    ).slice(0, maxCards)
    setCards(
      combos.map((x, i) => ({
        id: `s-${Date.now()}-${i}`,
        kind: 'shape',
        glyph: '',
        name: `${x.c.name}${x.s.name}`,
        shape: x.s.kind,
        color: x.c.value,
        bgColor: '#0b1c44',
        textColor: '#FFFFFF',
      })),
    )
    setKind('shape')
    if (soundEnabled) Sound.click()
  }, [maxCards, soundEnabled])

  const loadTextPack = useCallback(
    (packId: string) => {
      const pack = TEXT_PACKS.find((p) => p.id === packId)
      if (!pack) return
      const picked2 = shuffle(packWords(pack)).slice(0, maxCards)
      setCards(
        picked2.map((text, i) => ({
          id: `t-${packId}-${Date.now()}-${i}`,
          kind: 'text',
          glyph: text,
          name: text,
          bgColor: rnd(BG_PALETTE),
          textColor: rnd(TEXT_COLORS).value,
        })),
      )
      setKind('text')
      if (soundEnabled) Sound.click()
    },
    [maxCards, soundEnabled],
  )

  const addTextCard = useCallback(() => {
    if (!charInput.trim() || cards.length >= maxCards) return
    setCards((p) => [
      ...p,
      { id: `t-${Date.now()}`, kind: 'text', glyph: charInput.trim(), name: charInput.trim(), bgColor, textColor },
    ])
    setCharInput('')
    if (soundEnabled) Sound.click()
  }, [charInput, cards.length, maxCards, bgColor, textColor, soundEnabled])

  const addImages = useCallback(
    (files: FileList | null) => {
      if (!files) return
      const room = maxCards - cards.length
      const list = Array.from(files).slice(0, Math.max(0, room))
      setCards((p) => [
        ...p,
        ...list.map((f, i) => ({
          id: `i-${Date.now()}-${i}`,
          kind: 'image' as const,
          glyph: '',
          name: f.name.replace(/\.[^/.]+$/, ''),
          imageUrl: URL.createObjectURL(f),
          bgColor: '#0b1c44',
          textColor: '#FFFFFF',
        })),
      ])
      setKind('image')
      if (soundEnabled) Sound.click()
    },
    [cards.length, maxCards, soundEnabled],
  )

  const removeCard = useCallback((id: string) => setCards((p) => p.filter((c) => c.id !== id)), [])

  const reshuffleColors = useCallback(() => {
    setCards((p) => p.map((c) => ({ ...c, bgColor: rnd(BG_PALETTE) })))
  }, [])

  /* ---------- 作答選項池 ---------- */
  const optionPool = useMemo(() => {
    if (phase === 'setup') return []
    const correct = cards
    const distractCount = Math.min(8, Math.max(4, Math.round(cards.length * 0.7)))
    let extras: MemCard[] = []
    if (kind === 'emoji') {
      const used = new Set(cards.map((c) => c.glyph))
      const all = EMOJI_PACKS.flatMap((p) => p.items).filter((it) => !used.has(it.e))
      extras = shuffle(all)
        .slice(0, distractCount)
        .map((it, i) => ({
          id: `dx-${i}`, kind: 'emoji' as const, glyph: it.e, name: it.n,
          bgColor: '#0b1c44', textColor: '#fff',
        }))
    } else if (kind === 'shape') {
      const used = new Set(cards.map((c) => `${c.shape}|${c.color}`))
      const all = SHAPES.flatMap((s) => SHAPE_COLORS.map((c) => ({ s, c }))).filter(
        (x) => !used.has(`${x.s.kind}|${x.c.value}`),
      )
      extras = shuffle(all)
        .slice(0, distractCount)
        .map((x, i) => ({
          id: `dx-${i}`, kind: 'shape' as const, glyph: '', name: `${x.c.name}${x.s.name}`,
          shape: x.s.kind, color: x.c.value, bgColor: '#0b1c44', textColor: '#fff',
        }))
    } else if (kind === 'text') {
      const used = new Set(cards.map((c) => c.name))
      const all = TEXT_PACKS.flatMap((p) => packWords(p)).filter((w) => !used.has(w))
      extras = shuffle(all)
        .slice(0, distractCount)
        .map((w, i) => ({
          id: `dx-${i}`, kind: 'text' as const, glyph: w, name: w,
          bgColor: '#0b1c44', textColor: '#fff',
        }))
    }
    return shuffle([...correct, ...extras])
  }, [phase, cards, kind])

  const startGame = useCallback(() => {
    if (cards.length === 0) return
    setCurrentIndex(0)
    setPhase('observe')
    setTimer(observeSeconds)
    setPicked([])
    setInputText('')
    setSubmitted(false)
    setShowAnswers(false)
    reportedRef.current = false
    if (soundEnabled) Sound.gameStart()
  }, [cards.length, observeSeconds, soundEnabled])

  const result = useMemo((): GameResult => {
    const targets = new Set(cards.map((c) => c.id))
    let correct = 0
    let wrong = 0
    if (answerMode === 'pick' && kind !== 'image') {
      picked.forEach((id) => (targets.has(id) ? correct++ : wrong++))
    } else {
      const names = cards.map((c) => c.name.trim())
      const guessed = inputText.split(/[、,，\n\s]+/).map((x) => x.trim()).filter(Boolean)
      const hit = new Set<string>()
      guessed.forEach((g) => {
        if (names.includes(g)) hit.add(g)
        else wrong++
      })
      correct = hit.size
    }
    const missed = Math.max(0, cards.length - correct)
    const accuracy = cards.length ? Math.round((correct / cards.length) * 100) : 0
    let rank = '初學者'
    if (accuracy >= 90) rank = '記憶大師'
    else if (accuracy >= 75) rank = '記憶高手'
    else if (accuracy >= 60) rank = '記憶新星'
    return { correct, wrong, missed, accuracy, score: correct * 10 - wrong * 3, rank, timeUsed: 0 }
  }, [cards, picked, inputText, answerMode, kind])

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

  const usePick = answerMode === 'pick' && kind !== 'image'

  /* ---------- 卡片渲染 ---------- */
  const renderCardFace = (c: MemCard, size: 'sm' | 'md' | 'lg' | 'xl' | 'fluid') => {
    // fluid：跟隨容器闊度，用於網格展示（手機／投影都合適）
    const px: number | string =
      size === 'fluid'
        ? 'clamp(2rem, 12vw, 6rem)'
        : { sm: 34, md: 56, lg: 92, xl: 200 }[size]
    if (c.kind === 'shape' && c.shape && c.color) {
      return (
        <span
          className="flex items-center justify-center [&>svg]:h-full [&>svg]:w-full"
          style={{ width: px, height: px }}
        >
          <ShapeGlyph kind={c.shape} color={c.color} size={96} />
        </span>
      )
    }
    if (c.kind === 'image' && c.imageUrl) {
      return (
        <img
          src={c.imageUrl}
          alt={c.name}
          className="object-contain"
          style={{ width: px, height: px }}
          draggable={false}
        />
      )
    }
    if (c.kind === 'text') {
      return (
        <span
          className="font-black leading-none"
          style={{
            color: c.textColor,
            fontSize: typeof px === 'number' ? px * 0.62 : 'clamp(1.5rem, 9vw, 4.5rem)',
          }}
        >
          {c.glyph}
        </span>
      )
    }
    return <span style={{ fontSize: px, lineHeight: 1 }}>{c.glyph}</span>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl border border-white/15 bg-white/5 p-2.5">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-white/70 hover:text-white">
          <ArrowLeft size={16} /> 返回
        </button>
        <div className="flex items-center gap-2 text-xs text-white/70">
          <Shapes size={14} />
          <span>圖案記憶</span>
          {playerName && (
            <>
              <span className="text-white/70">|</span>
              <span className="text-white">{playerName}</span>
            </>
          )}
          <span className="text-white/70">|</span>
          <span className="font-bold text-amber-300">{score} 分</span>
        </div>
        <div className="flex gap-1">
          <button onClick={toggleFullscreen} className="p-1 text-white/70 hover:text-white">
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
          <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-1 text-white/70 hover:text-white">
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>
      </div>

      {/* ============ SETUP ============ */}
      {phase === 'setup' && (
        <div className="rounded-2xl border border-white/15 bg-black/30 p-4 sm:p-5">
          <div className="mb-4 text-center">
            <div className="text-4xl">🧠</div>
            <h2 className="text-xl font-bold text-white">圖案記憶遊戲</h2>
            <p className="mt-0.5 text-xs text-white/70">
              用圖案卡代替文字，投影或手機都清晰易睇
            </p>
            {playerName && (
              <div className="mt-1 inline-block rounded-full bg-amber-400/25 px-3 py-0.5 text-xs text-amber-200">
                🎯 {playerName}
              </div>
            )}
          </div>

          {/* 卡片類型 */}
          <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  setKind(m.id)
                  setCards([])
                  if (soundEnabled) Sound.click()
                }}
                className={`rounded-xl border p-3 text-left transition ${
                  kind === m.id
                    ? 'border-amber-400 bg-amber-400/15'
                    : 'border-white/15 bg-black/25 active:scale-95'
                }`}
              >
                <div className="flex items-center gap-1.5 text-sm font-bold text-white">
                  <span className="text-amber-300">{m.icon}</span>
                  {m.label}
                </div>
                <div className="mt-0.5 text-[10px] text-white/60">{m.desc}</div>
              </button>
            ))}
          </div>

          {/* 各類型內容產生器 */}
          <div className="mb-3 rounded-xl border border-white/15 bg-black/25 p-3">
            {kind === 'emoji' && (
              <>
                <div className="mb-2 text-xs font-semibold text-white">
                  📚 選一個圖案包（隨機抽 {maxCards} 張）
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {EMOJI_PACKS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => loadEmojiPack(p.id)}
                      className="rounded-xl border border-white/20 bg-[#02133e] px-2 py-3 text-center text-xs text-white/70 transition hover:border-amber-400/60 hover:text-white active:scale-95"
                    >
                      <div className="text-2xl">{p.emoji}</div>
                      <div className="mt-1 font-semibold">{p.name}</div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {kind === 'shape' && (
              <div className="text-center">
                <div className="mb-2 text-xs text-white/70">
                  隨機產生「形狀＋顏色」卡，考記形又要記色
                </div>
                <button
                  onClick={randomShapes}
                  className="rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-stone-900 active:scale-95"
                >
                  <Shuffle size={16} className="mr-1.5 inline" /> 隨機抽 {maxCards} 張圖形卡
                </button>
              </div>
            )}

            {kind === 'image' && (
              <div className="text-center">
                <div className="mb-2 text-xs text-white/70">上傳自己的相片做記憶卡（最多 {maxCards} 張）</div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => addImages(e.target.files)}
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-stone-900 active:scale-95"
                >
                  <ImageIcon size={16} className="mr-1.5 inline" /> 選擇相片
                </button>
                <div className="mt-2 text-[10px] text-white/60">相片卡作答會用打字模式</div>
              </div>
            )}

            {kind === 'text' && (
              <>
                <div className="mb-2 text-xs font-semibold text-white">📚 字詞包</div>
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {TEXT_PACKS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => loadTextPack(p.id)}
                      title={p.desc}
                      className="rounded-lg border border-white/20 bg-[#02133e] px-2.5 py-2 text-[11px] text-white/70 transition hover:border-amber-400/60 hover:text-white"
                    >
                      {p.emoji} {p.name}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={charInput}
                    onChange={(e) => setCharInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTextCard()}
                    placeholder="輸入字詞"
                    className="flex-1 rounded-lg border border-white/20 bg-[#02133e] px-3 py-2.5 text-sm text-white placeholder:text-white/40"
                  />
                  <button
                    onClick={addTextCard}
                    disabled={!charInput.trim() || cards.length >= maxCards}
                    className="rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-bold text-stone-900 disabled:opacity-60"
                  >
                    <Plus size={14} className="inline" /> 加入
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[10px] text-white/60">文字顏色</div>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {TEXT_COLORS.map((c) => (
                        <button
                          key={c.value}
                          onClick={() => setTextColor(c.value)}
                          className={`h-7 w-7 rounded-full border border-white/20 ${
                            textColor === c.value ? 'ring-2 ring-white' : ''
                          }`}
                          style={{ backgroundColor: c.value }}
                          title={c.name}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-white/60">背景顏色</div>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {BG_PALETTE.map((v) => (
                        <button
                          key={v}
                          onClick={() => setBgColor(v)}
                          className={`h-7 w-7 rounded-full border border-white/20 ${
                            bgColor === v ? 'ring-2 ring-white' : ''
                          }`}
                          style={{ backgroundColor: v }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 展示 / 作答方式 */}
          <div className="mb-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-white/15 bg-black/25 p-3">
              <div className="mb-1.5 text-xs font-semibold text-white">展示方式</div>
              <div className="grid grid-cols-2 gap-1.5">
                {(['grid', 'sequence'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDisplay(d)}
                    className={`rounded-lg border py-2 text-xs font-medium ${
                      display === d
                        ? 'border-amber-400 bg-amber-400/15 text-amber-200'
                        : 'border-white/15 bg-[#02133e] text-white/70'
                    }`}
                  >
                    {d === 'grid' ? '一次過全部' : '逐張大圖'}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-white/15 bg-black/25 p-3">
              <div className="mb-1.5 text-xs font-semibold text-white">作答方式</div>
              <div className="grid grid-cols-2 gap-1.5">
                {(['pick', 'type'] as const).map((a) => (
                  <button
                    key={a}
                    onClick={() => setAnswerMode(a)}
                    disabled={a === 'pick' && kind === 'image'}
                    className={`rounded-lg border py-2 text-xs font-medium disabled:opacity-60 ${
                      answerMode === a
                        ? 'border-amber-400 bg-amber-400/15 text-amber-200'
                        : 'border-white/15 bg-[#02133e] text-white/70'
                    }`}
                  >
                    {a === 'pick' ? '圖案點選' : '打字'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 已選卡片 */}
          <div className="mb-3">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs text-white/70">
                已建立 <b className="text-white">{cards.length}</b> / {maxCards} 張
              </span>
              <div className="flex gap-3">
                {cards.length > 0 && (
                  <button onClick={reshuffleColors} className="text-[11px] text-amber-300 underline">
                    重新配色
                  </button>
                )}
                {cards.length > 0 && (
                  <button onClick={() => setCards([])} className="text-[11px] text-rose-300 underline">
                    全部清除
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {cards.map((c) => (
                <div key={c.id} className="relative">
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-xl border border-white/10"
                    style={{ backgroundColor: c.bgColor }}
                  >
                    {renderCardFace(c, 'sm')}
                  </div>
                  <button
                    onClick={() => removeCard(c.id)}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] text-white"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={startGame}
            disabled={cards.length === 0}
            className={`w-full rounded-xl py-3.5 text-base font-bold ${
              cards.length > 0 ? 'bg-amber-400 text-stone-900 active:scale-[0.99]' : 'bg-black/35 text-white/70'
            }`}
          >
            🚀 開始（{observeSeconds}s 展示）
          </button>
        </div>
      )}

      {/* ============ OBSERVE ============ */}
      {phase === 'observe' && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          style={{ backgroundColor: display === 'sequence' ? cards[currentIndex]?.bgColor || 'var(--ss-bg)' : 'var(--ss-bg)' }}
        >
          <div className="flex items-center justify-between bg-black/40 px-4 py-2.5">
            <button
              onClick={() => {
                setPhase('setup')
                if (soundEnabled) Sound.click()
              }}
              className="text-sm text-white/85 hover:text-white"
            >
              ✕ 結束
            </button>
            <div className="flex items-center gap-3 text-xs text-white/85">
              {display === 'sequence' && (
                <span>
                  {currentIndex + 1} / {cards.length}
                </span>
              )}
              <div
                className={`rounded px-2.5 py-1 font-bold ${
                  timer <= 5 ? 'animate-pulse bg-rose-500 text-white' : 'bg-white/25 text-white'
                }`}
              >
                <Timer size={12} className="mr-1 inline" />
                {timer}s
              </div>
            </div>
            <button onClick={toggleFullscreen} className="text-white/85 hover:text-white">
              {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            </button>
          </div>

          {display === 'sequence' ? (
            <div className="flex flex-1 items-center justify-center px-4">
              <div className="text-center">
                <div className="flex justify-center">
                  {cards[currentIndex] && renderCardFace(cards[currentIndex], 'xl')}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center overflow-auto p-3">
              <div
                className="grid w-full max-w-5xl gap-2 sm:gap-3"
                style={{
                  gridTemplateColumns: `repeat(${cards.length <= 4 ? 2 : cards.length <= 9 ? 3 : 4}, minmax(0,1fr))`,
                }}
              >
                {cards.map((c) => (
                  <div
                    key={c.id}
                    className="flex aspect-square items-center justify-center rounded-2xl border border-white/10 shadow-lg"
                    style={{ backgroundColor: c.bgColor }}
                  >
                    <div className="flex items-center justify-center">
                      {renderCardFace(c, 'fluid')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {display === 'sequence' && (
            <>
              <div className="flex justify-center gap-1.5 pb-4">
                {cards.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-2 w-2 rounded-full ${
                      idx === currentIndex ? 'scale-150 bg-amber-400' : idx < currentIndex ? 'bg-emerald-400' : 'bg-white/40'
                    }`}
                  />
                ))}
              </div>
              {currentIndex < cards.length - 1 && (
                <button
                  onClick={() => setCurrentIndex((p) => Math.min(p + 1, cards.length - 1))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/30 px-3 py-4 text-3xl text-white/80"
                >
                  ›
                </button>
              )}
              {currentIndex > 0 && (
                <button
                  onClick={() => setCurrentIndex((p) => Math.max(p - 1, 0))}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/30 px-3 py-4 text-3xl text-white/80"
                >
                  ‹
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* ============ HIDDEN ============ */}
      {phase === 'hidden' && (
        <div className="rounded-2xl border border-white/15 bg-black/30 p-8 text-center">
          <ShieldCheck className="mx-auto mb-2 text-white/60" size={40} />
          <h2 className="text-lg font-bold text-white">🔒 已遮蓋</h2>
          <p className="mt-1 text-xs text-white/70">準備作答…</p>
        </div>
      )}

      {/* ============ ANSWER ============ */}
      {phase === 'answer' && (
        <div className="rounded-2xl border border-white/15 bg-black/30 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">
              ✍️ {usePick ? '點選你記得出現過的圖案' : '輸入你記得的內容'}
            </h2>
            <div
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold ${
                timer <= 5 ? 'animate-pulse bg-rose-500 text-white' : 'bg-amber-400 text-stone-900'
              }`}
            >
              <Timer size={12} /> {timer}s
            </div>
          </div>

          {usePick ? (
            <>
              <div className="mb-2 text-[11px] text-white/70">
                已選 <b className="text-amber-300">{picked.length}</b> / 應為 {cards.length} 個
              </div>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {optionPool.map((c) => {
                  const on = picked.includes(c.id)
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        setPicked((p) => (on ? p.filter((x) => x !== c.id) : [...p, c.id]))
                        if (soundEnabled) Sound.click()
                      }}
                      className={`flex aspect-square items-center justify-center rounded-xl border-2 transition active:scale-95 ${
                        on ? 'border-amber-400 bg-amber-400/25' : 'border-white/15 bg-black/25'
                      }`}
                    >
                      {renderCardFace(c, 'md')}
                    </button>
                  )
                })}
              </div>
            </>
          ) : (
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`輸入你記得的 ${cards.length} 項，用逗號分隔`}
              className="min-h-32 w-full rounded-xl border border-white/20 bg-black/25 p-3 text-base text-white placeholder:text-white/40 focus:border-amber-400 focus:outline-none"
            />
          )}

          <button
            onClick={handleSubmit}
            disabled={submitted}
            className={`mt-3 w-full rounded-xl py-3.5 text-base font-bold ${
              submitted ? 'bg-black/35 text-white/70' : 'bg-amber-400 text-stone-900 active:scale-[0.99]'
            }`}
          >
            📤 提交
          </button>
        </div>
      )}

      {/* ============ RESULTS ============ */}
      {phase === 'results' && (
        <div className="rounded-2xl border border-white/15 bg-black/30 p-5">
          <h2 className="mb-3 text-sm font-bold text-white">📊 結果</h2>
          <div className="mb-3 grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-emerald-900/50 p-2 text-center">
              <CheckCircle2 className="mx-auto mb-0.5 text-emerald-300" size={18} />
              <div className="text-[10px] text-emerald-200">正確</div>
              <div className="text-lg font-bold text-emerald-300">{result.correct}</div>
            </div>
            <div className="rounded-lg bg-rose-900/50 p-2 text-center">
              <XCircle className="mx-auto mb-0.5 text-rose-300" size={18} />
              <div className="text-[10px] text-rose-200">錯誤</div>
              <div className="text-lg font-bold text-rose-300">{result.wrong}</div>
            </div>
            <div className="rounded-lg bg-cyan-900/50 p-2 text-center">
              <HelpCircle className="mx-auto mb-0.5 text-cyan-300" size={18} />
              <div className="text-[10px] text-cyan-200">遺漏</div>
              <div className="text-lg font-bold text-cyan-300">{result.missed}</div>
            </div>
          </div>
          <div className="mb-3 rounded-lg border border-amber-300/40 bg-amber-300/15 p-3 text-center">
            <div className="text-[10px] text-amber-100">準確率</div>
            <div className="text-2xl font-bold text-amber-300">{result.accuracy}%</div>
            <div className="mt-1 flex items-center justify-center gap-1 text-xs text-amber-100">
              <Medal size={14} /> {result.rank}
            </div>
            <div className="mt-1 text-sm font-bold text-white">+{result.score} 分</div>
          </div>
          <div className="mb-3">
            <button
              onClick={() => setShowAnswers(!showAnswers)}
              className="flex items-center gap-1 text-xs text-white/70 hover:text-white"
            >
              <Info size={12} />
              {showAnswers ? '隱藏' : '顯示'}答案
            </button>
            {showAnswers && (
              <div className="mt-2 flex flex-wrap gap-2">
                {cards.map((c) => (
                  <div key={c.id} className="text-center">
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/10"
                      style={{ backgroundColor: c.bgColor }}
                    >
                      {renderCardFace(c, 'sm')}
                    </div>
                    <div className="mt-0.5 max-w-14 truncate text-[10px] text-white/70">{c.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={startGame}
              className="flex-1 rounded-lg bg-amber-400 py-3 text-sm font-bold text-stone-900"
            >
              🔄 再來
            </button>
            <button
              onClick={onBack}
              className="flex-1 rounded-lg border border-white/20 bg-black/30 py-3 text-sm text-white/70"
            >
              ⬅️ 返回
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
