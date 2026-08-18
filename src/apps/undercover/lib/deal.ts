/**
 * 誰是臥底 — 角色分派核心
 * Copyright (c) 2026 Scout System. All rights reserved.
 *
 * ── 一次抽籤，玩足一輪 ─────────────────────────────────
 * 領袖產生 QR 嗰刻，用 crypto.getRandomValues 抽出一條「牌局密鑰」，
 * 呢條密鑰決定咗成輪（預設 20 局）嘅所有分派。
 *
 *  1. 密鑰係真・密碼學亂數，冇人可以預知或影響。
 *  2. 所有裝置以 hash(密鑰 ‖ 局數) 推導，故毋須伺服器亦保證各機一致。
 *  3. 玩家只需喺自己手機撳「下一局」，唔使每局輸入代碼。
 *  4. 一輪玩完（或中途加減人）就開新牌局、重新派 QR，換一條全新密鑰。
 *
 * 關於「會唔會俾人記住派發順序」：
 *  密鑰每輪都換，而一輪得 20 局、通常玩足一個鐘。
 *  就算有人記得「上一輪第 7 局我做臥底」，換咗密鑰之後完全冇參考價值。
 */
import { WORD_PAIRS, type WordPair } from '../data/wordPairs'

export type Role = 'civilian' | 'undercover' | 'blank'

export type GameSetup = {
  /** 牌局密鑰（存於 QR，用來令本局代碼對外人無意義） */
  secret: string
  players: number
  undercovers: number
  blanks: number
  /** 內建題庫的分類篩選（空 = 全部） */
  categories: string[]
  /** 領袖自訂詞語對 */
  customPairs: WordPair[]
  /** 只用自訂題目 */
  onlyCustom: boolean
  /** 本輪局數 */
  rounds: number
}

export type SeatResult = {
  seat: number
  role: Role
  /** 白卡為空字串 */
  word: string
  /** 發言順序（1 起） */
  order: number
}

export type RoundResult = {
  round: number
  pair: WordPair
  civilianWord: string
  undercoverWord: string
  seats: SeatResult[]
}

export const ROLE_LABEL: Record<Role, string> = {
  civilian: '平民',
  undercover: '臥底',
  blank: '白卡',
}

export const ROLE_EMOJI: Record<Role, string> = {
  civilian: '🧑‍🤝‍🧑',
  undercover: '🕵️',
  blank: '🃏',
}

/* ================= 牌局密鑰 ================= */

/** 預設局數選項 */
export const ROUND_OPTIONS = [10, 15, 20, 30]

