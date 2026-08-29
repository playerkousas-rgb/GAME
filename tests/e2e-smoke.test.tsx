/**
 * 全流程功能測試（無頭 DOM）— 走齊六個遊戲的真實 React 組件流程
 * 覆蓋：主頁 → 各遊戲設定 → 開始 → 遊戲中 → 結算；自訂題目；玩家手機卡；主題切換
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react'
import { Suspense } from 'react'
import { MemoryRouter } from 'react-router-dom'
import App from '../src/App'
import { ThemeProvider } from '../src/context/ThemeContext'
import {
  buildSeatUrl as buildDrawSeatUrl,
  previewRounds,
  type DrawSeatSetup,
} from '../src/apps/draw/lib/seat'
import { buildSeatUrl as buildUcSeatUrl, type GameSetup } from '../src/apps/undercover/lib/deal'
import { DRAW_BANK } from '../src/data/drawBank'

/*
 * 預先載入所有 lazy 路由模組。
 * 已知 vitest 環境下，組件內首個 dynamic import() 會有掛起競爭；
 * 由測試檔先暖熱模組圖後，React lazy 的 import() 即命中快取、即時解析。
 */
await Promise.all([
  import('../src/apps/kims/KimsApp'),
  import('../src/apps/photo/PhotoApp'),
  import('../src/apps/draw/DrawApp'),
  import('../src/apps/act/ActApp'),
  import('../src/apps/emoji/EmojiApp'),
  import('../src/apps/undercover/UndercoverApp'),
  import('../src/apps/undercover/PlayerCard'),
  import('../src/apps/draw/DrawCard'),
])

/* ================= helpers ================= */

const FAKE_TIMERS = ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'setImmediate', 'clearImmediate'] as const

async function renderAt(path: string) {
  const utils = render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[path]}>
        <Suspense fallback={<div>載入中…</div>}>
          <App />
        </Suspense>
      </MemoryRouter>
    </ThemeProvider>,
  )
  // 等 lazy 路由完成（dynamic import 要數個 microtask 週期）
  for (let i = 0; i < 50 && document.body.textContent?.includes('載入中…'); i++) {
    await act(async () => {})
  }
  await act(async () => {})
  return utils
}

/** 小段推進 fake 時間：每段前後都有 act 沖刷，令 React effect 能正常排程下一段 timeout */
const tick = (ms: number, chunk = 500) => {
  let left = ms
  while (left > 0) {
    const d = Math.min(chunk, left)
    act(() => vi.advanceTimersByTime(d))
    left -= d
  }
}

/** 開場倒數 3-2-1-GO（3×800ms + 450ms）→ playing；chunk=800 與引擎步長一致，避免 act 邊界漂移 */
const toPlaying = () => tick(3200, 800)

const clickBy = (predicate: (el: Element) => boolean) => {
  const el = Array.from(document.querySelectorAll('button, a')).find(predicate)
  if (!el) throw new Error(`找不到按鈕；現有：${Array.from(document.querySelectorAll('button, a')).map((b) => (b.textContent ?? '').trim()).filter(Boolean).join(' | ').slice(0, 300)}`)
  fireEvent.click(el)
}

const clickText = (text: string, exact = false) =>
  clickBy((el) => (exact ? el.textContent?.trim() === text : (el.textContent ?? '').includes(text)))

beforeEach(() => {
  localStorage.clear()
  window.location.hash = ''
  vi.useFakeTimers({ toFake: [...FAKE_TIMERS] })
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  window.location.hash = ''
})

/* ================= 主頁 & 主題 ================= */

