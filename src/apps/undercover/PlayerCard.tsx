/**
 * 誰是臥底 — 玩家手機卡（掃 QR 後進入）
 * Copyright (c) 2026 Scout System. All rights reserved.
 *
 * 掃一次 QR 即可玩足整輪。每局只需撳「下一局」，毋須輸入任何嘢。
 * 局數會記入 localStorage，中途熄咗屏幕／閂咗瀏覽器都唔會失去進度。
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EyeOff, Home, Users, ChevronLeft, ChevronRight, Flag } from 'lucide-react'
import {
  dealRound, parseSeatUrl, seatLinkToSetup, ROLE_EMOJI, ROLE_LABEL,
} from './lib/deal'

const ROLE_STYLE: Record<string, { bg: string; ring: string; text: string }> = {
  civilian: { bg: 'from-emerald-500 to-emerald-700', ring: 'ring-emerald-300/60', text: 'text-emerald-50' },
  undercover: { bg: 'from-rose-500 to-rose-700', ring: 'ring-rose-300/60', text: 'text-rose-50' },
  blank: { bg: 'from-slate-400 to-slate-600', ring: 'ring-slate-200/60', text: 'text-slate-50' },
}

export default function PlayerCard() {
  const link = useMemo(() => parseSeatUrl(window.location.hash), [])
  const setup = useMemo(() => (link ? seatLinkToSetup(link) : null), [link])
  const storeKey = link ? `scoutsys:uc:r:${link.secret}` : ''

  const [round, setRound] = useState(() => {
    if (!link) return 1
    const saved = Number(localStorage.getItem(`scoutsys:uc:r:${link.secret}`) || '1')
    return Number.isFinite(saved) && saved >= 1 ? saved : 1
  })
  /** revealedRound === round 時才顯示，換局自動遮蓋 */
  const [revealedRound, setRevealedRound] = useState(0)
  const revealed = revealedRound === round

  useEffect(() => {
    if (storeKey) localStorage.setItem(storeKey, String(round))
  }, [round, storeKey])

  const vibrate = useCallback((ms = 25) => {
    try {
      navigator.vibrate?.(ms)
    } catch {
      /* ignore */
    }
  }, [])

  const result = useMemo(
    () => (setup ? dealRound(setup, round) : null),
    [setup, round],
  )
  const mine = result?.seats.find((s) => s.seat === link?.seat)

  if (!link || !setup || !mine) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-[#02133e] p-6 text-center text-white">
        <div className="text-5xl">🕵️</div>
        <h1 className="text-xl font-black">連結無效</h1>
        <p className="max-w-xs text-sm text-white/80">
          請重新掃描領袖畫面上屬於你的 QR Code。每位玩家的 QR 都不同，切勿掃錯。
        </p>
        <Link to="/undercover" className="rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-stone-900">
          前往主持台
        </Link>
      </div>
    )
  }

  const total = setup.rounds
  const finished = round > total

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#02133e] text-white">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <Link to="/" className="flex items-center gap-1 text-xs text-white/80 hover:text-white">
          <Home className="h-4 w-4" /> 主頁
        </Link>
        <div className="flex items-center gap-2 text-xs text-white/85">
          <Users className="h-4 w-4 text-amber-300" />
          <span>{setup.players} 人</span>
          <span className="text-white/35">|</span>
          <span className="font-bold text-amber-300">{link.seat} 號玩家</span>
        </div>
        <div className="w-12" />
      </header>

      {finished ? (
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <Flag className="h-14 w-14 text-amber-300" />
          <h1 className="text-2xl font-black">整輪玩完！</h1>
          <p className="max-w-xs text-sm leading-relaxed text-white/75">
            呢輪 {total} 局已經玩晒。想繼續玩就叫領袖開新牌局，重新掃一次 QR。
          </p>
          <button
            onClick={() => {
              setRound(total)
              vibrate()
            }}
            className="rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white"
          >
            返回第 {total} 局
          </button>
        </main>
      ) : (
        <>
          {/* 局數 */}
          <div className="px-4 py-3">
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  setRound((r) => Math.max(1, r - 1))
                  vibrate()
                }}
                disabled={round <= 1}
                className="rounded-xl border border-white/20 bg-white/10 p-3.5 text-white disabled:opacity-25"
                aria-label="上一局"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <div className="min-w-32 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-center">
                <div className="text-[10px] text-amber-100/85">本輪第</div>
                <div className="text-3xl font-black leading-tight text-amber-300">{round}</div>
                <div className="text-[10px] text-amber-100/85">／ {total} 局</div>
              </div>
              <button
                onClick={() => {
                  setRound((r) => r + 1)
                  vibrate()
                }}
                className="rounded-xl border border-amber-400/50 bg-amber-400/20 p-3.5 text-amber-200"
                aria-label="下一局"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
            {/* 進度條 */}
            <div className="mx-auto mt-3 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-amber-400 transition-all"
                style={{ width: `${(round / total) * 100}%` }}
              />
            </div>
            <p className="mt-2 text-center text-[11px] text-white/65">
              請將局數對齊領袖畫面，然後長按卡片查看身分
            </p>
          </div>

          {/* 卡片 */}
          <main className="flex flex-1 items-center justify-center px-5 pb-6">
            <button
              onPointerDown={() => {
                setRevealedRound(round)
                vibrate(30)
              }}
              onPointerUp={() => setRevealedRound(0)}
              onPointerLeave={() => setRevealedRound(0)}
              onPointerCancel={() => setRevealedRound(0)}
              onContextMenu={(e) => e.preventDefault()}
              className={`relative flex aspect-[3/4] w-full max-w-sm select-none flex-col items-center justify-center rounded-3xl bg-gradient-to-br shadow-2xl ring-4 transition-transform active:scale-[0.98] ${
                revealed
                  ? `${ROLE_STYLE[mine.role].bg} ${ROLE_STYLE[mine.role].ring}`
                  : 'from-[#0a2260] to-[#02133e] ring-white/10'
              }`}
              style={{ WebkitTouchCallout: 'none' }}
            >
              {revealed ? (
                <div className={`px-6 text-center ${ROLE_STYLE[mine.role].text}`}>
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
                <div className="px-6 text-center text-white/85">
                  <EyeOff className="mx-auto h-10 w-10 text-white/50" />
                  <div className="mt-4 text-lg font-black">按住卡片查看身分</div>
                  <p className="mt-2 text-xs text-white/65">放手即自動遮蓋，防止旁人偷看</p>
                  <div className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs">
                    第 {round} 局 · {link.seat} 號
                  </div>
                </div>
              )}
            </button>
          </main>
        </>
      )}
    </div>
  )
}
