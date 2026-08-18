/**
 * 主題 hook（與 Provider 分檔，確保 Fast Refresh 正常運作）
 * Copyright (c) 2026 Scout System. All rights reserved.
 */
import { useContext } from 'react'
import { ThemeContext } from './themeContextValue'

export const useTheme = () => useContext(ThemeContext)
