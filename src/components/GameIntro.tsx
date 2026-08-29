/**
 * 玩法介紹（功能介紹）+ 示範模式（MOCK）共用元件
 * — 各遊戲統一入口：📖 玩法介紹（modal）、🎬 觀看示範（自動示範）
 */
import { useEffect, useState } from 'react'
import { X, BookOpen, Clapperboard } from 'lucide-react'

export interface IntroSection {
  title: string
  items: string[]
}

export interface GameIntroProps {
  open: boolean
  onClose: () => void
  emoji: string
  title: string
  tagline?: string
  sections: IntroSection[]
}

/** 功能介紹 modal */
export function GameIntro({ open, onClose, emoji, title, tagline, sections }: GameIntroProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-[200] grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${title} 玩法介紹`}
    >
      <div
        className="max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-amber-400/25 bg-[#0b1c4a] p-5 text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-black">
              {emoji} {title}
            </h2>
            {tagline && <p className="mt-0.5 text-xs text-white/60">{tagline}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉"
            className="rounded-xl bg-white/10 p-2 transition hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4">
          {sections.map((s) => (
            <section key={s.title}>
              <h3 className="mb-1.5 text-sm font-bold text-amber-300">{s.title}</h3>
              <ul className="space-y-1.5">
                {s.items.map((it) => (
                  <li key={it} className="flex gap-2 text-[13px] leading-relaxed text-white/85">
                    <span className="mt-0.5 shrink-0 text-amber-400">•</span>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-amber-400 py-2.5 font-bold text-stone-900 transition hover:bg-amber-300"
        >
          明白了
        </button>
      </div>
    </div>
  )
}

/** 統一入口按鈕：📖 玩法介紹 + 🎬 觀看示範 */
export function IntroDemoButtons({
  onIntro,
  onDemo,
  demoLabel = '🎬 觀看示範',
  className = '',
}: {
  onIntro: () => void
  onDemo?: () => void
  demoLabel?: string
  className?: string
}) {
  return (
    <div className={`flex gap-2 ${className}`}>
      <button
        type="button"
        onClick={onIntro}
        className="flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-bold text-white/90 transition hover:bg-white/10"
      >
        <BookOpen className="h-4 w-4" /> 玩法介紹
      </button>
      {onDemo && (
        <button
          type="button"
          onClick={onDemo}
          className="flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-xl border border-indigo-400/40 bg-indigo-500/15 px-4 py-2.5 text-sm font-bold text-indigo-200 transition hover:bg-indigo-500/25"
        >
          <Clapperboard className="h-4 w-4" /> {demoLabel}
        </button>
      )}
    </div>
  )
}

/** 示範模式浮標：🎬 徽章 + 目前步驟說明 + 結束示範 */
export function DemoCaption({
  text,
  onExit,
}: {
  text: string
  onExit: () => void
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[150] flex flex-col items-center gap-2 p-3">
      <div className="pointer-events-auto flex w-full max-w-xl items-center gap-2 rounded-2xl border border-indigo-400/40 bg-[#0b1c4a]/95 p-3 shadow-2xl backdrop-blur">
        <span className="shrink-0 rounded-lg bg-indigo-500/25 px-2 py-1 text-[11px] font-black text-indigo-200">
          🎬 示範
        </span>
        <p className="min-w-0 flex-1 text-[13px] leading-snug text-white/90">{text}</p>
        <button
          type="button"
          onClick={onExit}
          className="shrink-0 rounded-lg bg-white/10 px-2.5 py-1.5 text-[11px] font-bold text-white/70 transition hover:bg-white/20"
        >
          結束
        </button>
      </div>
    </div>
  )
}
