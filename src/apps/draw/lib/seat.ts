/**
 * 猜猜畫畫 — 秘密派題（座位 QR）
 * Copyright (c) 2026 Scout System. All rights reserved.
 *
 * 設計目標：畫家唔使行埋去主持機睇題，避免其他人偷望。
 *
 * 流程：
 *  1. 領袖設定玩家人數同局數 → 產生每人一個專屬 QR（一輪只掃一次）
 *  2. 玩家手機常駐一版，只顯示自己嘅玩家號（例：3 號）
 *  3. 領袖畫面顯示「下一局：3 號玩家」，等佢出嚟企定，先撳「開始計時」
 *  4. 只有 3 號嘅手機會出題目；其他人手機依然係一片空白
 *  5. 領袖可設定自動蓋牌時間，或隨時手動蓋牌
 *  6. 玩家撳「下一局」對齊局數即可，唔使輸入任何嘢
 *
 * 出場次序由派 QR 嗰刻抽出嘅密碼學亂數密鑰決定，
 * 每開新牌局換一條新密鑰，上一輪次序冇參考價值。
 */

export type DrawSeatSetup = {
  secret: string
  players: number
  /** 本輪局數 */
  rounds: number
  /** 難度篩選 */
  levels: string[]
  /** 分類篩選（空 = 全部） */
  categories: string[]
  /** 領袖自訂題目（只存答案文字；會寫入 QR 令玩家手機都有） */
  customAnswers: string[]
}

export type DrawRound = {
  round: number
  /** 本局輪到邊個座位出場作畫 */
  artistSeat: number
  /** 題目在題庫中的索引 */
  questionIndex: number
}

export const ROUND_OPTIONS = [10, 15, 20, 30]