describe('主頁', () => {
  it('顯示六個遊戲入口', async () => {
    await renderAt('/')
    for (const t of ['猜猜畫畫', '大電視', 'EMOJI 猜謎', '童軍金氏遊戲', '像素化猜謎圖', '誰是臥底']) {
      expect(screen.getAllByText(t, { exact: false }).length).toBeGreaterThan(0)
    }
  })

  it('點擊遊戲卡可進入（route 切換正常）', async () => {
    await renderAt('/')
    clickText('猜猜畫畫')
    for (let i = 0; i < 50 && !document.body.innerHTML.includes('總題數'); i++) {
      await act(async () => {})
    }
    expect(screen.getByText('題目篩選')).toBeTruthy()
    expect(screen.getByText('總題數')).toBeTruthy()
  })

  it('深淺主題切換並持久化', async () => {
    await renderAt('/')
    const btn = screen.getByRole('button', { name: '切換深淺色主題' })
    const before = document.documentElement.dataset.theme as 'light' | 'dark'
    fireEvent.click(btn)
    const after = document.documentElement.dataset.theme as 'light' | 'dark'
    expect(after).toBe(before === 'dark' ? 'light' : 'dark')
    expect(localStorage.getItem('photo-game-theme')).toBe(after)
    fireEvent.click(btn)
    expect(document.documentElement.dataset.theme).toBe(before)
  })
})

/* ================= 猜猜畫畫（經典模式） ================= */

describe('猜猜畫畫 — 經典模式', () => {
  it('完整一輪：設定 → 倒數 → 作答 → 暫停 → 結算 → 再玩', async () => {
    await renderAt('/draw')
    for (const s of ['總題數', '自訂', '分類']) {
      expect(screen.getByText(s)).toBeTruthy()
    }
    clickText('開始（抽')
    expect(screen.getByText('準備開始…')).toBeTruthy()
    toPlaying()
    expect(screen.getByText('畫家題目')).toBeTruthy()
    expect(screen.getByText('1 / 10')).toBeTruthy()
    clickText('答對了')
    expect(screen.getByText('2 / 10')).toBeTruthy()
    clickText('答對了')

    // 隱藏／顯示題目
    fireEvent.click(screen.getByTitle('顯示/隱藏 (H)'))
    expect(screen.getByText('● ● ●')).toBeTruthy()
    fireEvent.click(screen.getByTitle('顯示/隱藏 (H)'))

    // 暫停／繼續
    fireEvent.click(screen.getByTitle('暫停 (P)'))
    expect(screen.getByText(/已暫停/)).toBeTruthy()
    clickText('繼續遊戲')
    expect(screen.queryByText(/已暫停/)).toBeNull()

    // 加減時間（不崩潰）
    fireEvent.click(screen.getByTitle('加 10 秒'))
    fireEvent.click(screen.getByTitle('減 10 秒'))

    // 完晒其餘 8 題 → 結算
    for (let i = 0; i < 8; i++) clickText('答對了')
    expect(screen.getByText('遊戲結束')).toBeTruthy()
    clickText('再玩一次')
    expect(screen.getByText('準備開始…')).toBeTruthy()
    toPlaying()
    expect(screen.getByText('畫家題目')).toBeTruthy()
  })

  it('自訂題目：加入 → 批次匯入 → 刪除（localStorage 持久化）', async () => {
    await renderAt('/draw')
    const input = screen.getByPlaceholderText('題目／答案（例：帳篷）')
    fireEvent.change(input, { target: { value: '測試答案甲' } })
    clickText('加入題目', true)
    expect(screen.getByText(/已加入「測試答案甲」/)).toBeTruthy()
    let custom = JSON.parse(localStorage.getItem('scout-system:custom:draw') ?? '[]')
    expect(custom.map((q: { answer: string }) => q.answer)).toContain('測試答案甲')

    clickText('批次匯入', true)
    const area = document.querySelector('textarea')!
    fireEvent.change(area, { target: { value: '匯入甲\n匯入乙\n匯入丙' } })
    clickText('匯入', true)
    expect(screen.getByText(/成功匯入 3 題/)).toBeTruthy()
    custom = JSON.parse(localStorage.getItem('scout-system:custom:draw') ?? '[]')
    expect(custom.length).toBe(4)

    fireEvent.click(screen.getAllByLabelText(/^刪除 /)[0]!)
    custom = JSON.parse(localStorage.getItem('scout-system:custom:draw') ?? '[]')
    expect(custom.length).toBe(3)

    // 總題數 stat 反映自訂數量（196 內建 + 3 自訂）
    expect(screen.getByText('199')).toBeTruthy()
  })

  it('秘密派題模式：設定 → 派 QR → 主持台 → 計時 → 換局', async () => {
    await renderAt('/draw')
    clickText('秘密派題模式')
    await act(async () => {})
    expect(screen.getByText('玩家人數')).toBeTruthy()
    const qrBtn = Array.from(document.querySelectorAll('button')).find((el) =>
      /產生 \d+ 個 QR Code/.test(el.textContent ?? ''),
    )!
    fireEvent.click(qrBtn)
    await act(async () => {})
    expect(screen.getAllByText(/號玩家/).length).toBeGreaterThanOrEqual(1)
    clickText('全部掃完，進入主持台')
    await act(async () => {})
    expect(screen.getByText('請呢位玩家出嚟作畫')).toBeTruthy()
    clickText('開始計時')
    await act(async () => {})
    expect(screen.getByText(/作畫中/)).toBeTruthy()
    clickText('答對了')
    await act(async () => {})
    expect(screen.getByText(/本輪第/)).toBeTruthy()
  })
})

