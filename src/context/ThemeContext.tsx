/**
 * 主題 Provider（深色／淺色）
 * Copyright (c) 2026 Scout System. All rights reserved.
 *
 * 儲存鍵已統一為 `scout-system:theme`；
 * 舊鍵 `photo-game-theme`（photo-game 時代遺留）會在首次讀取時自動遷移。
 */
import { useState, useEffect, type ReactNode } from 'react'
import { ThemeContext, type Theme } from './themeContextValue'

const THEME_KEY = 'scout-system:theme'
const LEGACY_THEME_KEY = 'photo-game-theme'

function readTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  const saved = localStorage.getItem(THEME_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  // 舊鍵遷移：有舊值就沿用，並寫入新鍵
  const legacy = localStorage.getItem(LEGACY_THEME_KEY)
  if (legacy === 'light' || legacy === 'dark') {
    try {
      localStorage.setItem(THEME_KEY, legacy)
    } catch {
      /* quota — 忽略，下次再遷移 */
    }
    return legacy
  }
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      /* quota — 主題唔 critical，忽略 */
    }
  }, [theme])

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggle: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}
