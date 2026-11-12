/**
 * 「有新版本可用」更新橫額
 * Copyright (c) 2026 Scout System. All rights reserved.
 *
 * 規則（docs/46-pwa-install-and-update）：
 *  - UP1：新 SW 停喺 waiting，唔自動換版（sw.js 唔會喺 install 無條件 skipWaiting）
 *  - UP2：「稍後」記住同一個 worker，同一版本唔再彈
 *  - UP3：「立即更新」→ SKIP_WAITING → controllerchange → reload；3 秒 fallback
 *  - UP4：檢查時機 = visibilitychange／focus／online／每 30 分鐘 reg.update()
 *  - UP5：文案寫明本機資料保留
 */
import { useEffect, useRef, useState } from 'react'
import { RefreshCw, X } from 'lucide-react'

/** 記住已撳「稍後」嘅 worker（模組級：同一輪瀏覽器分頁內唔再彈） */
let dismissedWorker: ServiceWorker | null = null

export default function UpdateBanner() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null)
  const reloadingRef = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    const maybeShowWaiting = (r: ServiceWorkerRegistration) => {
      if (r.waiting && navigator.serviceWorker.controller && r.waiting !== dismissedWorker) {
        setWaiting(r.waiting)
      }
    }

    const trackInstalling = (sw: ServiceWorker | null) => {
      if (!sw) return
      sw.addEventListener('statechange', () => {
        if (sw.state === 'installed' && navigator.serviceWorker.controller) {
          if (sw !== dismissedWorker) setWaiting(sw)
        }
      })
    }

    /* 每次都重新攞 registration：首次到訪時 SW 仲未註冊完成，
       直接用捕獲到嘅 reg 會永遠係 undefined */
    const checkForUpdate = () => {
      navigator.serviceWorker
        .getRegistration()
        .then((r) => {
          if (!r) return
          maybeShowWaiting(r)
          r.update().catch(() => {})
        })
        .catch(() => {})
    }

    try {
      navigator.serviceWorker
        .getRegistration()
        .then((r) => {
          if (!r) return
          maybeShowWaiting(r)
          trackInstalling(r.installing)
          r.addEventListener('updatefound', () => trackInstalling(r.installing))
        })
        .catch(() => {})
    } catch {
      // 環境不支援 getRegistration — 靜默退出，唔影響 App
      return
    }

    const onControllerChange = () => {
      if (reloadingRef.current) return
      reloadingRef.current = true
      window.location.reload()
    }
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)

    const onVisibility = () => {
      if (document.visibilityState === 'visible') checkForUpdate()
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', checkForUpdate)
    window.addEventListener('online', checkForUpdate)
    const timer = window.setInterval(checkForUpdate, 30 * 60 * 1000)

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', checkForUpdate)
      window.removeEventListener('online', checkForUpdate)
      window.clearInterval(timer)
    }
  }, [])

  if (!waiting) return null

  const applyUpdate = () => {
    waiting.postMessage({ type: 'SKIP_WAITING' })
    // 3 秒 fallback：controllerchange 冇發生（例如冇 open clients）都要入新版（UP3）
    window.setTimeout(() => {
      if (reloadingRef.current) return
      reloadingRef.current = true
      window.location.reload()
    }, 3000)
  }

  const dismiss = () => {
    dismissedWorker = waiting
    setWaiting(null)
  }

  return (
    <div
      role="region"
      aria-label="版本更新"
      style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
      className="fixed left-1/2 z-[70] w-[min(92vw,26rem)] -translate-x-1/2 rounded-2xl border border-amber-400/30 bg-[#02133e]/95 p-3 shadow-2xl backdrop-blur-md"
    >
      <div className="flex items-start gap-2.5">
        <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-amber-200">有新版本可用</p>
          <p className="mt-0.5 text-[11px] leading-snug text-white/75">
            更新之後仍然離線可玩，本機資料與分數會保留。
          </p>
          <div className="mt-2 flex gap-2">
            <button
              onClick={applyUpdate}
              className="rounded-lg bg-amber-400 px-3 py-1.5 text-[11px] font-bold text-stone-900 transition hover:bg-amber-300 active:scale-[0.98]"
            >
              立即更新
            </button>
            <button
              onClick={dismiss}
              aria-label="稍後再更新"
              className="rounded-lg bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white/80 transition hover:bg-white/15"
            >
              稍後
            </button>
          </div>
        </div>
        <button
          onClick={dismiss}
          aria-label="稍後再更新"
          className="rounded-full p-1 text-white/50 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
