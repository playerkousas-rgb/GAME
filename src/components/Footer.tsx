/**
 * 全站頁腳 — 統一版權標示
 * Copyright (c) 2026 Scout System. All rights reserved.
 */
import { BRAND, COPYRIGHT } from '../shared/brand'

export default function Footer({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="pointer-events-none fixed bottom-1 right-2 z-10 text-[10px] text-white/15 select-none">
        {COPYRIGHT}
      </div>
    )
  }

  return (
    <footer className="mt-8 border-t border-white/10 bg-black/20">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-1 px-4 py-4 md:flex-row">
        <div className="flex items-center gap-2 text-[11px] text-white/40">
          <span className="text-amber-400">⚜</span>
          <span>{COPYRIGHT}</span>
          <span className="text-white/20">·</span>
          <span>{BRAND.nameZh}</span>
        </div>
        <div className="text-[11px] text-white/25">{BRAND.version}</div>
      </div>
    </footer>
  )
}
