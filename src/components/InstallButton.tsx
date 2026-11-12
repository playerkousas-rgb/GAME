/**
 * 「加入主畫面」安裝入口
 * Copyright (c) 2026 Scout System. All rights reserved.
 *
 * 規則（docs/46-pwa-install-and-update）：
 *  - I1：有入口；standalone 開啟時自動隱藏
 *  - I2：Android／Chrome 攔 beforeinstallprompt，掣先 prompt()，唔自動彈
 *  - I3：iOS／iPadOS 出三步教學卡（Safari 分享 → 加入主畫面 → 加入）
 *  - I4：standalone／iOS 偵測見 shared/pwa.ts
 *  - I6：文案一句講清；按鈕有 aria-label、可 keyboard focus
 *  - I8：唔做自動彈窗、alert()、第三方 install widget
 */
import { useEffect, useRef, useState } from 'react'
import { Smartphone, X } from 'lucide-react'
import { isIos, isStandalone } from '../shared/pwa'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [hidden, setHidden] = useState(() => isStandalone())
  const [showIos, setShowIos] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [toast, setToast] = useState('')
  const iosCloseRef = useRef<HTMLButtonElement>(null)
  const helpCloseRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setDeferred(null)
      setHidden(true)
      setToast('已加入主畫面 🎉')
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  /* Toast 自動消失 */
  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(''), 3000)
    return () => window.clearTimeout(t)
  }, [toast])

  /* 教學卡：Esc 關 + 開卡時 focus 去關閉掣 */
  useEffect(() => {
    const open = showIos || showHelp
    if (!open) return
    const target = showIos ? iosCloseRef.current : helpCloseRef.current
    target?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowIos(false)
        setShowHelp(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showIos, showHelp])

  if (hidden) return null

  const onInstallClick = () => {
    if (deferred) {
      deferred.prompt()
      deferred.userChoice.finally(() => setDeferred(null))
      return
    }
    if (isIos()) {
      setShowIos(true)
      return
    }
    setShowHelp(true)
  }

  return (
    <>
      {/* 浮動入口：獨立掣 + 細 × 一鍵收起（session 內） */}
      <div
        style={{ bottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
        className="fixed right-3 z-[60] flex items-center overflow-hidden rounded-full border border-amber-400/30 bg-[#02133e]/90 shadow-lg backdrop-blur-md"
      >
        <button
          onClick={onInstallClick}
          aria-label="加入主畫面（全螢幕、離線都開得返）"
          className="flex items-center gap-1.5 py-2 pl-3 pr-2 text-[11px] font-medium text-amber-200 transition hover:text-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          <Smartphone className="h-3.5 w-3.5" />
          加入主畫面
        </button>
        <button
          onClick={() => setHidden(true)}
          aria-label="隱藏加入主畫面入口"
          className="py-2 pl-1 pr-2 text-white/40 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* iOS／iPadOS 三步教學卡（I3） */}
      {showIos && (
        <div
          className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setShowIos(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="installHelpTitle"
            className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#02133e] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="installHelpTitle" className="text-base font-black text-amber-200">
              📲 加入主畫面
            </h3>
            <ol className="mt-3 space-y-2 text-[13px] leading-relaxed text-white/85">
              <li><span className="font-bold text-amber-300">1.</span> 撳 Safari 下面嘅「分享」掣 <span aria-hidden="true">⬆</span></li>
              <li><span className="font-bold text-amber-300">2.</span> 向下掃，揀「<span className="font-bold">加入主畫面</span>」</li>
              <li><span className="font-bold text-amber-300">3.</span> 撳右上角「<span className="font-bold">加入</span>」</li>
            </ol>
            <p className="mt-3 text-[11px] text-white/55">
              加入之後全螢幕開啟，離線都用得返，本機資料唔會少。
            </p>
            <button
              ref={iosCloseRef}
              onClick={() => setShowIos(false)}
              className="mt-4 w-full rounded-xl bg-amber-400 py-2.5 text-sm font-bold text-stone-900 transition hover:bg-amber-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
            >
              知道了
            </button>
          </div>
        </div>
      )}

      {/* 其他瀏覽器通用指引 */}
      {showHelp && (
        <div
          className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setShowHelp(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="installGenericTitle"
            className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#02133e] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="installGenericTitle" className="text-base font-black text-amber-200">
              📲 加入主畫面
            </h3>
            <p className="mt-3 text-[13px] leading-relaxed text-white/85">
              打開瀏覽器選單（⋮ 或分享按鈕），揀「<span className="font-bold">安裝應用程式</span>」／「<span className="font-bold">加入主畫面</span>」／「<span className="font-bold">Add to Home screen</span>」即可。
            </p>
            <p className="mt-2 text-[11px] text-white/55">
              加入之後全螢幕開啟，離線都用得返，本機資料唔會少。
            </p>
            <button
              ref={helpCloseRef}
              onClick={() => setShowHelp(false)}
              className="mt-4 w-full rounded-xl bg-amber-400 py-2.5 text-sm font-bold text-stone-900 transition hover:bg-amber-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
            >
              知道了
            </button>
          </div>
        </div>
      )}

      {/* appinstalled 成功提示 */}
      {toast && (
        <div
          role="status"
          className="fixed left-1/2 top-4 z-[80] -translate-x-1/2 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-4 py-2 text-xs font-bold text-emerald-200 shadow-lg backdrop-blur-md"
        >
          {toast}
        </div>
      )}
    </>
  )
}
