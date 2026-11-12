# Changelog

本專案的所有重要變更都會記錄在此文件。
格式跟 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.1.0/)，版本號跟 `package.json`／`BRAND.version`（雙版號）。

## [1.1.0] — 2026-11-12

### 安全性（A 系列）
- **修正**：`photo` 遊戲的「加入遊戲」QR Code 由第三方 `api.qrserver.com` 改為本地 `qrcode` 套件產生（`src/components/QRCode.tsx`）。原做法會把含 `?s=<sessionId>` 的完整網址傳去外部伺服器，現已零外部請求。
- CI Actions（`checkout`、`setup-node`）全部 pin 到 commit SHA。

### 新增（PWA ／ G11 圖標 ／ SEO）
- **PWA**（跟 readme 規範 docs/46，2026-11-12 定案）：
  - `public/manifest.webmanifest`（`display: standalone`、`theme_color`/`background_color` `#02133E`、4 個 icons）
  - `public/sw.js` Service Worker：導覽請求 network-first（離線回退快取）、靜態資源 stale-while-revalidate、`activate` 清舊快取；`install` 只在首次安裝先 `skipWaiting()`
  - 右下角浮動「📲 加入主畫面」入口（`src/components/InstallButton.tsx`）：Android 攔 `beforeinstallprompt`、iOS 出三步教學卡（Esc／背景可關、`role="dialog"`）、standalone 時自動隱藏、可鍵盤操作
  - 全域「有新版本」更新橫額（`src/components/UpdateBanner.tsx`）：`role="region"`、「稍後」記住同一 worker、「立即更新」→ `SKIP_WAITING` → `controllerchange` → reload（3 秒 fallback）；檢查時機 = visibilitychange／focus／online／每 30 分鐘
- **G11 九個圖標**（`public/icons/`）：favicon.ico（16/32/48 三合一）、favicon-16/32、apple-touch-icon（180）、icon-192/512、maskable-192/512（66% 安全區）、og-image（1200×630）。全部 PNG/ICO、九個檔合共 ≤ 260 KB 預算，16×16 手繪三層色
- **SEO/GEO**：`index.html` 補齊 canonical、Open Graph（含 og:image 絕對網址）、Twitter card、JSON-LD（WebApplication）、`meta robots`、靜態 h1 骨架、`<noscript>`；新增 `public/robots.txt`、`public/sitemap.xml`
- **CI**：`.github/workflows/ci.yml` — push/PR 自動 `npm ci` → `npm run check` → `npm run build`
- **雙版號守衛**：`tests/units.test.ts` 新增測試，自動核對 `package.json`／`BRAND.version`／`index.html` meta `app-version`／`sw.js` CACHE_NAME 四處一致，並驗證 manifest icons 與 G11 圖標尺寸

### 修正
- **README 數字更正**：kims 內建物品庫 114 → **94**；wordPairs.ts 內註釋／結構表 74 → **152**；測試數 52 → 55
- `useTeams.score(delta)` 未傳 index 時原本永遠改第一隊（`?? 0`），改為預設改動當前 `active` 隊
- 主題 localStorage 鍵名統一為 `scout-system:theme`（舊鍵 `photo-game-theme` 首次讀取自動遷移）
- `index.html` 的 favicon 由 inline SVG data-URI 改為 G11 實體 PNG/ICO（iOS 主畫面／PWA 只認 PNG）
- `docs/瘦身與防增肥守則.md` 關於 favicon 的條目同步更新（與 G11 一致）
- `index.html` `<html>` 保留 `lang="zh-Hant"`；主題色維持 `#02133E`

### 文件
- 新增 `CHANGELOG.md`（本檔）
- 新增 `docs/審查報告-2026-11-12.md`（對照 playerkousas-rgb/readme 規範的完整審查報告）
- README 新增 PWA／CI／圖標說明、部署章節補充 SW 優先於 SPA rewrite；專案結構補上新檔案

## [1.0.0] — 2026-09-20

- 合併 Guinness-Games 與 photo-game 兩個專案；新增猜猜畫畫／大電視／EMOJI 猜謎／誰是臥底（共 6 個遊戲、內建 540+ 條題目）
- 2026-09-20 大瘦身：移除 framer-motion（~10 MB）等 0 引用依賴、清理死代碼、新增 `.vercelignore` 與 `npm run check`
- Vitest 52 項單元 + E2E 冒煙測試；`npm run check` = tsc + ESLint + Vitest（PR 必跑必綠）
