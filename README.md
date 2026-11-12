# Scout System — 童軍集會遊戲平台

一站式童軍集會遊戲平台，由兩個獨立專案合併而成：

| 原始倉庫 | 現時路徑 | 說明 |
|----------|----------|------|
| [Guinness-Games](https://github.com/playerkousas-rgb/Guinness-Games) | `/kims` · `src/apps/kims/` | 童軍金氏遊戲（視覺／聽覺／文字／配對） |
| [photo-game](https://github.com/playerkousas-rgb/photo-game) | `/photo` · `src/apps/photo/` | 像素化猜謎圖工具 |
| — 新增 — | `/draw` · `src/apps/draw/` | 猜猜畫畫 |
| — 新增 — | `/act` · `src/apps/act/` | 大電視 |
| — 新增 — | `/emoji` · `src/apps/emoji/` | EMOJI 猜謎 |
| — 新增 — | `/undercover` · `src/apps/undercover/` | 誰是臥底（QR Code 派牌） |

---

## 遊戲內容

**6 個遊戲 · 內建 540+ 條題目 · 全部支援領袖自訂題庫 · 全站手機友善**

### 🎨 猜猜畫畫 `/draw` — 196 題
- 一名隊員看題作畫，其他人限時搶答

#### 🔒 秘密派題模式（手機出題）
解決「畫家要行埋去主持機睇題、容易俾人偷望」嘅問題：

1. 領袖設定人數與局數 → 產生每人一個專屬 QR，**一輪只掃一次**
2. 玩家手機常駐一版，平時**只顯示自己嘅玩家號**（例：3 號）
3. 領袖畫面大字顯示「**3 號玩家**請出嚟作畫」，叫佢出嚟企定
4. **只有該畫家部手機會顯示題目**，其他人手機寫住「今局唔係你出場」
5. 題目卡要**長按先睇到**，放手即遮蓋
6. 領袖可設定自動蓋牌時間（60/90/120/180 秒或手動），亦可隨時按「立即蓋牌」
7. 一局完按「下一局」，玩家亦撳「下一局」對齊 —— 毋須輸入任何嘢

**出場公平性**：座位會洗牌成「輪換表」逐個出場，出完一圈再洗一次。
已驗證（300 條密鑰 × 20 局，4–8 人）：
- 每人出場次數差距**最多 1 次**（即理論最佳值）
- 連續兩局抽中同一人：**0 次**
- 一輪內**唔會重複出題**
- 主持機與玩家手機推導結果 **零誤差**
- 內建繪圖板：10 色、4 種粗幼、橡皮、復原、清除，支援滑鼠／觸控／手寫筆
- 題目可一鍵隱藏，防止其他隊員偷看
- 分類：童軍裝備、動物、食物、日常物品、交通工具、大自然、運動、香港地標、職業、抽象概念、節日

### 📺 大電視 `/act` — 148 題
- 超大字投影出題（字體依字數自動縮放），演員背向螢幕用身體動作演繹
- 自動計時、計分、跳過、結算；可即時加減時間
- 「遮蔽」功能方便換人時暫時蓋住題目
- 分類：日常動作、動物、運動、職業、童軍活動、情緒狀態、流行文化、樂器、情境

### 🧩 EMOJI 猜謎 `/emoji` — 196 題
- 用 Emoji 組合表達詞語、電影、成語、香港地標
- **輸入模式**：打字作答，系統自動判分（忽略空白與標點）
- **主持模式**：全屏投影搶答，主持按鍵公布答案並計分
- 分類：動物、食物、電影卡通、成語、童軍、香港、職業、節日、運動、大自然、生活、歌曲、學科

### 🕵️ 誰是臥底 `/undercover` — 152 組內建詞語對 ＋ 領袖自訂
- **設定一次，玩足全晚**：領袖輸入玩家人數（4–20 人），系統即時產生**對應數量的專屬 QR Code**（5 人 5 個、4 人 4 個）
- 可自由設定**臥底人數**與**白卡數量**（白卡可有可無），依人數給建議值並自動限制上限（至少保留 2 位平民）
- **領袖自訂詞語**：可逐對新增「平民詞 / 臥底詞」，或每行 `平民詞 | 臥底詞` 批次匯入；
  可選「只用自訂詞語」，亦可與內建題庫混合隨機。自訂詞語會一併寫入 QR，玩家掃咗即用
- **可指定下一局詞語**：主持台可揀定本局用邊一對詞（但邊個做臥底依然真隨機）

**出題原則**：兩個詞必須同類同層級，只差一個細節 —— 例如 `可樂 / 芬達`、`雪櫃 / 冷氣機`、
`平結 / 雙套結`。避免 `水 / 麵包` 這種完全不同類的組合，否則一講就穿崩。
內建 152 組全部依此原則編寫，涵蓋飲品、食物、水果、童軍、香港、電器、日常、動物、運動、人物、場所、天氣、大自然、娛樂。
- 每人掃一次自己的 QR，長按卡片才顯示身分、放手即遮蓋，防止旁人偷看

#### 🎲 一次抽籤，玩足一輪（毋須逐局輸入）
1. 領袖設定**本輪局數**（10／15／20／30 局），產生 QR 時用 `crypto.getRandomValues`
   抽出一條**牌局密鑰**，決定成輪所有分派
2. 玩家掃一次 QR，之後**每局只需撳「下一局」**對齊領袖畫面 —— 毋須輸入任何嘢
3. 所有裝置以 `hash(密鑰 ‖ 局數)` 推導，故毋須伺服器亦保證各機一致
4. 局數存入 `localStorage`，中途熄屏或閂瀏覽器都唔會失去進度
5. 一輪玩完（或中途加減人）就「開新牌局」，換一條全新密鑰並重新派 QR

主持台另設**整輪題目預覽**，方便領袖備課，亦可一鍵跳到任何一局。

> **關於「會唔會俾人記住派發順序」**：密鑰每輪都換，而一輪 20 局通常玩足一個鐘。
> 就算有人記得「上一輪第 7 局我做臥底」，換咗密鑰之後完全冇參考價值。
>
> 已驗證（2000 條密鑰 × 20 局）：5／6／8 人局臥底分布卡方值 2.84／3.15／3.05，
> 連續兩局同一臥底率 20.3%／16.9%／12.5%，與理論值 1/n 完全吻合。

> **技術特性**：免伺服器、免註冊、無網絡延遲，離線亦可運作。
> 自訂詞語以 base64url 壓縮寫入 QR，超出容量時會提示領袖精簡。

### 👁️ 童軍金氏遊戲 `/kims`
- **金氏遊戲** — 物品展示後遮蓋，考驗視覺記憶
- **聽覺金氏遊戲** — 聆聽聲音序列並複述
- **圖案記憶** — 四種卡片類型：**大 Emoji 圖案卡**（8 個主題包，128 個圖案）、**幾何圖形卡**（16 形狀 × 9 顏色，考形狀＋顏色）、**自訂相片卡**、傳統文字卡；可選「一次過全部」或「逐張大圖」展示，作答支援**圖案點選**（帶干擾項）或打字
- **配對記憶** — 翻牌找出相同配對
- 內建童軍物品庫 **94 件**（可增刪、可上傳自訂圖片）
- 金氏遊戲改用**大圖卡網格**展示（彩色卡背、手機自動調整欄數），作答亦改為**圖片選擇**，不再是細字清單
- 圖案記憶另有 **14 組字詞包**可載入文字卡模式
- 三種難度（幼童軍 / 童軍 / 深資童軍）
- 個人 / 小隊 / 比賽（Kahoot 風格）三種模式 + 榮譽積分榜

### 🖼️ 像素化猜謎圖 `/photo`
- 四種出題方式：**像素化**、**局部放大**、**變形扭曲**、**切割打亂**
- 8 級難度階梯，隨時間自動降低難度
- 搶答台、計分板、排行榜（可匯出圖片）
- QR Code 讓成員用手機加入
- 全屏投影模式、深色／淺色主題
- **內建題目包**：無相片時可一鍵生成題目圖（Emoji 大圖 / 文字卡 / 色塊圖形）

### 📋 集會小遊戲建議
另備 [`docs/集會小遊戲建議.md`](docs/集會小遊戲建議.md)，收錄 22 個適合旅團集會的遊戲，
涵蓋破冰、團隊合作、童軍技能、觀察記憶、熱身氣氛五大類，
每項均列明人數、時間、器材、玩法、變化玩法及安全提示，並附集會編排建議。

---

## 開發

```bash
npm install      # 安裝依賴
npm run dev      # 開發伺服器 (http://localhost:5173)
npm run check    # 一鍵驗證：tsc 型別檢查 + ESLint + Vitest（PR 必跑必綠）
npm run build    # 生產打包 → dist/
npm run preview  # 預覽打包結果
npm run lint     # ESLint 檢查
npm test         # Vitest（55 項單元 + E2E 冒煙測試）
```

**技術棧**：React 19 · TypeScript 5.9 · Vite 7 · Tailwind CSS 4 · React Router 7 · Lucide Icons · qrcode（動畫與音效皆為自製，零多餘依賴）

### PWA（可安裝＋離線可用）
- **一鍵安裝**：右下角「📲 加入主畫面」浮動入口（standalone 開啟時自動隱藏）；Android 攔 `beforeinstallprompt`、iOS 出三步教學卡（Safari 分享 → 加入主畫面 → 加入）
- **離線可用**：`public/sw.js`（network-first 導覽 + stale-while-revalidate 靜態資源），首次到訪後斷網照開
- **靜默更新，由用戶決定**：新版本停喺 waiting，出「有新版本」橫額；㩒「立即更新」先 reload（3 秒 fallback）；「稍後」記住同一版本唔再彈
- **九個圖標**（G11 標準）：`public/icons/` — favicon.ico（16/32/48）＋ 16/32/180/192/512 PNG ＋ maskable ×2 ＋ og-image.png，全部 PNG/ICO、合共 ≤ 260 KB

### CI
`.github/workflows/ci.yml` — 每次 push / PR 自動跑 `npm ci` → `npm run check` → `npm run build`（Actions 全部 pin 到 commit SHA）。

### 手機友善設計
- 全站以 `100dvh` 計算高度，避免 iOS Safari 工具列遮擋內容
- 表單元件字體固定 16px，杜絕 iOS 聚焦時整頁自動放大
- 觸控目標最小 40px、移除點擊藍色高亮、加入 `viewport-fit=cover` 與安全區內距
- 設定頁按鈕網格在窄螢幕自動由 5 欄降為 3 欄，卡片網格依數量自動調整欄數
- 全站文字對比度已提升（原本過暗的深藍字與低透明度白字統一調亮）

---

## 專案結構

```
src/
├── main.tsx                  # 入口（BrowserRouter + ThemeProvider）
├── App.tsx                   # 路由總表
├── index.css                 # 合併後的全域樣式（含淺色主題覆寫）
├── shared/
│   ├── brand.ts              # 品牌與版權設定（單一事實來源）
│   ├── pwa.ts                # PWA：註冊 SW、standalone／iOS 偵測
│   ├── questionBank.ts       # 題庫型別、隨機抽題、自訂題目儲存、批次匯入
│   ├── useQuestionBank.ts    # 題庫 hook（合併內建＋自訂、localStorage 持久化）
│   ├── useRoundEngine.ts     # 回合引擎（題目佇列、倒數、計分）
│   ├── useTeams.ts           # 隊伍計分
│   └── gameSound.ts          # Web Audio 合成音效
├── context/
│   └── ThemeContext.tsx      # 深色／淺色主題（全站共用）
├── data/                     # 題庫資料
│   ├── drawBank.ts           # 猜猜畫畫 196 題
│   ├── actBank.ts            # 大電視 148 題
│   ├── emojiBank.ts          # EMOJI 猜謎 196 題
│   └── textPacks.ts          # 文字記憶 14 組字詞包
├── components/
│   ├── Home.tsx              # 主頁遊戲中心
│   ├── Footer.tsx            # 統一版權頁腳
│   ├── BackToHub.tsx         # 子遊戲返回主頁按鈕
│   ├── InstallButton.tsx     # 📲 加入主畫面入口（PWA）
│   ├── UpdateBanner.tsx      # 有新版本橫額（PWA）
│   ├── QRCode.tsx            # 本地產生 QR Code（不依賴外部 API）
│   ├── QuestionManager.tsx   # 自訂題目管理（新增／刪除／批次匯入）
│   ├── BankFilters.tsx       # 難度與分類篩選
│   ├── SetupShell.tsx        # 遊戲設定頁共用外殼
│   └── RoundUI.tsx           # 倒數環、開場倒數、結算、隊伍計分列
└── apps/
    ├── kims/                 # 童軍金氏遊戲
    │   ├── KimsApp.tsx
    │   ├── components/  data/  hooks/  types.ts
    ├── photo/                # 像素化猜謎圖
    │   ├── PhotoApp.tsx
    │   └── components/  lib/
    ├── draw/                 # 猜猜畫畫
    │   ├── DrawApp.tsx  DrawCanvas.tsx
    ├── act/                  # 大電視
    │   └── ActApp.tsx
    ├── emoji/                # EMOJI 猜謎
    │   └── EmojiApp.tsx
    └── undercover/           # 誰是臥底
        ├── UndercoverApp.tsx      # 主持台（設定 → QR → 逐局推進）
        ├── PlayerCard.tsx         # 玩家手機卡（掃 QR → 撳下一局 → 長按看身分）
        ├── components/
        │   └── PairManager.tsx    # 領袖自訂詞語對（逐對新增／批次匯入）
        ├── lib/deal.ts            # 牌局密鑰、角色分派、QR 連結編碼
        └── data/wordPairs.ts      # 152 組內建詞語對
```

### 自訂題庫（領袖功能）
三個新遊戲的設定頁都有「自訂題目」面板：

- **逐條新增** — 填答案／分類／難度／提示，即時加入題庫
- **批次匯入** — 每行一題，用 `|` 分隔：
  ```
  帳篷 | 童軍裝備 | 易
  打繩結 | 童軍活動 | 中 | 用手示範
  🦁👑 | 獅子王 | 電影 | 中        ← EMOJI 題庫格式
  ```
  難度可寫 `易／中／難` 或 `easy/medium/hard`，可省略
- 自訂題目存於瀏覽器 `localStorage`，重開仍在；與內建題庫合併後一起隨機抽題
- 其他旅團要用直接開這個 App 連結即可，毋須匯出／匯入

### 修改版權標示
所有版權字串來自 `src/shared/brand.ts`，只需修改該檔案即可全站生效：

```ts
export const COPYRIGHT = `© ${COPYRIGHT_YEAR} Scout System`
export const COPYRIGHT_UPPER = `COPYRIGHT ${COPYRIGHT_YEAR} SCOUT SYSTEM`
```

---

## 部署

打包後的 `dist/` 為純靜態檔案，可部署至 Vercel、Netlify、GitHub Pages 等。

公開目錄（`public/`）重點檔案：

```
public/
├── icons/                    # G11 九個圖標 + og-image.png（≤ 260 KB）
├── manifest.webmanifest      # PWA manifest（standalone、theme_color #02133E）
├── sw.js                     # Service Worker（network-first 導覽 + SWR 靜態）
├── robots.txt  sitemap.xml   # SEO
└── _redirects                # Netlify SPA fallback
```

由於使用 **BrowserRouter**，需設定 SPA fallback（所有路徑改寫至 `/index.html`）：

- **Vercel** — `vercel.json` 已設定 `framework: vite`、`buildCommand: npm run build`、`installCommand: npm ci`、`outputDirectory: dist`（只部署最終靜態產物）與 SPA `rewrites`。`public/` 內實體檔（icons、sw.js、manifest…）優先於 rewrite 提供服務，SW 因此可正常註冊。
- **Netlify** — `public/_redirects`：`/*  /index.html  200`

> **PWA 注意**：`public/sw.js` 嘅 `CACHE_NAME` 綁定版本號（現為 `scout-system-v1.1.0`）；每次發版改版號時四處同步——`package.json`／`BRAND.version`／`index.html` 的 `<meta name="app-version">`／`sw.js`（`tests/units.test.ts` 有測試守住，唔使靠人手記）。

### 🥗 儲存空間瘦身與防增肥

專案已於 2026-09-20 完成大瘦身（移除 0 引用依賴 `framer-motion` ~10 MB、4 個死重檔案、未引用素材；新增 `.vercelignore` 與 `npm run check`）。
**改版前必讀**：[docs/瘦身與防增肥守則.md](docs/瘦身與防增肥守則.md) —— 依賴、靜態資源、死代碼、Vercel 配置四大守則，防止專案再增肥、Vercel 配額爆滿。

> 變更紀錄見 [CHANGELOG.md](CHANGELOG.md)；2026-11-12 對照 [playerkousas-rgb/readme](https://github.com/playerkousas-rgb/readme) 規範嘅完整審查報告見 [docs/審查報告-2026-11-12.md](docs/審查報告-2026-11-12.md)。

---

© 2026 Scout System. All rights reserved. 詳見 [LICENSE](LICENSE)。
