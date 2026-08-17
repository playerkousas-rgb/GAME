# Scout System — 童軍集會遊戲平台

一站式童軍集會遊戲平台，由兩個獨立專案合併而成：

| 原始倉庫 | 現時路徑 | 說明 |
|----------|----------|------|
| [Guinness-Games](https://github.com/playerkousas-rgb/Guinness-Games) | `/kims` · `src/apps/kims/` | 童軍金氏遊戲（視覺／聽覺／文字／配對） |
| [photo-game](https://github.com/playerkousas-rgb/photo-game) | `/photo` · `src/apps/photo/` | 像素化猜謎圖工具 |

---

## 遊戲內容

### 👁️ 童軍金氏遊戲 `/kims`
- **金氏遊戲** — 物品展示後遮蓋，考驗視覺記憶
- **聽覺金氏遊戲** — 聆聽聲音序列並複述
- **文字記憶** — 自訂中文字卡，全屏投影記憶
- **配對記憶** — 翻牌找出相同配對
- 內建童軍物品庫（可增刪、可上傳自訂圖片）
- 三種難度（幼童軍 / 童軍 / 深資童軍）
- 個人 / 小隊 / 比賽（Kahoot 風格）三種模式 + 榮譽積分榜

### 🖼️ 像素化猜謎圖 `/photo`
- 四種出題方式：**像素化**、**局部放大**、**變形扭曲**、**切割打亂**
- 8 級難度階梯，隨時間自動降低難度
- 搶答台、計分板、排行榜（可匯出圖片）
- QR Code 讓成員用手機加入
- 全屏投影模式、深色／淺色主題

### 📋 集會小遊戲建議
另備 [`docs/集會小遊戲建議.md`](docs/集會小遊戲建議.md)，收錄 22 個適合旅團集會的遊戲，
涵蓋破冰、團隊合作、童軍技能、觀察記憶、熱身氣氛五大類，
每項均列明人數、時間、器材、玩法、變化玩法及安全提示，並附集會編排建議。

---

## 開發

```bash
npm install      # 安裝依賴
npm run dev      # 開發伺服器 (http://localhost:5173)
npm run build    # 生產打包 → dist/
npm run preview  # 預覽打包結果
npm run lint     # ESLint 檢查
```

**技術棧**：React 19 · TypeScript 5.9 · Vite 7 · Tailwind CSS 4 · React Router 7 · Framer Motion · Lucide Icons

---

## 專案結構

```
src/
├── main.tsx                  # 入口（BrowserRouter + ThemeProvider）
├── App.tsx                   # 路由總表
├── index.css                 # 合併後的全域樣式（含淺色主題覆寫）
├── shared/
│   └── brand.ts              # 品牌與版權設定（單一事實來源）
├── context/
│   └── ThemeContext.tsx      # 深色／淺色主題（全站共用）
├── components/
│   ├── Home.tsx              # 主頁遊戲中心
│   ├── Footer.tsx            # 統一版權頁腳
│   └── BackToHub.tsx         # 子遊戲返回主頁按鈕
└── apps/
    ├── kims/                 # 童軍金氏遊戲
    │   ├── KimsApp.tsx
    │   ├── components/  data/  hooks/  types.ts
    └── photo/                # 像素化猜謎圖
        ├── PhotoApp.tsx
        └── components/  lib/
```

### 修改版權標示
所有版權字串來自 `src/shared/brand.ts`，只需修改該檔案即可全站生效：

```ts
export const COPYRIGHT = `© ${COPYRIGHT_YEAR} Scout System`
export const COPYRIGHT_UPPER = `COPYRIGHT ${COPYRIGHT_YEAR} SCOUT SYSTEM`
```

---

## 部署

打包後的 `dist/` 為純靜態檔案，可部署至 Vercel、Netlify、GitHub Pages 等。

由於使用 **BrowserRouter**，需設定 SPA fallback（所有路徑改寫至 `/index.html`）：

- **Vercel** — 新增 `vercel.json`：`{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`
- **Netlify** — 新增 `public/_redirects`：`/*  /index.html  200`

---

© 2026 Scout System. All rights reserved. 詳見 [LICENSE](LICENSE)。
