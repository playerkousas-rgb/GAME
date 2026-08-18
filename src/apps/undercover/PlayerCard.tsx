/**
 * 誰是臥底 — 玩家手機卡（掃 QR 後進入）
 * Copyright (c) 2026 Scout System. All rights reserved.
 *
 * 每人固定一條連結（座位號固定），每回合按「下一回合」即自動換新角色，
 * 因為所有裝置用同一條種子公式計算，結果必定一致。
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, ChevronLeft, ChevronRight, RefreshCw, Home, Users } from 'lucide-react'
import { dealRound, parseSeatUrl, ROLE_EMOJI, ROLE_LABEL, type GameSetup } from './lib/deal'

const ROLE_STYLE: Record<string, { bg: string; ring: string; text: string }> = {
  civilian: { bg: 'from-emerald-500 to-emerald-700', ring: 'ring-emerald-300/60', text: 'text-emerald-50' },
  undercover: { bg: 'from-rose-500 to-rose-700', ring: 'ring-rose-300/60', text: 'text-rose-50' },
  blank: { bg: 'from-slate-400 to-slate-600', ring: 'ring-slate-200/60', text: 'text-slate-50' },
}

export default function PlayerCard() {
  const params = useMemo(() => parseSeatUrl(window.location.hash), [])
  const storeKey = params ? `scoutsys:uc:round:${params.seed}` : ''

  const [round, setRound] = useState(() => {
    if (!params) return 1
    const saved = Number(localStorage.getItem(`scoutsys:uc:round:${params.seed}`) || '1')
    return Number.isFinite(saved) && saved >= 1 ? saved : 1
  })
  /** revealedRound === round 時才顯示，換回合自動遮蓋，毋須 effect */
  const [revealedRound, setRevealedRound] = useState(0)
  const revealed = revealedRound === round
  const setRevealed = (v: boolean) => setRevealedRound(v ? round : 0)

  useEffect(() => {
    if (storeKey) localStorage.setItem(storeKey, String(round))
  }, [round, storeKey])

  const setup: GameSetup | null = useMemo(
    () =>
      params
        ? {
            seed: params.seed,
            players: params.players,
            undercovers: params.undercovers,
            blanks: params.blanks,
            categories: params.categories,
          }
        : null,
    [params],
  )

  const result = useMemo(() => (setup ? dealRound(setup, round) : null), [setup, round])
  const mine = result?.seats.find((s) => s.seat === params?.seat)

  const vibrate = useCallback(() => {
    try {
      navigator.vibrate?.(30)
    } catch {
      /* ignore */
    }
  }, [])

  if (!params || !setup || !mine || !result) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-[#02133e] p-6 text-center text-white">
        <div className="text-5xl">🕵️</div>
        <h1 className="text-xl font-black">連結無效</h1>
        <p className="max-w-xs text-sm text-white/70">
          請重新掃描領袖畫面上屬於你的 QR Code。每位玩家的 QR 都不同，切勿掃錯。
        </p>
        <Link to="/undercover" className="rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-stone-900">
          前往主持台
        </Link>
      </div>
    )
  }

  const style = ROLE_STYLE[mine.role]

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#02133e] text-white">
      {/* 頂列 */}
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <Link to="/" className="flex items-center gap-1 text-xs text-white/70 hover:text-white">
          <Home className="h-4 w-4" /> 主頁
        </Link>
        <div className="flex items-center gap-2 text-xs text-white/80">
          <Users className="h-4 w-4 text-amber-300" />
          <span>{setup.players} 人</span>
          <span className="text-white/75">|</span>
          <span className="font-bold text-amber-300">{params.seat} 號玩家</span>
        </div>
        <div className="w-12" />
      </header>

      {/* 回合控制 */}
      <div className="flex items-center justify-center gap-3 px-4 py-3">
        <button
          onClick={() => {
            setRound((r) => Math.max(1, r - 1))
            vibrate()
          }}
          disabled={round <= 1}
          className="rounded-xl border border-white/20 bg-white/10 p-3 text-white disabled:opacity-30"
          aria-label="上一回合"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="min-w-28 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-center">
          <div className="text-[10px] text-amber-200/90">回合</div>
          <div className="text-2xl font-black text-amber-300">第 {round} 局</div>
        </div>
        <button
          onClick={() => {
            setRound((r) => r + 1)
            vibrate()
          }}
          className="rounded-xl border border-white/20 bg-white/10 p-3 text-white"
          aria-label="下一回合"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      <p className="px-6 pb-2 text-center text-[11px] leading-relaxed text-white/75">
        請將回合數調至與領袖畫面相同，然後長按下方卡片查看你的身分。
      </p>

      {/* 卡片 */}
      <main className="flex flex-1 items-center justify-center px-5 pb-6">
        <button
          onPointerDown={() => {
            setRevealed(true)
            vibrate()
          }}
          onPointerUp={() => setRevealed(false)}
          onPointerLeave={() => setRevealed(false)}
          onContextMenu={(e) => e.preventDefault()}
          className={`relative flex aspect-[3/4] w-full max-w-sm select-none flex-col items-center justify-center rounded-3xl bg-gradient-to-br shadow-2xl ring-4 transition-transform active:scale-[0.98] ${
            revealed ? `${style.bg} ${style.ring}` : 'from-[#0a2260] to-[#02133e] ring-white/10'
          }`}
          style={{ WebkitTouchCallout: 'none' }}
        >
          {revealed ? (
            <div className={`px-6 text-center ${style.text}`}>
              <div className="text-5xl">{ROLE_EMOJI[mine.role]}</div>
              <div className="mt-2 text-sm font-bold tracking-widest opacity-90">
                {ROLE_LABEL[mine.role]}
              </div>
              {mine.role === 'blank' ? (
                <>
                  <div className="mt-5 text-4xl font-black">白 卡</div>
                  <p className="mt-3 text-xs leading-relaxed opacity-90">
                    你沒有詞語。留心聽其他人發言，扮成平民蒙混過關！
                  </p>
                </>
              ) : (
                <>
                  <div className="mt-5 break-all text-5xl font-black leading-tight">{mine.word}</div>
                  <p className="mt-4 text-xs leading-relaxed opacity-90">
                    {mine.role === 'undercover'
                      ? '你是臥底！你的詞語與大部分人不同，小心描述。'
                      : '你是平民。找出詞語不同的臥底。'}
                  </p>
                </>
              )}
              <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-black/25 px-3 py-1 text-[11px]">
                🗣️ 第 {mine.order} 位發言
              </div>
            </div>
          ) : (
            <div className="px-6 text-center text-white/80">
              <EyeOff className="mx-auto h-10 w-10 text-white/70" />
              <div className="mt-4 text-lg font-black">按住卡片查看身分</div>
              <p className="mt-2 text-xs text-white/75">放手即自動遮蓋，防止旁人偷看</p>
              <div className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs">
                <Eye className="h-3.5 w-3.5 text-amber-300" /> 第 {round} 局 · {params.seat} 號
              </div>
            </div>
          )}
        </button>
      </main>

      <footer className="border-t border-white/10 px-4 py-3 text-center">
        <button
          onClick={() => {
            setRound(1)
            vibrate()
          }}
          className="inline-flex items-center gap-1.5 text-xs text-white/75 hover:text-white"
        >
          <RefreshCw className="h-3.5 w-3.5" /> 重設回合至第 1 局
        </button>
      </footer>
    </div>
  )
}
