/**
 * 猜猜畫畫 — 秘密派題（座位 QR）
 * Copyright (c) 2026 Scout System. All rights reserved.
 *
 * 設計目標：畫家唔使行埋去主持機睇題，避免其他人偷望。
 *
 * 流程：
 *  1. 領袖設定玩家人數 → 產生每人一個專屬 QR（整晚只掃一次）
 *  2. 玩家手機常駐一版，只顯示自己嘅玩家號（例：3 號）
 *  3. 領袖畫面顯示「下一局：3 號玩家」，等佢出嚟企定，先撳「開始」
 *  4. 開始後，只有 3 號嘅手機會出題目；其他人手機依然係一片空白
 *  5. 領袖可設定自動蓋牌時間，或隨時手動蓋牌
 *
 * 同「誰是臥底」一樣採用「牌局密鑰 + 本局代碼」：
 * 代碼係撳掣嗰刻先用密碼學亂數抽出，所以出場次序與題目都無法預先推算。
 */

export type DrawSeatSetup = {
  secret: string
  players: number
  /** 難度篩選 */
  levels: string[]
  /** 分類篩選（空 = 全部） */
  categories: string[]
  /** 領袖自訂題目（只存答案文字；會寫入 QR 令玩家手機都有） */
  customAnswers: string[]
}

export type DrawRound = {
  code: string
  /** 本局輪到邊個座位出場作畫 */
  artistSeat: number
  /** 題目在題庫中的索引 */
  questionIndex: number
}

export const CODE_LENGTH = 4
const DIGITS = '0123456789'

export function randomCode(): string {
  const buf = new Uint32Array(CODE_LENGTH)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(buf)
  else for (let i = 0; i < CODE_LENGTH; i++) buf[i] = Math.floor(Math.random() * 0xffffffff)
  let s = ''
  for (let i = 0; i < CODE_LENGTH; i++) s += DIGITS[buf[i] % 10]
  return s
}

export function normalizeCode(input: string): string {
  return input.split('').filter((c) => DIGITS.includes(c)).join('').slice(0, CODE_LENGTH)
}

export function isCodeComplete(code: string) {
  return normalizeCode(code).length === CODE_LENGTH
}

export function makeSecret() {
  const buf = new Uint8Array(8)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(buf)
  else for (let i = 0; i < 8; i++) buf[i] = Math.floor(Math.random() * 256)
  return Array.from(buf, (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 12)
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

/**
 * 由代碼推導本局資料。所有裝置計出嚟一定一樣。
 * @param poolSize 題庫可抽題目數
 */
export function resolveRound(setup: DrawSeatSetup, code: string, poolSize: number): DrawRound {
  const clean = normalizeCode(code)
  // 畫家與題目各用獨立 hash domain，令兩者互不相關
  const ra = prng(hashString(`${setup.secret}|draw-artist|${clean}|${setup.players}`))
  const rq = prng(hashString(`${setup.secret}|draw-question|${clean}|${poolSize}`))
  ra() // 丟棄第一個輸出，避開種子相近時的弱相關
  rq()
  const artistSeat = Math.floor(ra() * setup.players) + 1
  const questionIndex = poolSize > 0 ? Math.floor(rq() * poolSize) : 0
  return { code: clean, artistSeat, questionIndex }
}

/**
 * 抽一個新代碼。
 * @param avoidSeat 盡量避開嘅座位（通常係上一局畫家，免得連續兩次同一人）
 */
export function drawCode(setup: DrawSeatSetup, poolSize: number, avoidSeat?: number): string {
  if (!avoidSeat || setup.players <= 1) return randomCode()
  for (let i = 0; i < 200; i++) {
    const code = randomCode()
    if (resolveRound(setup, code, poolSize).artistSeat !== avoidSeat) return code
  }
  return randomCode()
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
    levels: (p.get('l') || '').split('').map((c) => LEVEL_BY_INITIAL[c]).filter(Boolean),
    categories: decode('c'),
    customAnswers: decode('w'),
  }
}

export function estimateUrlLength(setup: DrawSeatSetup): number {
  return buildSeatUrl(setup, setup.players || 1, 'https://example.vercel.app').length
}