/* ================= 猜猜畫畫 玩家手機卡 ================= */

describe('猜猜畫畫 — 玩家手機卡', () => {
  const setup: DrawSeatSetup = {
    secret: 'draw-card-test-01',
    players: 3,
    rounds: 9,
    levels: [],
    categories: [],
    customAnswers: [],
  }

  it('非出場局顯示「唔係你出場」；出場局長按先見到題目', async () => {
    window.location.hash = buildDrawSeatUrl(setup, 1).split('#')[1]!
    await renderAt('/draw/card')
    expect(screen.getByText('你的玩家號')).toBeTruthy()
    expect(screen.getByText('1 號')).toBeTruthy()

    const poolSize = DRAW_BANK.length
    const first = previewRounds(setup, poolSize)[0]
    if (first.artistSeat !== 1) {
      expect(screen.getByText('今局唔係你出場')).toBeTruthy()
    } else {
      expect(screen.getByText('今局輪到你作畫')).toBeTruthy()
      fireEvent.pointerDown(screen.getByText('按住卡片查看題目'))
      expect(screen.getByText('你要畫的是')).toBeTruthy()
      fireEvent.pointerUp(screen.getByText('你要畫的是'))
    }
    fireEvent.click(screen.getByRole('button', { name: '下一局' }))
    expect(localStorage.getItem('scoutsys:draw:r:draw-card-test-01')).toBe('2')
  })
})

/* ================= 大電視（指中做猜中） ================= */

describe('大電視（指中做猜中）', () => {
  it('完整一輪：設定 → 遊戲中 → 遮蔽 → 答對／跳過 → 結算', async () => {
    await renderAt('/act')
    expect(screen.getAllByText('大電視', { exact: false }).length).toBeGreaterThan(0)
    clickText('開始（抽')
    expect(screen.getByText('準備開始…')).toBeTruthy()
    toPlaying()
    expect(screen.getByText('1 / 15')).toBeTruthy()
    // 遮蔽（大電視用 CSS blur 遮字）
    fireEvent.click(screen.getByTitle('遮蔽 (B)'))
    expect(document.querySelector('.blur-2xl')).toBeTruthy()
    fireEvent.click(screen.getByTitle('遮蔽 (B)'))
    expect(document.querySelector('.blur-2xl')).toBeNull()
    clickText('答對了')
    expect(screen.getByText('2 / 15')).toBeTruthy()
    clickText('跳過', true)
    expect(screen.getByText('3 / 15')).toBeTruthy()
    // 已答 q1（答對）+ q2（跳過），剩 q3–q15 共 13 題
    for (let i = 0; i < 13; i++) {
      if (screen.queryByText('遊戲結束')) break
      clickText('答對了')
    }
    expect(screen.getByText('遊戲結束')).toBeTruthy()
  })
})

