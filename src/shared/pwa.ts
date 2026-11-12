/**
 * PWA 工具 — 註冊 Service Worker、standalone／iOS 偵測
 * Copyright (c) 2026 Scout System. All rights reserved.
 *
 * 安裝入口同更新流程 UI 見 src/components/InstallButton.tsx 同
 * src/components/UpdateBanner.tsx（規則：docs/46-pwa-install-and-update）。
 */

/** 係咪以「已安裝 App」(standalone) 方式開啟 */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari 專用屬性
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

/** 係咪 iOS／iPadOS（冇 beforeinstallprompt，要出三步教學卡） */
export function isIos(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/i.test(ua)) return true
  // iPadOS 13+ 會偽裝成 MacIntel
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
}

/** 註冊 Service Worker（只限生產環境） */
export function registerServiceWorker(): void {
  if (import.meta.env.DEV) return
  if (typeof window === 'undefined') return
  if (!('serviceWorker' in navigator)) return

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch(() => {
      // 註冊失敗（例如私密模式）唔阻住個 App 用
    })
  })
}
