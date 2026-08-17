/**
 * 浮動「返回主頁」按鈕 — 於各子遊戲頁面顯示
 * Copyright (c) 2026 Scout System. All rights reserved.
 */
import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'

export default function BackToHub() {
  return (
    <Link
      to="/"
      title="返回遊戲中心"
      className="fixed bottom-3 left-3 z-[60] flex items-center gap-1.5 rounded-full border border-white/15 bg-black/50 px-3 py-2 text-[11px] font-medium text-white/60 backdrop-blur transition hover:border-amber-400/50 hover:bg-black/70 hover:text-amber-300"
    >
      <Home className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">主頁</span>
    </Link>
  )
}
