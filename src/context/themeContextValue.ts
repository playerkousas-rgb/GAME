/**
 * 主題 context 物件與型別（非元件輸出，獨立成檔）
 * Copyright (c) 2026 Scout System. All rights reserved.
 */
import { createContext } from 'react'

export type Theme = 'dark' | 'light'

export interface ThemeContextValue {
  theme: Theme
  setTheme: (t: Theme) => void
  toggle: () => void
}

export const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  setTheme: () => {},
  toggle: () => {},
})
