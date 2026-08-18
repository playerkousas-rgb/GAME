/**
 * 誰是臥底 — 主持台
 * Copyright (c) 2026 Scout System. All rights reserved.
 *
 * 流程：
 *  1. 領袖設定人數 → 每人一個專屬 QR（4 人 4 個、5 人 5 個）
 *  2. 設定臥底數 / 白卡數 / 題目分類
 *  3. 開始後每回合自動隨機重新分派，玩家用同一個 QR 即可看到新角色
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Users, Shield, QrCode, Play, ChevronRight, RotateCcw, Eye, EyeOff,
  Printer, Settings2, ArrowLeft, Check, Sparkles,
} from 'lucide-react'
import QRCode from '../../components/QRCode'
import { WORD_CATEGORIES } from './data/wordPairs'
import {
  buildSeatUrl, dealRound, makeSeed, maxBlanks, maxUndercovers, ROLE_EMOJI, ROLE_LABEL,
  suggestCounts, type GameSetup,
} from './lib/deal'

type Phase = 'setup' | 'qr' | 'play'

const STORE_KEY = 'scoutsys:uc:host'

/** 還原上次設定 */
function readSaved(): { players: number; undercovers: number; blanks: number; categories: string[] } {
  const fallback = { players: 6, undercovers: 1, blanks: 0, categories: [] as string[] }
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) return fallback
    const s = JSON.parse(raw)
    return {
      players: typeof s.players === 'number' ? s.players : fallback.players,
      undercovers: typeof s.undercovers === 'number' ? s.undercovers : fallback.undercovers,
      blanks: typeof s.blanks === 'number' ? s.blanks : fallback.blanks,
      categories: Array.isArray(s.categories) ? s.categories : [],
    }
  } catch {
    return fallback
  }
}

