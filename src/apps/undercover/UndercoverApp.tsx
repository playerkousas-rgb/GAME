/**
 * 誰是臥底 — 主持台
 * Copyright (c) 2026 Scout System. All rights reserved.
 *
 * 流程：
 *  1. 領袖設定人數 → 每人一個專屬 QR（4 人 4 個、5 人 5 個），整晚只掃一次
 *  2. 設定臥底數 / 白卡數 / 題目來源（內建分類或自訂詞語）
 *  3. 每局按「開始本局」，即場用密碼學亂數抽出「本局代碼」，
 *     玩家在手機輸入代碼即見新身分 —— 按掣前無人（包括領袖）能預知結果
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Users, Shield, QrCode, Play, RotateCcw, EyeOff, Dices,
  Printer, Settings2, ArrowLeft, Check, Sparkles, BookOpen, Lock, Wand2,
} from 'lucide-react'
import QRCode from '../../components/QRCode'
import { WORD_CATEGORIES, type WordPair } from './data/wordPairs'
import PairManager from './components/PairManager'
import {
  buildPool, buildSeatUrl, dealRound, estimateUrlLength, generateRoundCode, makeSecret,
  maxBlanks, maxUndercovers, MAX_URL_LENGTH, ROLE_EMOJI, ROLE_LABEL, suggestCounts,
  type GameSetup,
} from './lib/deal'

type Phase = 'setup' | 'qr' | 'play'

const STORE_KEY = 'scoutsys:uc:host:v2'

type Saved = {
  players: number
  undercovers: number
  blanks: number
  categories: string[]
  customPairs: WordPair[]
  onlyCustom: boolean
}

function readSaved(): Saved {
  const fallback: Saved = {
    players: 6, undercovers: 1, blanks: 0, categories: [], customPairs: [], onlyCustom: false,
  }
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) return fallback
    const s = JSON.parse(raw)
    return {
      players: typeof s.players === 'number' ? s.players : fallback.players,
      undercovers: typeof s.undercovers === 'number' ? s.undercovers : fallback.undercovers,
      blanks: typeof s.blanks === 'number' ? s.blanks : fallback.blanks,
      categories: Array.isArray(s.categories) ? s.categories : [],
      customPairs: Array.isArray(s.customPairs) ? s.customPairs : [],
      onlyCustom: !!s.onlyCustom,
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
  const [customPairs, setCustomPairs] = useState<WordPair[]>(saved.customPairs)
  const [onlyCustom, setOnlyCustom] = useState(saved.onlyCustom)

  const [secret, setSecret] = useState(makeSecret)
  const [roundNo, setRoundNo] = useState(0)
  const [code, setCode] = useState('')
  const [showAnswer, setShowAnswer] = useState(false)
  const [bigQr, setBigQr] = useState<number | null>(null)
  /** 領袖指定本局詞語（空 = 隨機） */
  const [forcedPairId, setForcedPairId] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem(
      STORE_KEY,
      JSON.stringify({ players, undercovers, blanks, categories, customPairs, onlyCustom }),
    )
  }, [players, undercovers, blanks, categories, customPairs, onlyCustom])

  const applyPlayers = useCallback((n: number) => {
    setPlayers(n)
    const s = suggestCounts(n)
    setUndercovers(Math.min(s.undercovers, maxUndercovers(n, 0)))
    setBlanks(Math.min(s.blanks, maxBlanks(n, s.undercovers)))
  }, [])

  const setup: GameSetup = useMemo(
    () => ({ secret, players, undercovers, blanks, categories, customPairs, onlyCustom }),
    [secret, players, undercovers, blanks, categories, customPairs, onlyCustom],
  )

  const pool = useMemo(() => buildPool(setup), [setup])
  const result = useMemo(() => (code ? dealRound(setup, code) : null), [setup, code])
  const seatUrls = useMemo(
    () => Array.from({ length: players }, (_, i) => buildSeatUrl(setup, i + 1)),
    [setup, players],
  )
  const civilians = players - undercovers - blanks
  /** 自訂詞語會寫入 QR，太多會令 QR 過密難掃 */
  const urlLen = useMemo(() => estimateUrlLength(setup), [setup])
  const qrTooDense = urlLen > MAX_URL_LENGTH

  const nextRound = useCallback(() => {
    setCode(generateRoundCode(setup, forcedPairId || undefined))
    setRoundNo((r) => r + 1)
    setShowAnswer(false)
  }, [setup, forcedPairId])

  const newGame = useCallback(() => {
    setSecret(makeSecret())
    setRoundNo(0)
    setCode('')
    setShowAnswer(false)
    setPhase('setup')
  }, [])

  /* ==================== SETUP ==================== */
  if (phase === 'setup') {
    return (
      <Shell>
        <div className="mx-auto w-full max-w-2xl space-y-4">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0a2260] to-[#02133e] p-5 text-center">
            <div className="text-4xl">🕵️</div>
            <h1 className="mt-1 text-2xl font-black text-white">誰是臥底</h1>
            <p className="mt-1 text-xs text-white/75">
              設定一次，掃 QR 派牌到手機；每局即場抽新代碼，角色真隨機
            </p>
          </div>

          <Section icon={<Users className="h-4 w-4" />} title="玩家人數" hint="幾多人玩就出幾多個 QR Code">
            <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
              {Array.from({ length: 17 }, (_, i) => i + 4).map((n) => (
                <button
                  key={n}
                  onClick={() => applyPlayers(n)}
                  className={`rounded-xl border py-3 text-sm font-bold transition ${
                    players === n
                      ? 'border-amber-400 bg-amber-400 text-stone-900'
                      : 'border-white/15 bg-white/5 text-white/85 active:scale-95'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </Section>

          <Section
            icon={<Shield className="h-4 w-4" />}
            title="臥底人數"
            hint={`最多 ${maxUndercovers(players, blanks)} 人`}
          >
            <Stepper
              value={undercovers}
              min={1}
              max={maxUndercovers(players, blanks)}
              onChange={setUndercovers}
              suffix="位臥底"
            />
          </Section>

          <Section
            icon={<span className="text-base leading-none">🃏</span>}
            title="白卡人數（可有可無）"
            hint="白卡玩家沒有詞語，要扮平民生存"
          >
            <Stepper
              value={blanks}
              min={0}
              max={maxBlanks(players, undercovers)}
              onChange={setBlanks}
              suffix={blanks === 0 ? '不使用白卡' : '張白卡'}
            />
          </Section>

          {/* 自訂詞語 */}
          <Section
            icon={<Wand2 className="h-4 w-4" />}
            title="自訂詞語（平民詞 / 臥底詞）"
            hint="領袖可自己出題，配合團隊主題"
          >
            <PairManager
              pairs={customPairs}
              onChange={setCustomPairs}
              onlyCustom={onlyCustom}
              onOnlyCustom={setOnlyCustom}
            />
          </Section>

          {!onlyCustom && (
            <Section icon={<Sparkles className="h-4 w-4" />} title="內建題庫分類" hint="不選＝全部分類隨機">
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
                          : 'border-white/15 bg-white/5 text-white/80'
                      }`}
                    >
                      {on && <Check className="mr-1 inline h-3 w-3" />}
                      {c}
                    </button>
                  )
                })}
              </div>
            </Section>
          )}

          <div className="grid grid-cols-3 gap-2">
            <Stat label="平民" value={civilians} tone="emerald" />
            <Stat label="臥底" value={undercovers} tone="rose" />
            <Stat label="白卡" value={blanks} tone="slate" />
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-xs text-white/75">
            <BookOpen className="mr-1 inline h-3.5 w-3.5 text-amber-300" />
            本局題庫共 <b className="text-amber-300">{pool.length}</b> 對詞語
            {onlyCustom && <span className="text-amber-200">（只用自訂）</span>}
          </div>

          {qrTooDense && (
            <div className="rounded-xl border border-rose-400/40 bg-rose-500/15 p-3.5 text-xs leading-relaxed text-rose-100">
              <b>⚠️ 自訂詞語太多</b>
              <br />
              自訂詞語需要寫入每個 QR Code，目前份量會令 QR 過於密集、手機難以掃描。
              建議刪減至約 30 對以內，或分幾晚玩。
            </div>
          )}

          <button
            onClick={() => setPhase('qr')}
            disabled={qrTooDense}
            className="w-full rounded-2xl bg-amber-400 py-4 text-base font-black text-stone-900 shadow-lg shadow-amber-500/20 active:scale-[0.99] disabled:opacity-40"
          >
            <QrCode className="mr-2 inline h-5 w-5" />
            產生 {players} 個 QR Code
          </button>
        </div>
      </Shell>
    )
  }

  /* ==================== QR ==================== */
  if (phase === 'qr') {
    return (
      <Shell>
        <div className="mx-auto w-full max-w-4xl space-y-4">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setPhase('setup')}
              className="flex items-center gap-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white/85"
            >
              <ArrowLeft className="h-4 w-4" /> 改設定
            </button>
            <div className="text-center">
              <div className="text-sm font-black text-white">每位玩家掃描屬於自己的 QR</div>
              <div className="text-[11px] text-white/75">
                {players} 人 · {undercovers} 臥底 · {blanks} 白卡 · 整晚只需掃一次
              </div>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white/85 print:hidden"
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
                <div className="mt-2 text-[10px] text-white/60 print:hidden">點擊放大</div>
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-amber-400/25 bg-amber-400/10 p-4 text-xs leading-relaxed text-amber-100 print:hidden">
            <div className="mb-1 font-bold">💡 玩法提示</div>
            呢啲 QR 係「座位卡」，整晚只需掃一次。每局開始時，領袖會即場抽出一個
            <b> 4 位數字代碼</b>，用超大字顯示喺主持機／投影幕；
            玩家喺自己手機數字鍵盤撳 4 下，即見本局全新身分。
          </div>

          <button
            onClick={() => {
              setRoundNo(0)
              setCode('')
              setPhase('play')
            }}
            className="w-full rounded-2xl bg-amber-400 py-4 text-base font-black text-stone-900 shadow-lg shadow-amber-500/20 active:scale-[0.99] print:hidden"
          >
            <Play className="mr-2 inline h-5 w-5" /> 全部掃完，進入主持台
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

  /* ==================== PLAY ==================== */
  return (
    <Shell>
      <div className="mx-auto w-full max-w-3xl space-y-4">
        {/* 本局代碼 */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0a2260] to-[#02133e] p-5 text-center">
          {code ? (
            <>
              <div className="text-xs text-white/75">第 {roundNo} 局 · 本局代碼</div>
              <div
                className="my-1 font-mono font-black leading-none tracking-[0.15em] text-amber-300"
                style={{ fontSize: 'clamp(4.5rem, 22vw, 11rem)' }}
              >
                {code}
              </div>
              <p className="text-sm text-white/85">請所有玩家在手機撳入呢 4 個數字</p>
            </>
          ) : (
            <>
              <div className="text-4xl">🎲</div>
              <div className="mt-2 text-lg font-black text-white">準備開始</div>
              <p className="mt-1 text-xs text-white/75">
                按下方按鈕，系統會即場抽出本局代碼與角色分派
              </p>
            </>
          )}
        </div>

        {/* 隨機性說明 */}
        <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-3.5 text-[11px] leading-relaxed text-emerald-100">
          <div className="mb-1 flex items-center gap-1.5 font-bold">
            <Dices className="h-3.5 w-3.5" /> 真隨機保證
          </div>
          本局代碼是按下按鈕嗰一刻，用裝置嘅密碼學亂數即場抽出，按掣前連領袖都無法預知。
          每局之間互相獨立，<b>沒有可以背誦的派發順序</b>。
        </div>

        {/* 指定詞語 */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <button
            onClick={() => setPickerOpen((v) => !v)}
            className="flex w-full items-center justify-between text-sm font-bold text-white"
          >
            <span className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-amber-300" />
              指定下一局詞語
            </span>
            <span className="text-xs text-white/75">
              {forcedPairId
                ? pool.find((p) => p.id === forcedPairId)
                  ? `${pool.find((p) => p.id === forcedPairId)!.civilian} / ${pool.find((p) => p.id === forcedPairId)!.undercover}`
                  : '隨機'
                : '隨機'}
            </span>
          </button>

          {pickerOpen && (
            <div className="mt-3 space-y-2">
              <button
                onClick={() => setForcedPairId('')}
                className={`w-full rounded-lg border px-3 py-2.5 text-left text-xs ${
                  !forcedPairId
                    ? 'border-amber-400 bg-amber-400/15 text-amber-200'
                    : 'border-white/15 bg-[#0d2050] text-white/85'
                }`}
              >
                🎲 隨機抽（建議）
              </button>
              <div className="max-h-60 space-y-1.5 overflow-y-auto pr-1">
                {pool.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setForcedPairId(p.id)}
                    className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
                      forcedPairId === p.id
                        ? 'border-amber-400 bg-amber-400/15'
                        : 'border-white/10 bg-[#0d2050]'
                    }`}
                  >
                    <span className="flex-1 truncate text-left text-emerald-200">{p.civilian}</span>
                    <span className="text-white/40">↔</span>
                    <span className="flex-1 truncate text-left text-rose-200">{p.undercover}</span>
                    <span className="shrink-0 rounded-full bg-black/30 px-1.5 py-0.5 text-[10px] text-white/60">
                      {p.category}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] leading-relaxed text-white/60">
                注意：指定咗詞語，但邊個做臥底、邊個攞邊個詞依然係即場真隨機。
              </p>
            </div>
          )}
        </div>

        {/* 本局資料 */}
        {result && (
          <>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-2 text-xs font-bold text-white/85">🗣️ 本局發言順序</div>
              <div className="flex flex-wrap gap-2">
                {[...result.seats]
                  .sort((a, b) => a.order - b.order)
                  .map((s) => (
                    <span
                      key={s.seat}
                      className="rounded-full border border-white/15 bg-black/25 px-3 py-1.5 text-xs text-white/90"
                    >
                      {s.order}. {s.seat} 號
                    </span>
                  ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <button
                onClick={() => setShowAnswer((v) => !v)}
                className="flex w-full items-center justify-between text-sm font-bold text-white"
              >
                <span className="flex items-center gap-2">
                  {showAnswer ? (
                    <EyeOff className="h-4 w-4 text-rose-300" />
                  ) : (
                    <Lock className="h-4 w-4 text-amber-300" />
                  )}
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
          </>
        )}

        <button
          onClick={nextRound}
          className="w-full rounded-2xl bg-amber-400 py-5 text-lg font-black text-stone-900 shadow-lg shadow-amber-500/20 active:scale-[0.99]"
        >
          <Dices className="mr-2 inline h-6 w-6" />
          {code ? '抽下一局代碼' : '開始第 1 局'}
        </button>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setPhase('qr')}
            className="rounded-xl border border-white/15 bg-white/5 py-3 text-xs text-white/85"
          >
            <QrCode className="mr-1 inline h-3.5 w-3.5" /> 重看 QR
          </button>
          <button
            onClick={() => setPhase('setup')}
            className="rounded-xl border border-white/15 bg-white/5 py-3 text-xs text-white/85"
          >
            <Settings2 className="mr-1 inline h-3.5 w-3.5" /> 改設定
          </button>
          <button
            onClick={newGame}
            className="rounded-xl border border-white/15 bg-white/5 py-3 text-xs text-white/85"
          >
            <RotateCcw className="mr-1 inline h-3.5 w-3.5" /> 全新牌局
          </button>
        </div>
        <p className="pb-2 text-center text-[10px] text-white/55">
          「改設定」若更改人數或詞語，需要重新派發 QR
        </p>
      </div>
    </Shell>
  )
}

/* ---------- 小組件 ---------- */

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-[100dvh] bg-[#02133e] px-4 pb-24 pt-5 text-white">{children}</div>
}

function Section({
  icon, title, hint, children,
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
        {hint && <div className="mt-0.5 text-[11px] text-white/70">{hint}</div>}
      </div>
      {children}
    </div>
  )
}

function Stepper({
  value, min, max, onChange, suffix,
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
        <div className="text-[10px] text-amber-100/85">{suffix}</div>
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