/* ================= Emoji 猜謎 ================= */

describe('Emoji 猜謎', () => {
  it('輸入模式：錯答不進頁 → 公布答案 → 下一題', async () => {
    await renderAt('/emoji')
    clickText('開始（抽')
    toPlaying()
    const input = screen.getByPlaceholderText('輸入答案後按 Enter...')
    fireEvent.change(input, { target: { value: 'zzz不可能正確999' } })
    fireEvent.click(screen.getByRole('button', { name: '作答' }))
    // 錯答 → 仍然第 1 題
    expect(screen.getByText('1 / 15')).toBeTruthy()
    // 放棄並公布答案
    fireEvent.click(screen.getByRole('button', { name: '放棄並公布答案' }))
    await act(async () => {})
    clickText('無人猜中')
    expect(screen.getByText('2 / 15')).toBeTruthy()
  })

  it('主持模式：公布答案 → 猜中計分 → 下一題', async () => {
    await renderAt('/emoji')
    clickText('主持模式')
    clickText('開始（抽')
    toPlaying()
    expect(screen.queryByPlaceholderText('輸入答案後按 Enter...')).toBeNull()
    clickText('公布答案')
    await act(async () => {})
    clickText('猜中了（加分）')
    expect(screen.getByText('2 / 15')).toBeTruthy()
  })
})

/* ================= 童軍金氏遊戲 ================= */

describe('童軍金氏遊戲', () => {
  it('主頁：四模式 + 積分榜 + 物品庫 + 使用說明', async () => {
    await renderAt('/kims')
    expect(screen.getByText('選擇遊戲')).toBeTruthy()
    expect(screen.getByText('榮譽積分榜')).toBeTruthy()
    expect(screen.getAllByText(/物品庫管理/).length).toBeGreaterThan(0)
    expect(screen.getByText('使用說明')).toBeTruthy()
  })

  it('金氏遊戲完整流程：設定 → 觀察 → 遮蓋 → 回答 → 結果 → 再來', async () => {
    await renderAt('/kims')
    clickText('視覺觀察記憶')
    clickText('初級')
    clickText('個人')
    const selects = screen.getAllByRole('combobox')
    fireEvent.change(selects[0], { target: { value: '10' } }) // 觀察
    fireEvent.change(selects[1], { target: { value: '20' } }) // 作答
    fireEvent.change(selects[2], { target: { value: '8' } }) // 物品數量
    clickText('開始遊戲')
    expect(screen.getByText('📦 8 件')).toBeTruthy()
    clickText('🚀 開始')
    // 觀察 10s → 遮蓋 →（1.5s 緩衝）→ 作答（chunk=1000 與組件間隔一致，避免漂移）
    expect(screen.getByText('👀 觀察 · 8 件')).toBeTruthy()
    tick(10000, 1000)
    tick(100)
    expect(screen.getByText('🔒 已遮蓋')).toBeTruthy()
    tick(1600)
    expect(screen.getByText('✍️ 回答')).toBeTruthy()
    const area = screen.getByPlaceholderText('輸入記得的物品，逗號分隔')
    fireEvent.change(area, { target: { value: '水壺, 手電筒' } })
    clickText('提交')
    expect(screen.getByText('📊 結果')).toBeTruthy()
    expect(screen.getByText('準確率')).toBeTruthy()
    clickText('再來')
    expect(screen.getByText('👀 觀察 · 8 件')).toBeTruthy()
    clickText('返回')
    await act(async () => {})
    expect(screen.getByText('選擇遊戲')).toBeTruthy()
  })

  it('物品庫：新增自訂物品', async () => {
    await renderAt('/kims')
    clickText('新增', true)
    const nameInput = screen.getByPlaceholderText('物品名稱')
    fireEvent.change(nameInput, { target: { value: '測試物品' } })
    const addBtns = Array.from(document.querySelectorAll('button')).filter(
      (b) => (b.textContent ?? '').trim() === '新增',
    )
    fireEvent.click(addBtns.pop()!)
    expect(screen.getByText('測試物品')).toBeTruthy()
  })

  it('配對記憶可開始並翻牌', async () => {
    await renderAt('/kims')
    clickText('翻牌配對')
    clickText('開始遊戲')
    await act(async () => {})
    clickText('🃏 開始遊戲')
    await act(async () => {})
    expect(screen.getByText(/已配對/)).toBeTruthy()
    const cards = screen.getAllByRole('button')
    expect(cards.length).toBeGreaterThanOrEqual(8)
    fireEvent.click(cards[0]!)
    fireEvent.click(cards[1]!)
    await act(async () => {})
    expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(8)
  })

  it('圖案記憶：展示 → 遮蓋 → 點選作答 → 提交', async () => {
    await renderAt('/kims')
    clickText('圖案／圖形卡')
    clickText('開始遊戲')
    await act(async () => {})
    // 先載入一個 Emoji 字包（未選包時開始鈕 disabled）
    clickText('童軍裝備')
    await act(async () => {})
    clickText('開始（')
    // 預設觀察 30s → 遮蓋 1.5s → 作答
    tick(30000, 1000)
    tick(100)
    expect(screen.getByText('🔒 已遮蓋')).toBeTruthy()
    tick(1600)
    expect(screen.getByText(/點選你記得出現過的圖案/)).toBeTruthy()
    // 選一個圖案選項
    const optionBtns = Array.from(document.querySelectorAll('button')).filter((b) =>
      (b.className ?? '').includes('border-2'),
    )
    expect(optionBtns.length).toBeGreaterThan(0)
    fireEvent.click(optionBtns[0]!)
    clickText('📤 提交')
    await act(async () => {})
    expect(screen.getByText('📊 結果')).toBeTruthy()
    expect(screen.getByText('準確率')).toBeTruthy()
  })

  it('聽覺金氏遊戲可開始', async () => {
    await renderAt('/kims')
    clickText('用耳朵記憶')
    clickText('開始遊戲')
    await act(async () => {})
    tick(2000)
    expect(document.body).toBeTruthy()
  })
})