/** 產生牌局密鑰（真・密碼學亂數） */
export function makeSecret() {
  const buf = new Uint8Array(12)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(buf)
  else for (let i = 0; i < 12; i++) buf[i] = Math.floor(Math.random() * 256)
  return Array.from(buf, (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 16)
}

function hashString(str: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  h ^= h >>> 16
  h = Math.imul(h, 2246822507) >>> 0
  h ^= h >>> 13
  h = Math.imul(h, 3266489909) >>> 0
  h ^= h >>> 16
  return h >>> 0
}

function prng(seedNum: number) {
  let a = seedNum >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 建立 PRNG 並丟棄首個輸出，避開種子相近時的弱相關 */
function prngAfter(seedNum: number) {
  const f = prng(seedNum)
  f()
  return f
}

function shuffleWith<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * 某一圈嘅畫家出場次序。
 * 由第 0 圈逐圈推算，並確保新一圈第一位 ≠ 上一圈最後一位
 * （必須拿「已修正」嘅上一圈嚟比較，否則會漏 case）。
 */
function artistCycleOrder(setup: DrawSeatSetup, cycle: number): number[] {
  const n = Math.max(1, setup.players)
  const base = (c: number) =>
    shuffleWith(
      Array.from({ length: n }, (_, i) => i + 1),
      prngAfter(hashString(`${setup.secret}|draw-artist|c${c}|${n}`)),
    )

  let order = base(0)
  for (let c = 1; c <= cycle; c++) {
    const prevLast = order[n - 1]
    let next = base(c)
    if (n > 1 && next[0] === prevLast) next = [...next.slice(1), next[0]]
    order = next
  }
  return order
}

/**
 * 由局數推導本局資料。所有裝置計出嚟一定一樣。
 *
 * 畫家：將座位洗牌成「輪換表」逐個出場，出完一圈再洗一次 ——
 * 保證每人出場次數平均，亦唔會連續兩局抽中同一人。
 * 題目：將題庫洗牌後依序取用，確保一輪內唔會重複出題。
 */
export function resolveRound(setup: DrawSeatSetup, round: number, poolSize: number): DrawRound {
  const n = Math.max(1, setup.players)
  const idx = Math.max(1, round) - 1

  const artistSeat = artistCycleOrder(setup, Math.floor(idx / n))[idx % n]

  let questionIndex = 0
  if (poolSize > 0) {
    const qCycle = Math.floor(idx / poolSize)
    const qOrder = shuffleWith(
      Array.from({ length: poolSize }, (_, i) => i),
      prngAfter(hashString(`${setup.secret}|draw-question|c${qCycle}|${poolSize}`)),
    )
    questionIndex = qOrder[idx % poolSize]
  }

  return { round, artistSeat, questionIndex }
}

/** 預覽整輪安排（供領袖備課，成員勿看） */
export function previewRounds(setup: DrawSeatSetup, poolSize: number): DrawRound[] {
  return Array.from({ length: setup.rounds }, (_, i) => resolveRound(setup, i + 1, poolSize))
}

/* ---------- 題目池（主持機與玩家手機必須完全一致） ---------- */

export type PoolItem = { answer: string; category: string; level: string; hint?: string }

/**
 * 由內建題庫 + 自訂題目組成本局題目池。
 * 順序固定為「內建（原順序，經篩選）→ 自訂（原順序）」，
 * 確保任何裝置計出嚟嘅索引都指向同一條題。
 */
export function buildPool(builtIn: readonly PoolItem[], setup: DrawSeatSetup): PoolItem[] {
  const lv = setup.levels
  const cats = setup.categories
  const filtered = builtIn.filter((q) => {
    if (lv.length && !lv.includes(q.level)) return false
    if (cats.length && !cats.includes(q.category)) return false
    return true
  })
  const custom: PoolItem[] = setup.customAnswers.map((a) => ({
    answer: a,
    category: '自訂',
    level: 'medium',
  }))
  const pool = [...filtered, ...custom]
  return pool.length ? pool : [...builtIn]
}

/* ---------- QR 連結 ---------- */

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let bin = ''
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(b64: string): string {
  const pad = b64.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(pad + '='.repeat((4 - (pad.length % 4)) % 4))
  return new TextDecoder().decode(Uint8Array.from(bin, (ch) => ch.charCodeAt(0)))
}

/** QR 容量上限（保守值） */
export const MAX_URL_LENGTH = 1800

export function buildSeatUrl(setup: DrawSeatSetup, seat: number, origin?: string): string {
  const base = origin ?? window.location.origin
  const p = new URLSearchParams({
    k: setup.secret,
    n: String(setup.players),
    p: String(seat),
    r: String(setup.rounds),
  })
  if (setup.levels.length) p.set('l', setup.levels.map((x) => x[0]).join(''))
  if (setup.categories.length) p.set('c', toBase64Url(setup.categories.join('|')))
  if (setup.customAnswers.length) p.set('w', toBase64Url(setup.customAnswers.join('|')))
  return `${base}/draw/card#${p.toString()}`
}

export type DrawSeatLink = DrawSeatSetup & { seat: number }

const LEVEL_BY_INITIAL: Record<string, string> = { e: 'easy', m: 'medium', h: 'hard' }

export function parseSeatUrl(hash: string): DrawSeatLink | null {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  if (!raw) return null
  const p = new URLSearchParams(raw)
  const secret = p.get('k')
  const players = Number(p.get('n'))
  const seat = Number(p.get('p'))
  if (!secret || !players || !seat) return null
  const decode = (key: string) => {
    const v = p.get(key)
    if (!v) return [] as string[]
    try {
      return fromBase64Url(v).split('|').filter(Boolean)
    } catch {
      return [] as string[]
    }
  }
  return {
    secret,
    players,
    seat,
    rounds: Number(p.get('r') || 20),
    levels: (p.get('l') || '').split('').map((c) => LEVEL_BY_INITIAL[c]).filter(Boolean),
    categories: decode('c'),
    customAnswers: decode('w'),
  }
}

export function estimateUrlLength(setup: DrawSeatSetup): number {
  return buildSeatUrl(setup, setup.players || 1, 'https://example.vercel.app').length
}
