/**
 * 猜猜畫畫 — 玩家手機卡（掃 QR 後常駐）
 * Copyright (c) 2026 Scout System. All rights reserved.
 *
 * 平時只顯示自己嘅玩家號。輪到自己作畫時，領袖公布 4 位代碼，
 * 輸入後只有「本局畫家」先會見到題目，其他人手機仍然係空白。
 */
import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Home, Delete, EyeOff, Palette, Lock } from 'lucide-react'
import { DRAW_BANK } from '../../data/drawBank'
import {
  buildPool, CODE_LENGTH, normalizeCode, parseSeatUrl, resolveRound, type PoolItem,
} from './lib/seat'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

export default function DrawCard() {
  const link = useMemo(() => parseSeatUrl(window.location.hash), [])
  const [code, setCode] = useState('')
  const [activeCode, setActiveCode] = useState('')
  const [revealed, setRevealed] = useState(false)

  const pool: PoolItem[] = useMemo(
    () => (link ? buildPool(DRAW_BANK as unknown as PoolItem[], link) : []),
    [link],
  )

  const round = useMemo(
    () => (link && activeCode ? resolveRound(link, activeCode, pool.length) : null),
    [link, activeCode, pool.length],
  )

  const isArtist = round?.artistSeat === link?.seat
  const question = round ? pool[round.questionIndex % Math.max(1, pool.length)] : null

  const vibrate = useCallback((ms = 25) => {
    try {
      navigator.vibrate?.(ms)
    } catch {
      /* ignore */
    }
  }, [])

  const press = (ch: string) => {
    if (code.length >= CODE_LENGTH) return
    const next = normalizeCode(code + ch)
    setCode(next)
    vibrate()
    if (next.length === CODE_LENGTH) {
      setActiveCode(next)
      setRevealed(false)
    }
  }

  const reset = () => {
    setCode('')
    setActiveCode('')
    setRevealed(false)
    vibrate()
  }

  if (!link) {
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
      <div className="border-b border-white/10 bg-white/5 px-4 py-5 text-center">
        <div className="text-[11px] text-white/70">你的玩家號</div>
        <div className="text-5xl font-black text-amber-300">{link.seat} 號</div>
        <div className="mt-1 text-[11px] text-white/60">共 {link.players} 人</div>
      </div>

      {/* 未輸入代碼 */}
      {!round && (
        <main className="flex flex-1 flex-col px-4 py-4">
          <div className="text-center">
            <h1 className="text-base font-black">輸入本局代碼</h1>
            <p className="mt-1 text-xs leading-relaxed text-white/75">
              領袖叫到你個號、你出到嚟之後，先輸入畫面上嘅 4 位數字
            </p>
          </div>

          <div className="mt-4 flex justify-center gap-2.5">
            {Array.from({ length: CODE_LENGTH }).map((_, i) => (
              <div
                key={i}
                className={`flex h-16 w-14 items-center justify-center rounded-2xl border-2 font-mono text-3xl font-black ${
                  code[i]
                    ? 'border-amber-400 bg-amber-400/15 text-amber-200'
                    : 'border-white/20 bg-white/5 text-white/30'
                }`}
              >
                {code[i] || ''}
              </div>
            ))}
          </div>

          <div className="mx-auto mt-6 w-full max-w-xs">
            <div className="grid grid-cols-3 gap-2.5">
              {KEYS.map((k) => (
                <button
                  key={k}
                  onClick={() => press(k)}
                  className="rounded-2xl border border-white/15 bg-white/10 py-5 font-mono text-2xl font-black text-white active:scale-90 active:bg-amber-400 active:text-stone-900"
                >
                  {k}
                </button>
              ))}
              <button
                onClick={reset}
                className="rounded-2xl border border-white/15 bg-white/5 py-5 text-xs font-bold text-white/80 active:scale-90"
              >
                清除
              </button>
              <button
                onClick={() => press('0')}
                className="rounded-2xl border border-white/15 bg-white/10 py-5 font-mono text-2xl font-black text-white active:scale-90 active:bg-amber-400 active:text-stone-900"
              >
                0
              </button>
              <button
                onClick={() => {
                  setCode((c) => c.slice(0, -1))
                  vibrate()
                }}
                className="rounded-2xl border border-white/15 bg-white/5 py-5 text-white/80 active:scale-90"
                aria-label="刪除"
              >
                <Delete className="mx-auto h-5 w-5" />
              </button>
            </div>
          </div>
        </main>
      )}

      {/* 已輸入代碼 */}
      {round && (
        <main className="flex flex-1 flex-col items-center justify-center px-5 py-6">
          {isArtist ? (
            <>
              <div className="mb-3 rounded-full bg-emerald-500/20 px-4 py-1.5 text-xs font-bold text-emerald-200">
                🎨 今局輪到你作畫
              </div>
              <button
                onPointerDown={() => {
                  setRevealed(true)
                  vibrate(30)
                }}
                onPointerUp={() => setRevealed(false)}
                onPointerLeave={() => setRevealed(false)}
                onPointerCancel={() => setRevealed(false)}
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
                      <div className="mt-4 rounded-full bg-black/25 px-3 py-1 text-xs">
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
                本局畫家係 <b className="text-amber-300">{round.artistSeat} 號</b>
              </p>
              <p className="mt-4 max-w-xs text-xs leading-relaxed text-white/60">
                盡快猜出佢畫緊咩！等下一局領袖再公布新代碼。
              </p>
            </div>
          )}

          <button
            onClick={reset}
            className="mt-6 rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-xs font-bold text-white active:scale-95"
          >
            輸入下一局代碼
          </button>
        </main>
      )}
    </div>
  )
}