/* ================= 像素化猜謎圖 ================= */

describe('像素化猜謎圖', () => {
  it('內建題目包 → 像素化 → 遊戲中 → 公布答案 → 回設定', async () => {
    await renderAt('/photo')
    expect(screen.getAllByText('像素化猜謎圖').length).toBeGreaterThan(0)
    expect(screen.getByText('🎁 內建題目包')).toBeTruthy()
    // 內建牌組（純 microtask 生成，act 刷新即可）
    clickText('Emoji 大圖')
    await act(async () => {})
    expect(screen.getByText(/已載入「Emoji 大圖」12 題/)).toBeTruthy()
    // 模式鈕（精確匹配，避免誤中題目包描述文字）
    clickBy((el) => el.textContent?.trim() === '▦像素化')
    expect(screen.getByRole('button', { name: /開始遊戲/ })).toBeTruthy()
    clickText('開始遊戲')
    // 倒數 3.2s → 遊戲中（多餘的 tick 涵蓋 toast 重繪引起的倒數重新排程）
    tick(8000, 1000)
    expect(screen.getByText('1 / 12')).toBeTruthy()
    expect(screen.getByText('遊戲進行中')).toBeTruthy()
    // 遊戲開始時控制側欄自動收合 → 先展開
    fireEvent.click(screen.getByRole('button', { name: '顯示/隱藏控制' }))
    clickText('公布答案')
    expect(screen.getByText('答案已公布')).toBeTruthy()
    clickText('結束回到設定')
    expect(screen.getByText('🎁 內建題目包')).toBeTruthy()
    // 玩家名稱
    const nameInput = screen.getByPlaceholderText('輸入玩家名稱...')
    fireEvent.change(nameInput, { target: { value: '小明' } })
    clickText('加入', true)
    expect(screen.getByText('小明')).toBeTruthy()
  })
})

