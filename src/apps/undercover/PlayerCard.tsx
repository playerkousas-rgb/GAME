/**
 * 誰是臥底 — 玩家手機卡（掃 QR 後進入）
 * Copyright (c) 2026 Scout System. All rights reserved.
 *
 * 每人一條固定連結（座位號固定），整晚只需掃一次。
 * 每局領袖即場抽出「本局代碼」，玩家輸入後即見本局身分。
 */
import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EyeOff, Home, Users, Delete, Dices } from 'lucide-react'
import {
  dealRound, isCodeComplete, normalizeCode, parseSeatUrl, seatLinkToSetup,
  ROLE_EMOJI, ROLE_LABEL, CODE_LENGTH,
} from './lib/deal'

const ROLE_STYLE: Record<string, { bg: string; ring: string; text: string }> = {
  civilian: { bg: 'from-emerald-500 to-emerald-700', ring: 'ring-emerald-300/60', text: 'text-emerald-50' },
  undercover: { bg: 'from-rose-500 to-rose-700', ring: 'ring-rose-300/60', text: 'text-rose-50' },
  blank: { bg: 'from-slate-400 to-slate-600', ring: 'ring-slate-200/60', text: 'text-slate-50' },
}

/** 數字鍵盤排列（電話式） */
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

export default function PlayerCard() {
  const link = useMemo(() => parseSeatUrl(window.location.hash), [])
  const setup = useMemo(() => (link ? seatLinkToSetup(link) : null), [link])

  const [code, setCode] = useState('')
  /** 已確認的代碼（輸入完整後鎖定顯示卡片） */
  const [activeCode, setActiveCode] = useState('')
  const [revealed, setRevealed] = useState(false)

  const vibrate = useCallback((ms = 25) => {
    try {
      navigator.vibrate?.(ms)
    } catch {
      /* ignore */
    }
  }, [])

  const result = useMemo(
    () => (setup && activeCode ? dealRound(setup, activeCode) : null),
    [setup, activeCode],
  )
  const mine = result?.seats.find((s) => s.seat === link?.seat)

  const press = (ch: string) => {
    if (code.length >= CODE_LENGTH) return
    const next = normalizeCode(code + ch)
    setCode(next)
    vibrate()
    if (isCodeComplete(next)) {
      setActiveCode(next)
      setRevealed(false)
    }
  }

  const back = () => {
    setCode((c) => c.slice(0, -1))
    setActiveCode('')
    setRevealed(false)
    vibrate()
  }

  const reset = () => {
    setCode('')
    setActiveCode('')
    setRevealed(false)
    vibrate()
  }

  if (!link || !setup) {
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

      {/* ---------- 未輸入代碼：鍵盤 ---------- */}
      {!mine && (
        <main className="flex flex-1 flex-col px-4 py-4">
          <div className="text-center">
            <Dices className="mx-auto h-8 w-8 text-amber-300" />
            <h1 className="mt-2 text-lg font-black">輸入本局代碼</h1>
            <p className="mt-1 text-xs leading-relaxed text-white/75">
              領袖每局都會即場抽出一個新代碼，請照住畫面輸入
            </p>
          </div>

          {/* 代碼格 */}
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

          {/* 鍵盤 */}
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
                onClick={back}
                className="rounded-2xl border border-white/15 bg-white/5 py-5 text-white/80 active:scale-90"
                aria-label="刪除"
              >
                <Delete className="mx-auto h-5 w-5" />
              </button>
            </div>
          </div>

          <p className="mt-auto pt-4 text-center text-[11px] text-white/60">
            撳完 {CODE_LENGTH} 個數字即自動顯示身分卡
          </p>
        </main>
      )}

      {/* ---------- 已有代碼：身分卡 ---------- */}
      {mine && (
        <>
          <div className="flex items-center justify-center gap-2 px-4 py-3">
            <div className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-center">
              <div className="text-[10px] text-white/70">本局代碼</div>
              <div className="font-mono text-lg font-black tracking-widest text-amber-300">
                {activeCode}
              </div>
            </div>
            <button
              onClick={reset}
              className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-xs font-bold text-white active:scale-95"
            >
              換新代碼
            </button>
          </div>

          <main className="flex flex-1 items-center justify-center px-5 pb-6">
            <button
              onPointerDown={() => {
                setRevealed(true)
                vibrate(30)
              }}
              onPointerUp={() => setRevealed(false)}
              onPointerLeave={() => setRevealed(false)}
              onPointerCancel={() => setRevealed(false)}
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
                    {link.seat} 號 · 代碼 {activeCode}
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
