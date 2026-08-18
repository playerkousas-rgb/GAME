/**
 * 猜猜畫畫 — 玩家手機卡（掃 QR 後常駐）
 * Copyright (c) 2026 Scout System. All rights reserved.
 *
 * 平時只顯示自己嘅玩家號。輪到自己作畫時，卡片先會出題目。
 * 每局只需撳「下一局」對齊領袖畫面，毋須輸入任何嘢。
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Home, EyeOff, Palette, Lock, ChevronLeft, ChevronRight, Flag } from 'lucide-react'
import { DRAW_BANK } from '../../data/drawBank'
import { buildPool, parseSeatUrl, resolveRound, type PoolItem } from './lib/seat'

export default function DrawCard() {
  const link = useMemo(() => parseSeatUrl(window.location.hash), [])
  const storeKey = link ? `scoutsys:draw:r:${link.secret}` : ''

  const [round, setRound] = useState(() => {
    if (!link) return 1
    const saved = Number(localStorage.getItem(`scoutsys:draw:r:${link.secret}`) || '1')
    return Number.isFinite(saved) && saved >= 1 ? saved : 1
  })
  /** revealedRound === round 時才顯示，換局自動遮蓋 */
  const [revealedRound, setRevealedRound] = useState(0)
  const revealed = revealedRound === round

  useEffect(() => {
    if (storeKey) localStorage.setItem(storeKey, String(round))
  }, [round, storeKey])

  const pool: PoolItem[] = useMemo(
    () => (link ? buildPool(DRAW_BANK as unknown as PoolItem[], link) : []),
    [link],
  )

  const result = useMemo(
    () => (link ? resolveRound(link, round, pool.length) : null),
    [link, round, pool.length],
  )

  const vibrate = useCallback((ms = 25) => {
    try {
      navigator.vibrate?.(ms)
    } catch {
      /* ignore */
    }
  }, [])

  if (!link || !result) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-[#02133e] p-6 text-center text-white">
        <div className="text-5xl">🎨</div>
        <h1 className="text-xl font-black">連結無效</h1>
        <p className="max-w-xs text-sm text-white/80">
          請重新掃描領袖畫面上屬於你的 QR Code。每位玩家的 QR 都不同。
        </p>
        <Link to="/draw" className="rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-stone-900">
          前往主持台
        </Link>
      </div>
    )
  }

  const total = link.rounds
  const finished = round > total
  const isArtist = result.artistSeat === link.seat
  const question = pool.length ? pool[result.questionIndex % pool.length] : null

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#02133e] text-white">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <Link to="/" className="flex items-center gap-1 text-xs text-white/80 hover:text-white">
          <Home className="h-4 w-4" /> 主頁
        </Link>
        <div className="flex items-center gap-2 text-xs text-white/85">
          <Palette className="h-4 w-4 text-emerald-300" />
          <span>猜猜畫畫</span>
        </div>
        <div className="w-12" />
      </header>

      {/* 玩家號永遠顯示 */}
      <div className="border-b border-white/10 bg-white/5 px-4 py-4 text-center">
        <div className="text-[11px] text-white/70">你的玩家號</div>
        <div className="text-5xl font-black text-amber-300">{link.seat} 號</div>
        <div className="mt-1 text-[11px] text-white/60">共 {link.players} 人</div>
      </div>

      {finished ? (
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <Flag className="h-14 w-14 text-amber-300" />
          <h1 className="text-2xl font-black">整輪玩完！</h1>
          <p className="max-w-xs text-sm leading-relaxed text-white/75">
            呢輪 {total} 局已經玩晒。想繼續就叫領袖開新牌局，重新掃一次 QR。
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
            <div className="mx-auto mt-3 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-amber-400 transition-all"
                style={{ width: `${(round / total) * 100}%` }}
              />
            </div>
          </div>

          <main className="flex flex-1 flex-col items-center justify-center px-5 pb-6">
            {isArtist ? (
              <>
                <div className="mb-3 rounded-full bg-emerald-500/20 px-4 py-1.5 text-xs font-bold text-emerald-200">
                  🎨 今局輪到你作畫
                </div>
                <button
                  onPointerDown={() => {
                    setRevealedRound(round)
                    vibrate(30)
                  }}
                  onPointerUp={() => setRevealedRound(0)}
                  onPointerLeave={() => setRevealedRound(0)}
                  onPointerCancel={() => setRevealedRound(0)}
                  onContextMenu={(e) => e.preventDefault()}
                  className={`flex aspect-[3/4] w-full max-w-sm select-none flex-col items-center justify-center rounded-3xl bg-gradient-to-br shadow-2xl ring-4 transition-transform active:scale-[0.98] ${
                    revealed
                      ? 'from-emerald-500 to-emerald-700 ring-emerald-300/60'
                      : 'from-[#0a2260] to-[#02133e] ring-white/10'
                  }`}
                  style={{ WebkitTouchCallout: 'none' }}
                >
                  {revealed ? (
                    <div className="px-6 text-center text-emerald-50">
                      <div className="text-xs font-bold tracking-widest opacity-90">你要畫的是</div>
                      <div className="mt-4 break-all text-5xl font-black leading-tight">
                        {question?.answer}
                      </div>
                      {question?.hint && (
                        <div className="mt-4 inline-block rounded-full bg-black/25 px-3 py-1 text-xs">
                          💡 {question.hint}
                        </div>
                      )}
                      <p className="mt-5 text-xs leading-relaxed opacity-90">
                        只可畫圖，不可寫字、講嘢或做手勢
                      </p>
                    </div>
                  ) : (
                    <div className="px-6 text-center text-white/85">
                      <EyeOff className="mx-auto h-10 w-10 text-white/50" />
                      <div className="mt-4 text-lg font-black">按住卡片查看題目</div>
                      <p className="mt-2 text-xs text-white/65">放手即自動遮蓋，防止旁人偷看</p>
                    </div>
                  )}
                </button>
              </>
            ) : (
              <div className="text-center">
                <Lock className="mx-auto h-12 w-12 text-white/30" />
                <div className="mt-4 text-lg font-black text-white/85">今局唔係你出場</div>
                <p className="mt-2 text-sm text-white/70">
                  本局畫家係 <b className="text-amber-300">{result.artistSeat} 號</b>
                </p>
                <p className="mt-4 max-w-xs text-xs leading-relaxed text-white/60">
                  盡快猜出佢畫緊咩！等下一局領袖叫人，再一齊撳「下一局」。
                </p>
              </div>
            )}
          </main>
        </>
      )}
    </div>
  )
}