/** 產生牌局密鑰（真・密碼學亂數） */
export function makeSecret() {
  const buf = new Uint8Array(12)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(buf)
  else for (let i = 0; i < 12; i++) buf[i] = Math.floor(Math.random() * 256)
  return Array.from(buf, (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 16)
}

/* ================= 決定性亂數 ================= */

function hashString(str: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  // 額外混合，減少相近輸入產生相近輸出
  h ^= h >>> 16
  h = Math.imul(h, 2246822507) >>> 0
  h ^= h >>> 13
  h = Math.imul(h, 3266489909) >>> 0
  h ^= h >>> 16
  return h >>> 0
}

function prng(seedNum: number) {
  let a = seedNum >>> 0
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffleWith<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/* ================= 建議值 ================= */

export function suggestCounts(players: number): { undercovers: number; blanks: number } {
  if (players <= 6) return { undercovers: 1, blanks: 0 }
  if (players <= 8) return { undercovers: 2, blanks: 0 }
  if (players <= 10) return { undercovers: 2, blanks: 1 }
  if (players <= 14) return { undercovers: 3, blanks: 1 }
  return { undercovers: Math.floor(players / 4), blanks: 1 }
}

export function maxUndercovers(players: number, blanks: number) {
  return Math.max(1, players - blanks - 2)
}

export function maxBlanks(players: number, undercovers: number) {
  return Math.max(0, players - undercovers - 2)
}

/* ================= 題庫 ================= */

/**
 * 產生本局可用的詞語池。
 * 排序必須在所有裝置上一致，故一律以「內建（依原順序）＋自訂（依原順序）」組成。
 */
export function buildPool(setup: GameSetup): WordPair[] {
  const custom = setup.customPairs ?? []
  if (setup.onlyCustom) return custom.length ? custom : WORD_PAIRS
  const builtin = setup.categories.length
    ? WORD_PAIRS.filter((p) => setup.categories.includes(p.category))
    : WORD_PAIRS
  const pool = [...builtin, ...custom]
  return pool.length ? pool : WORD_PAIRS
}

/* ================= 核心分派 ================= */

export function dealRound(setup: GameSetup, round: number): RoundResult {
  const rand = prng(
    hashString(`${setup.secret}|uc|r${round}|${setup.players}|${setup.undercovers}|${setup.blanks}`),
  )
  rand() // 丟棄第一個輸出，避開種子相近時的弱相關

  const pool = buildPool(setup)
  const pair = pool[Math.floor(rand() * pool.length) % pool.length]

  // 隨機決定邊個詞畀平民（令領袖都估唔到）
  const flip = rand() < 0.5
  const civilianWord = flip ? pair.undercover : pair.civilian
  const undercoverWord = flip ? pair.civilian : pair.undercover

  const shuffled = shuffleWith(
    Array.from({ length: setup.players }, (_, i) => i + 1),
    rand,
  )
  const u = Math.min(setup.undercovers, Math.max(0, setup.players - 2))
  const b = Math.min(setup.blanks, Math.max(0, setup.players - u - 2))

  const roleBySeat = new Map<number, Role>()
  shuffled.forEach((seat, i) => {
    if (i < u) roleBySeat.set(seat, 'undercover')
    else if (i < u + b) roleBySeat.set(seat, 'blank')
    else roleBySeat.set(seat, 'civilian')
  })

  const speakOrder = shuffleWith(
    Array.from({ length: setup.players }, (_, i) => i + 1),
    rand,
  )
  const orderBySeat = new Map<number, number>()
  speakOrder.forEach((seat, i) => orderBySeat.set(seat, i + 1))

  const seats: SeatResult[] = Array.from({ length: setup.players }, (_, i) => {
    const seat = i + 1
    const role = roleBySeat.get(seat) ?? 'civilian'
    return {
      seat,
      role,
      word: role === 'undercover' ? undercoverWord : role === 'blank' ? '' : civilianWord,
      order: orderBySeat.get(seat) ?? seat,
    }
  })

  return { round, pair, civilianWord, undercoverWord, seats }
}

/** 預覽整輪每局會用邊對詞（供領袖備課，成員勿看） */
export function previewRounds(setup: GameSetup): RoundResult[] {
  return Array.from({ length: setup.rounds }, (_, i) => dealRound(setup, i + 1))
}

/* ================= QR 連結編碼 ================= */

export type SeatLink = {
  secret: string
  players: number
  undercovers: number
  blanks: number
  seat: number
  categories: string[]
  customPairs: WordPair[]
  onlyCustom: boolean
  rounds: number
}

/* --- base64url（UTF-8）：中文每字約 4 字元，遠勝百分比編碼嘅 9 字元 --- */

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let bin = ''
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(b64: string): string {
  const pad = b64.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(pad + '='.repeat((4 - (pad.length % 4)) % 4))
  const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function encodePairs(pairs: WordPair[]): string {
  // 分類統一為「自訂」，毋須寫入，慳位
  return toBase64Url(pairs.map((p) => `${p.civilian}~${p.undercover}`).join('|'))
}

function decodePairs(raw: string): WordPair[] {
  if (!raw) return []
  let text: string
  try {
    text = fromBase64Url(raw)
  } catch {
    return []
  }
  return text
    .split('|')
    .map((chunk, i) => {
      const [civilian, undercover] = chunk.split('~')
      if (!civilian || !undercover) return null
      return { id: `cu${i}`, civilian, undercover, category: '自訂' }
    })
    .filter((x): x is WordPair => x !== null)
}

/** QR 容量上限（保守值，確保用中等容錯仍可掃） */
export const MAX_URL_LENGTH = 1800

/** 估算連結長度，供 UI 提示用 */
export function estimateUrlLength(setup: GameSetup): number {
  return buildSeatUrl(setup, setup.players || 1, 'https://example.vercel.app').length
}

/** 產生玩家卡連結（全部資料放喺 # 之後，不會傳去伺服器） */
export function buildSeatUrl(setup: GameSetup, seat: number, origin?: string): string {
  const base = origin ?? window.location.origin
  const p = new URLSearchParams({
    k: setup.secret,
    n: String(setup.players),
    u: String(setup.undercovers),
    b: String(setup.blanks),
    p: String(seat),
    r: String(setup.rounds),
  })
  if (setup.categories.length) p.set('c', setup.categories.join(','))
  if (setup.customPairs.length) p.set('w', encodePairs(setup.customPairs))
  if (setup.onlyCustom) p.set('x', '1')
  return `${base}/undercover/card#${p.toString()}`
}

export function parseSeatUrl(hash: string): SeatLink | null {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  if (!raw) return null
  const p = new URLSearchParams(raw)
  const secret = p.get('k')
  const players = Number(p.get('n'))
  const seat = Number(p.get('p'))
  if (!secret || !players || !seat) return null
  return {
    secret,
    players,
    undercovers: Number(p.get('u') || 1),
    blanks: Number(p.get('b') || 0),
    seat,
    categories: (p.get('c') || '').split(',').filter(Boolean),
    customPairs: decodePairs(p.get('w') || ''),
    onlyCustom: p.get('x') === '1',
    rounds: Number(p.get('r') || 20),
  }
}

export function seatLinkToSetup(l: SeatLink): GameSetup {
  return {
    secret: l.secret,
    players: l.players,
    undercovers: l.undercovers,
    blanks: l.blanks,
    categories: l.categories,
    customPairs: l.customPairs,
    onlyCustom: l.onlyCustom,
    rounds: l.rounds,
  }
}
