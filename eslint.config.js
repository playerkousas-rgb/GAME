import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // 各遊戲「示範模式」的編排 effect 會在 effect 本體同步設定字幕 state，
      // 再以 setTimeout 推進流程（刻意的 demo choreography 模式，行為有測試覆蓋）。
      // react-hooks v7 的嚴格規則會誤報此模式；為遵守「零行為變更」原則，
      // 降級為 warning 而非重寫可運作程式碼。詳見 docs/瘦身與防增肥守則.md。
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
])