export default function UndercoverApp() {
  const saved = useMemo(() => readSaved(), [])
  const [phase, setPhase] = useState<Phase>('setup')
  const [players, setPlayers] = useState(saved.players)
  const [undercovers, setUndercovers] = useState(saved.undercovers)
  const [blanks, setBlanks] = useState(saved.blanks)
  const [categories, setCategories] = useState<string[]>(saved.categories)
  const [seed, setSeed] = useState(makeSeed)
  const [round, setRound] = useState(1)
  const [showAnswer, setShowAnswer] = useState(false)
  const [bigQr, setBigQr] = useState<number | null>(null)

  useEffect(() => {
    localStorage.setItem(STORE_KEY, JSON.stringify({ players, undercovers, blanks, categories }))
  }, [players, undercovers, blanks, categories])

  /* 人數變動 → 自動套用建議值並收窄上限 */
  const applyPlayers = useCallback((n: number) => {
    setPlayers(n)
    const s = suggestCounts(n)
    setUndercovers(Math.min(s.undercovers, maxUndercovers(n, 0)))
    setBlanks(Math.min(s.blanks, maxBlanks(n, s.undercovers)))
  }, [])

  const setup: GameSetup = useMemo(
    () => ({ seed, players, undercovers, blanks, categories }),
    [seed, players, undercovers, blanks, categories],
  )

  const result = useMemo(() => dealRound(setup, round), [setup, round])

  const seatUrls = useMemo(
    () => Array.from({ length: players }, (_, i) => buildSeatUrl(setup, i + 1)),
    [setup, players],
  )

  const civilians = players - undercovers - blanks

  const newGame = useCallback(() => {
    setSeed(makeSeed())
    setRound(1)
    setShowAnswer(false)
    setPhase('setup')
  }, [])

  /* ============ SETUP ============ */
  if (phase === 'setup') {
    return (
      <Shell>
        <div className="mx-auto w-full max-w-2xl space-y-4">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0a2260] to-[#02133e] p-5 text-center">
            <div className="text-4xl">🕵️</div>
            <h1 className="mt-1 text-2xl font-black text-white">誰是臥底</h1>
            <p className="mt-1 text-xs text-white/70">
              設定一次，掃 QR 派牌到手機；之後每回合自動重新分派，唔使再掃
            </p>
          </div>

          {/* 人數 */}
          <Section icon={<Users className="h-4 w-4" />} title="玩家人數" hint="幾多人玩就出幾多個 QR Code">
            <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
              {Array.from({ length: 17 }, (_, i) => i + 4).map((n) => (
                <button
                  key={n}
                  onClick={() => applyPlayers(n)}
                  className={`rounded-xl border py-3 text-sm font-bold transition ${
                    players === n
                      ? 'border-amber-400 bg-amber-400 text-stone-900'
                      : 'border-white/15 bg-white/5 text-white/80 active:scale-95'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </Section>

          {/* 臥底 */}
          <Section icon={<Shield className="h-4 w-4" />} title="臥底人數" hint={`最多 ${maxUndercovers(players, blanks)} 人`}>
            <Stepper
              value={undercovers}
              min={1}
              max={maxUndercovers(players, blanks)}
              onChange={setUndercovers}
              suffix="位臥底"
            />
          </Section>

          {/* 白卡 */}
          <Section
            icon={<span className="text-base leading-none">🃏</span>}
            title="白卡人數（可有可無）"
            hint="白卡玩家沒有任何詞語，要扮平民生存"
          >
            <Stepper
              value={blanks}
              min={0}
              max={maxBlanks(players, undercovers)}
              onChange={setBlanks}
              suffix={blanks === 0 ? '不使用白卡' : '張白卡'}
            />
          </Section>

          {/* 分類 */}
          <Section icon={<Sparkles className="h-4 w-4" />} title="題目分類" hint="不選＝全部分類隨機">
            <div className="flex flex-wrap gap-2">
              {WORD_CATEGORIES.map((c) => {
                const on = categories.includes(c)
                return (
                  <button
                    key={c}
                    onClick={() =>
                      setCategories((prev) => (on ? prev.filter((x) => x !== c) : [...prev, c]))
                    }
                    className={`rounded-full border px-3 py-2 text-xs font-medium transition ${
                      on
                        ? 'border-amber-400 bg-amber-400/20 text-amber-200'
                        : 'border-white/15 bg-white/5 text-white/70'
                    }`}
                  >
                    {on && <Check className="mr-1 inline h-3 w-3" />}
                    {c}
                  </button>
                )
              })}
            </div>
          </Section>

          {/* 摘要 */}
          <div className="grid grid-cols-3 gap-2">
            <Stat label="平民" value={civilians} tone="emerald" />
            <Stat label="臥底" value={undercovers} tone="rose" />
            <Stat label="白卡" value={blanks} tone="slate" />
          </div>

          <button
            onClick={() => setPhase('qr')}
            className="w-full rounded-2xl bg-amber-400 py-4 text-base font-black text-stone-900 shadow-lg shadow-amber-500/20 active:scale-[0.99]"
          >
            <QrCode className="mr-2 inline h-5 w-5" />
            產生 {players} 個 QR Code
          </button>
        </div>
      </Shell>
    )
  }

  /* ============ QR 派發 ============ */
  if (phase === 'qr') {
    return (
      <Shell>
        <div className="mx-auto w-full max-w-4xl space-y-4">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setPhase('setup')}
              className="flex items-center gap-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white/80"
            >
              <ArrowLeft className="h-4 w-4" /> 改設定
            </button>
            <div className="text-center">
              <div className="text-sm font-black text-white">請每位玩家掃描屬於自己的 QR</div>
              <div className="text-[11px] text-white/75">
                {players} 人 · {undercovers} 臥底 · {blanks} 白卡 · 每人只掃一次
              </div>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white/80 print:hidden"
            >
              <Printer className="h-4 w-4" /> 列印
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {seatUrls.map((url, i) => (
              <button
                key={url}
                onClick={() => setBigQr(i + 1)}
                className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center active:scale-[0.98]"
              >
                <div className="mb-2 text-xs font-black text-amber-300">{i + 1} 號玩家</div>
                <div className="flex justify-center">
                  <QRCode value={url} size={130} />
                </div>
                <div className="mt-2 text-[10px] text-white/75 print:hidden">點擊放大</div>
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-amber-400/25 bg-amber-400/10 p-4 text-xs leading-relaxed text-amber-100 print:hidden">
            <div className="mb-1 font-bold">💡 玩法提示</div>
            這些 QR 是「座位卡」，整局遊戲只需掃一次。之後每回合領袖按「下一回合」，
            玩家在自己手機上把回合數調到相同數字，就會看到全新的角色與詞語 —— 毋須重新掃描。
          </div>

          <button
            onClick={() => {
              setRound(1)
              setShowAnswer(false)
              setPhase('play')
            }}
            className="w-full rounded-2xl bg-amber-400 py-4 text-base font-black text-stone-900 shadow-lg shadow-amber-500/20 active:scale-[0.99] print:hidden"
          >
            <Play className="mr-2 inline h-5 w-5" /> 全部掃完，開始第 1 局
          </button>
        </div>

        {bigQr !== null && (
          <div
            className="fixed inset-0 z-[300] grid place-items-center bg-black/90 p-5"
            onClick={() => setBigQr(null)}
          >
            <div className="text-center">
              <div className="mb-3 text-xl font-black text-amber-300">{bigQr} 號玩家</div>
              <div className="inline-block rounded-2xl bg-white p-3">
                <QRCode value={seatUrls[bigQr - 1]} size={280} />
              </div>
              <div className="mt-4 text-xs text-white/75">點任何位置關閉</div>
            </div>
          </div>
        )}
      </Shell>
    )
  }

  /* ============ 遊戲進行 ============ */
  return (
    <Shell>
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0a2260] to-[#02133e] p-5 text-center">
          <div className="text-xs text-white/75">目前回合</div>
          <div className="text-6xl font-black text-amber-300">第 {round} 局</div>
          <p className="mt-2 text-xs text-white/70">
            請所有玩家把手機上的回合數調到「{round}」，然後長按卡片查看身分
          </p>
        </div>

        {/* 發言順序 */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-2 text-xs font-bold text-white/80">🗣️ 本局發言順序</div>
          <div className="flex flex-wrap gap-2">
            {[...result.seats]
              .sort((a, b) => a.order - b.order)
              .map((s) => (
                <span
                  key={s.seat}
                  className="rounded-full border border-white/15 bg-black/25 px-3 py-1.5 text-xs text-white/85"
                >
                  {s.order}. {s.seat} 號
                </span>
              ))}
          </div>
        </div>

        {/* 答案 */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <button
            onClick={() => setShowAnswer((v) => !v)}
            className="flex w-full items-center justify-between text-sm font-bold text-white"
          >
            <span className="flex items-center gap-2">
              {showAnswer ? <EyeOff className="h-4 w-4 text-rose-300" /> : <Eye className="h-4 w-4 text-amber-300" />}
              主持答案（成員勿看）
            </span>
            <span className="text-xs text-white/75">{showAnswer ? '隱藏' : '顯示'}</span>
          </button>

          {showAnswer && (
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/15 p-3 text-center">
                  <div className="text-[10px] text-emerald-200">平民詞</div>
                  <div className="text-lg font-black text-emerald-100">{result.civilianWord}</div>
                </div>
                <div className="rounded-xl border border-rose-400/30 bg-rose-500/15 p-3 text-center">
                  <div className="text-[10px] text-rose-200">臥底詞</div>
                  <div className="text-lg font-black text-rose-100">{result.undercoverWord}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {result.seats.map((s) => (
                  <div
                    key={s.seat}
                    className={`rounded-xl border p-2.5 text-center text-xs ${
                      s.role === 'undercover'
                        ? 'border-rose-400/40 bg-rose-500/15 text-rose-100'
                        : s.role === 'blank'
                          ? 'border-slate-300/30 bg-slate-400/15 text-slate-100'
                          : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100'
                    }`}
                  >
                    <div className="font-black">{s.seat} 號</div>
                    <div className="mt-0.5">
                      {ROLE_EMOJI[s.role]} {ROLE_LABEL[s.role]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              setRound((r) => r + 1)
              setShowAnswer(false)
            }}
            className="rounded-2xl bg-amber-400 py-4 text-base font-black text-stone-900 shadow-lg shadow-amber-500/20 active:scale-[0.99]"
          >
            <ChevronRight className="mr-1 inline h-5 w-5" /> 下一回合
          </button>
          <button
            onClick={() => setPhase('qr')}
            className="rounded-2xl border border-white/15 bg-white/5 py-4 text-sm font-bold text-white/85 active:scale-[0.99]"
          >
            <QrCode className="mr-1 inline h-4 w-4" /> 重看 QR
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setPhase('setup')}
            className="rounded-xl border border-white/15 bg-white/5 py-3 text-xs text-white/75"
          >
            <Settings2 className="mr-1 inline h-3.5 w-3.5" /> 修改設定
          </button>
          <button
            onClick={newGame}
            className="rounded-xl border border-white/15 bg-white/5 py-3 text-xs text-white/75"
          >
            <RotateCcw className="mr-1 inline h-3.5 w-3.5" /> 全新牌局（需重掃）
          </button>
        </div>
      </div>
    </Shell>
  )
}

/* ---------- 小組件 ---------- */

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-[#02133e] px-4 pb-24 pt-5 text-white">{children}</div>
  )
}

function Section({
  icon,
  title,
  hint,
  children,
}: {
  icon: React.ReactNode
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <span className="text-amber-300">{icon}</span>
          {title}
        </div>
        {hint && <div className="mt-0.5 text-[11px] text-white/75">{hint}</div>}
      </div>
      {children}
    </div>
  )
}

function Stepper({
  value,
  min,
  max,
  onChange,
  suffix,
}: {
  value: number
  min: number
  max: number
  onChange: (v: number) => void
  suffix: string
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="h-12 w-12 rounded-xl border border-white/15 bg-white/10 text-2xl font-black text-white disabled:opacity-30"
      >
        −
      </button>
      <div className="flex-1 rounded-xl border border-amber-400/30 bg-amber-400/10 py-2.5 text-center">
        <div className="text-2xl font-black text-amber-300">{value}</div>
        <div className="text-[10px] text-amber-100/80">{suffix}</div>
      </div>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="h-12 w-12 rounded-xl border border-white/15 bg-white/10 text-2xl font-black text-white disabled:opacity-30"
      >
        +
      </button>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: number; tone: 'emerald' | 'rose' | 'slate' }) {
  const map = {
    emerald: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-200',
    rose: 'border-rose-400/30 bg-rose-500/15 text-rose-200',
    slate: 'border-slate-300/25 bg-slate-400/15 text-slate-200',
  }
  return (
    <div className={`rounded-xl border p-3 text-center ${map[tone]}`}>
      <div className="text-[11px] opacity-90">{label}</div>
      <div className="text-2xl font-black">{value}</div>
    </div>
  )
}