/* ================= 誰是臥底（主持台） ================= */

describe('誰是臥底 — 主持台', () => {
  it('設定 → 產生 QR → 主持台 → 主持答案 → 換局 → 完成整輪', async () => {
    await renderAt('/undercover')
    expect(screen.getByText('平民')).toBeTruthy()
    const qrBtn = Array.from(document.querySelectorAll('button')).find((el) =>
      /產生 \d+ 個 QR Code/.test(el.textContent ?? ''),
    )!
    fireEvent.click(qrBtn)
    await act(async () => {})
    expect(screen.getAllByText(/號玩家/).length).toBeGreaterThanOrEqual(3)
    clickText('全部掃完，進入主持台')
    await act(async () => {})
    expect(screen.getByText('本輪第')).toBeTruthy()
    expect(screen.getByText(/本局發言順序/)).toBeTruthy()
    clickText('主持答案')
    expect(screen.getByText('平民詞')).toBeTruthy()
    expect(screen.getByText('臥底詞')).toBeTruthy()
    // 換局直到完成整輪（預設 20 局）
    for (let i = 0; i < 19; i++) {
      clickText('下一局', true)
      await act(async () => {})
    }
    clickText('完成整輪', true)
    await act(async () => {})
    expect(screen.queryByText('下一局')).toBeNull()
  })

  it('自訂詞對：加入 → 持久化', async () => {
    await renderAt('/undercover')
    const civ = screen.getByPlaceholderText('例：菠蘿包')
    const und = screen.getByPlaceholderText('例：雞尾包')
    fireEvent.change(civ, { target: { value: '測試平民詞' } })
    fireEvent.change(und, { target: { value: '測試臥底詞' } })
    clickText('加入這一對')
    const stored = JSON.parse(localStorage.getItem('scoutsys:uc:host:v2') ?? '{}')
    expect(stored.customPairs).toHaveLength(1)
    expect(stored.customPairs[0]).toMatchObject({ civilian: '測試平民詞', undercover: '測試臥底詞' })
  })
})

/* ================= 誰是臥底 玩家手機卡 ================= */

describe('誰是臥底 — 玩家手機卡', () => {
  const setup: GameSetup = {
    secret: 'uc-card-test-01',
    players: 4,
    undercovers: 1,
    blanks: 0,
    categories: [],
    customPairs: [],
    onlyCustom: false,
    rounds: 6,
  }

  it('掃 QR → 長按看身份 → 換局 + 進度持久化', async () => {
    window.location.hash = buildUcSeatUrl(setup, 2).split('#')[1]!
    await renderAt('/undercover/card')
    expect(screen.getByText('2 號玩家')).toBeTruthy()
    expect(screen.getByText('本輪第')).toBeTruthy()
    fireEvent.pointerDown(screen.getByText('按住卡片查看身分'))
    expect(screen.getAllByText(/平民|臥底|白卡/).length).toBeGreaterThan(0)
    fireEvent.pointerUp(screen.getAllByText(/平民|臥底|白卡/)[0]!)
    fireEvent.click(screen.getByRole('button', { name: '下一局' }))
    expect(localStorage.getItem('scoutsys:uc:r:uc-card-test-01')).toBe('2')
  })

  it('連結無效時顯示錯誤頁', async () => {
    window.location.hash = 'k=nope'
    await renderAt('/undercover/card')
    expect(screen.getByText('連結無效')).toBeTruthy()
    expect(screen.getByText('前往主持台')).toBeTruthy()
  })
})

/* ================= 返回主頁 ================= */

describe('返回主頁', () => {
  it('遊戲設定頁可返回主頁', async () => {
    await renderAt('/draw')
    const back = screen.getByRole('link', { name: /主頁/ })
    fireEvent.click(back)
    for (let i = 0; i < 50 && !document.body.innerHTML.includes('Scout System'); i++) {
      await act(async () => {})
    }
    expect(screen.getAllByText('Scout System', { exact: false }).length).toBeGreaterThan(0)
  })
})
