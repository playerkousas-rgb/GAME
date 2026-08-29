/**
 * 浮動「返回主頁」按鈕 — 於各子遊戲頁面顯示（深淺主題通用）
 * Copyright (c) 2026 Scout System. All rights reserved.
 */
import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'

export default function BackToHub() {
  return (
    <Link
      to="/"
      title="返回遊戲中心"
      style={{ bottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
      className="hub-pill fixed left-3 z-[60] flex items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-medium"
    >
      <Home className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">主頁</span>
    </Link>
  )
}
