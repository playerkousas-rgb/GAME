/**
 * 猜猜畫畫 — 秘密派題主持台
 * Copyright (c) 2026 Scout System. All rights reserved.
 *
 * 領袖流程：設定人數 → 派 QR → 每局抽代碼（畫面顯示「下一局：N 號」）
 * → 等該玩家出場企定 → 撳「開始計時」→ 自動或手動蓋牌 → 下一局
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft, QrCode, Printer, Users, Play, Pause, EyeOff, Check, X,
  Dices, RotateCcw, Timer, SkipForward,
} from 'lucide-react'
import QRCode from '../../components/QRCode'
import { DRAW_BANK } from '../../data/drawBank'
import { GameSound } from '../../shared/gameSound'
import type { Question } from '../../shared/questionBank'
import {
  buildPool, buildSeatUrl, drawCode, estimateUrlLength, makeSecret, MAX_URL_LENGTH,
  resolveRound, type DrawSeatSetup, type PoolItem,
} from './lib/seat'

type Phase = 'setup' | 'qr' | 'lobby' | 'drawing' | 'covered'

type Props = {
  levels: string[]
  categories: string[]
  customAnswers: string[]
  onBack: () => void
}

const TIME_OPTIONS = [60, 90, 120, 180, 0]

export default function SecretDrawHost({ levels, categories, customAnswers, onBack }: Props) {
  const [phase, setPhase] = useState<Phase>('setup')
  const [players, setPlayers] = useState(6)
  const [secret, setSecret] = useState(makeSecret)
  const [seconds, setSeconds] = useState(90)
  const [left, setLeft] = useState(0)
  const [paused, setPaused] = useState(false)
  const [code, setCode] = useState('')
  const [roundNo, setRoundNo] = useState(0)
  const [bigQr, setBigQr] = useState<number | null>(null)
  const [scores, setScores] = useState<Record<number, number>>({})
  const lastArtist = useRef<number | undefined>(undefined)

  const setup: DrawSeatSetup = useMemo(
    () => ({ secret, players, levels, categories, customAnswers }),
    [secret, players, levels, categories, customAnswers],
  )

  const pool = useMemo(
    () => buildPool(DRAW_BANK as unknown as PoolItem[], setup),
    [setup],
  )

  const round = useMemo(
    () => (code ? resolveRound(setup, code, pool.length) : null),
    [setup, code, pool.length],
  )

  const seatUrls = useMemo(
    () => Array.from({ length: players }, (_, i) => buildSeatUrl(setup, i + 1)),
    [setup, players],
  )

  const urlLen = useMemo(() => estimateUrlLength(setup), [setup])
  const qrTooDense = urlLen > MAX_URL_LENGTH

  /* 倒數：時間到自動蓋牌 */
  useEffect(() => {
    if (phase !== 'drawing' || paused || seconds === 0) return
    if (left <= 0) {
      // 延後一個 tick，避免喺 effect 內同步 setState
      const done = window.setTimeout(() => {
        GameSound.timeUp?.()
        setPhase('covered')
      }, 0)
      return () => window.clearTimeout(done)
    }
    const t = window.setTimeout(() => setLeft((v) => v - 1), 1000)
    return () => window.clearTimeout(t)
  }, [phase, left, paused, seconds])

  const nextRound = useCallback(() => {
    const c = drawCode(setup, pool.length, lastArtist.current)
    setCode(c)
    setRoundNo((r) => r + 1)
    setPhase('lobby')
    lastArtist.current = resolveRound(setup, c, pool.length).artistSeat
  }, [setup, pool.length])

  const startDrawing = useCallback(() => {
    GameSound.unlock?.()
    setLeft(seconds)
    setPaused(false)
    setPhase('drawing')
  }, [seconds])

  const finish = useCallback(
    (correct: boolean) => {
      if (correct && round) {
        GameSound.correct?.()
        setScores((s) => ({ ...s, [round.artistSeat]: (s[round.artistSeat] || 0) + 1 }))
      } else {
        GameSound.skip?.()
      }
      setPhase('covered')
    },
    [round],
  )

  /* ============ SETUP ============ */
  if (phase === 'setup') {
    return (
      <Shell>
        <div className="mx-auto w-full max-w-2xl space-y-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white/85"
          >
            <ArrowLeft className="h-4 w-4" /> 返回一般模式
          </button>

          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0a2260] to-[#02133e] p-5 text-center">
            <div className="text-4xl">🎨🔒</div>
            <h1 className="mt-1 text-2xl font-black text-white">秘密派題模式</h1>
            <p className="mt-1 text-xs leading-relaxed text-white/75">
              題目直接送到畫家自己部手機，其他人手機一片空白，唔會有人偷望到主持機
            </p>
          </div>

          <Section icon={<Users className="h-4 w-4" />} title="玩家人數" hint="幾多人玩就出幾多個 QR">
            <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
              {Array.from({ length: 17 }, (_, i) => i + 4).map((n) => (
                <button
                  key={n}
                  onClick={() => setPlayers(n)}
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

          <Section icon={<Timer className="h-4 w-4" />} title="每題時間" hint="時間到會自動蓋牌；亦可隨時手動蓋牌">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {TIME_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSeconds(s)}
                  className={`rounded-xl border py-3 text-sm font-bold transition ${
                    seconds === s
                      ? 'border-amber-400 bg-amber-400/20 text-amber-200'
                      : 'border-white/15 bg-white/5 text-white/80'
                  }`}
                >
                  {s === 0 ? '手動' : `${s}秒`}
                </button>
              ))}
            </div>
          </Section>

          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-xs text-white/75">
            本局題庫共 <b className="text-amber-300">{pool.length}</b> 題
            {customAnswers.length > 0 && (
              <span className="text-amber-200">（含 {customAnswers.length} 條自訂）</span>
            )}
            <div className="mt-1 text-[11px] text-white/60">
              難度與分類跟隨上一頁「題庫篩選」設定
            </div>
          </div>

          {qrTooDense && (
            <div className="rounded-xl border border-rose-400/40 bg-rose-500/15 p-3.5 text-xs leading-relaxed text-rose-100">
              <b>⚠️ 自訂題目太多</b>
              <br />
              自訂題目需要寫入每個 QR，目前份量會令 QR 太密難掃。請刪減部分自訂題目。
            </div>
          )}

          <button
            onClick={() => setPhase('qr')}
            disabled={qrTooDense}
            className="w-full rounded-2xl bg-amber-400 py-4 text-base font-black text-stone-900 shadow-lg shadow-amber-500/20 active:scale-[0.99] disabled:opacity-40"
          >
            <QrCode className="mr-2 inline h-5 w-5" /> 產生 {players} 個 QR Code
          </button>
        </div>
      </Shell>
    )
  }

  /* ============ QR ============ */
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
              <div className="text-[11px] text-white/75">{players} 人 · 整晚只需掃一次</div>
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

          <button
            onClick={() => {
              setRoundNo(0)
              setCode('')
              setScores({})
              lastArtist.current = undefined
              setPhase('lobby')
            }}
            className="w-full rounded-2xl bg-amber-400 py-4 text-base font-black text-stone-900 active:scale-[0.99] print:hidden"
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

  /* ============ 遊戲中 ============ */
  const artist = round?.artistSeat
  const question = round ? pool[round.questionIndex % Math.max(1, pool.length)] : null

  return (
    <Shell>
      <div className="mx-auto w-full max-w-3xl space-y-4">
        {/* 叫人出場 */}
        {phase === 'lobby' && (
          <>
            {round ? (
              <div className="rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-900/40 to-[#02133e] p-6 text-center">
                <div className="text-xs text-white/75">第 {roundNo} 局 · 請呢位玩家出嚟</div>
                <div
                  className="my-1 font-black leading-none text-emerald-300"
                  style={{ fontSize: 'clamp(4rem, 20vw, 9rem)' }}
                >
                  {artist} 號
                </div>
                <div className="mt-3 inline-block rounded-2xl border border-white/15 bg-black/30 px-5 py-3">
                  <div className="text-[11px] text-white/70">本局代碼（等佢出到嚟先公布）</div>
                  <div
                    className="font-mono font-black tracking-[0.15em] text-amber-300"
                    style={{ fontSize: 'clamp(2.5rem, 12vw, 5rem)' }}
                  >
                    {code}
                  </div>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-white/75">
                  等 {artist} 號企定喺前面，先公布代碼；佢喺自己手機輸入後就見到題目
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0a2260] to-[#02133e] p-6 text-center">
                <div className="text-4xl">🎲</div>
                <div className="mt-2 text-lg font-black text-white">準備開始</div>
                <p className="mt-1 text-xs text-white/75">撳下面按鈕抽出本局畫家</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-2">
              {round && (
                <button
                  onClick={startDrawing}
                  className="w-full rounded-2xl bg-emerald-400 py-5 text-lg font-black text-stone-900 active:scale-[0.99]"
                >
                  <Play className="mr-2 inline h-6 w-6" /> 佢出到嚟喇，開始計時
                </button>
              )}
              <button
                onClick={nextRound}
                className="w-full rounded-2xl bg-amber-400 py-4 text-base font-black text-stone-900 active:scale-[0.99]"
              >
                <Dices className="mr-2 inline h-5 w-5" />
                {round ? '重抽另一位玩家' : '抽出第 1 位畫家'}
              </button>
            </div>
          </>
        )}

        {/* 作畫中 */}
        {phase === 'drawing' && (
          <>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
              <div className="text-xs text-white/75">
                第 {roundNo} 局 · {artist} 號作畫中
              </div>
              {seconds === 0 ? (
                <div className="my-4 text-4xl font-black text-white/85">手動計時</div>
              ) : (
                <div
                  className={`my-1 font-mono font-black leading-none ${
                    left <= 10 ? 'animate-pulse text-rose-400' : 'text-amber-300'
                  }`}
                  style={{ fontSize: 'clamp(4rem, 20vw, 9rem)' }}
                >
                  {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}
                </div>
              )}
              <div className="mt-2 rounded-xl border border-white/10 bg-black/25 px-4 py-2 text-xs text-white/70">
                🔒 題目只喺 {artist} 號部手機顯示，主持機唔會show出嚟
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => finish(true)}
                className="rounded-2xl bg-emerald-400 py-5 text-base font-black text-stone-900 active:scale-[0.99]"
              >
                <Check className="mr-1 inline h-5 w-5" /> 答對了
              </button>
              <button
                onClick={() => finish(false)}
                className="rounded-2xl border border-white/20 bg-white/10 py-5 text-base font-bold text-white active:scale-[0.99]"
              >
                <X className="mr-1 inline h-5 w-5" /> 冇人猜到
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {seconds > 0 && (
                <button
                  onClick={() => setPaused((p) => !p)}
                  className="rounded-xl border border-white/15 bg-white/5 py-3 text-xs text-white/85"
                >
                  {paused ? <Play className="mr-1 inline h-3.5 w-3.5" /> : <Pause className="mr-1 inline h-3.5 w-3.5" />}
                  {paused ? '繼續' : '暫停'}
                </button>
              )}
              <button
                onClick={() => setPhase('covered')}
                className="rounded-xl border border-white/15 bg-white/5 py-3 text-xs text-white/85"
              >
                <EyeOff className="mr-1 inline h-3.5 w-3.5" /> 立即蓋牌
              </button>
            </div>
          </>
        )}

        {/* 已蓋牌 */}
        {phase === 'covered' && (
          <>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
              <EyeOff className="mx-auto h-10 w-10 text-white/50" />
              <div className="mt-3 text-lg font-black text-white">🔒 本局結束</div>
              <div className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-500/15 p-4">
                <div className="text-[11px] text-emerald-200">本局題目</div>
                <div className="text-3xl font-black text-emerald-100">{question?.answer}</div>
              </div>
              <div className="mt-2 text-xs text-white/70">畫家：{artist} 號</div>
            </div>

            <button
              onClick={nextRound}
              className="w-full rounded-2xl bg-amber-400 py-5 text-lg font-black text-stone-900 active:scale-[0.99]"
            >
              <SkipForward className="mr-2 inline h-6 w-6" /> 下一局（叫下一位玩家）
            </button>
          </>
        )}

        {/* 計分 */}
        {Object.keys(scores).length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="mb-2 text-xs font-bold text-white/85">🏆 成功次數</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(scores)
                .sort((a, b) => b[1] - a[1])
                .map(([seat, n]) => (
                  <span
                    key={seat}
                    className="rounded-full border border-white/15 bg-black/25 px-3 py-1.5 text-xs text-white/90"
                  >
                    {seat} 號 · {n} 分
                  </span>
                ))}
            </div>
          </div>
        )}

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
            改設定
          </button>
          <button
            onClick={() => {
              setSecret(makeSecret())
              setCode('')
              setRoundNo(0)
              setScores({})
              lastArtist.current = undefined
              setPhase('setup')
            }}
            className="rounded-xl border border-white/15 bg-white/5 py-3 text-xs text-white/85"
          >
            <RotateCcw className="mr-1 inline h-3.5 w-3.5" /> 全新一局
          </button>
        </div>
      </div>
    </Shell>
  )
}

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

export type { Question }
