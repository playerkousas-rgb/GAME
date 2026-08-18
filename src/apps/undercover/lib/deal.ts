/**
 * 誰是臥底 — 決定性（deterministic）角色分派
 * Copyright (c) 2026 Scout System. All rights reserved.
 *
 * 核心概念：
 *  主持設定一次（人數 / 臥底數 / 白卡數）後產生一條「牌局種子 seed」，
 *  每位玩家的 QR Code 內含 seed + 自己的座位號。
 *  任何一部裝置只要知道 seed 與回合數，都會算出完全相同的分派結果，
 *  因此毋須伺服器、毋須連線，每回合自動重新隨機，玩幾多局都得。
 */
import { WORD_PAIRS, type WordPair } from '../data/wordPairs'

export type Role = 'civilian' | 'undercover' | 'blank'

export type GameSetup = {
  /** 牌局種子 */
  seed: string
  /** 玩家人數 */
  players: number
  /** 臥底人數 */
  undercovers: number
  /** 白卡人數 */
  blanks: number
  /** 限定題目分類（空 = 全部） */
  categories: string[]
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

/* ---------- 決定性亂數 ---------- */

function hashString(str: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return h >>> 0
}

/** mulberry32 PRNG */
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

/* ---------- 建議值 ---------- */

/** 依人數建議的臥底 / 白卡數量 */
export function suggestCounts(players: number): { undercovers: number; blanks: number } {
  if (players <= 4) return { undercovers: 1, blanks: 0 }
  if (players <= 6) return { undercovers: 1, blanks: 0 }
  if (players <= 8) return { undercovers: 2, blanks: 0 }
  if (players <= 10) return { undercovers: 2, blanks: 1 }
  if (players <= 14) return { undercovers: 3, blanks: 1 }
  return { undercovers: Math.floor(players / 4), blanks: 1 }
}

/** 臥底上限：要留至少 2 位平民 */
export function maxUndercovers(players: number, blanks: number) {
  return Math.max(1, players - blanks - 2)
}

/** 白卡上限 */
export function maxBlanks(players: number, undercovers: number) {
  return Math.max(0, players - undercovers - 2)
}

export function makeSeed() {
  return Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 6)
}

/* ---------- 核心：計算某一回合的分派 ---------- */

export function dealRound(setup: GameSetup, round: number): RoundResult {
  const rand = prng(hashString(`${setup.seed}|r${round}|${setup.players}|${setup.undercovers}|${setup.blanks}`))

  // 1. 選詞語對
  const pool = setup.categories.length
    ? WORD_PAIRS.filter((p) => setup.categories.includes(p.category))
    : WORD_PAIRS
  const list = pool.length ? pool : WORD_PAIRS
  const pair = list[Math.floor(rand() * list.length)]

  // 2. 隨機決定平民/臥底邊個詞（令主持都估唔到）
  const flip = rand() < 0.5
  const civilianWord = flip ? pair.undercover : pair.civilian
  const undercoverWord = flip ? pair.civilian : pair.undercover

  // 3. 洗牌座位
  const seatsIdx = shuffleWith(
    Array.from({ length: setup.players }, (_, i) => i + 1),
    rand,
  )
  const u = Math.min(setup.undercovers, Math.max(0, setup.players - 2))
  const b = Math.min(setup.blanks, Math.max(0, setup.players - u - 2))

  const roleBySeat = new Map<number, Role>()
  seatsIdx.forEach((seat, i) => {
    if (i < u) roleBySeat.set(seat, 'undercover')
    else if (i < u + b) roleBySeat.set(seat, 'blank')
    else roleBySeat.set(seat, 'civilian')
  })

  // 4. 發言順序亦每回合隨機
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

/* ---------- QR 連結編碼 ---------- */

export type SeatLinkParams = GameSetup & { seat: number }

/** 產生玩家卡連結（全部參數放喺 hash，唔會送去伺服器） */
export function buildSeatUrl(setup: GameSetup, seat: number, origin?: string): string {
  const base = origin ?? `${window.location.origin}`
  const p = new URLSearchParams({
    s: setup.seed,
    n: String(setup.players),
    u: String(setup.undercovers),
    b: String(setup.blanks),
    p: String(seat),
  })
  if (setup.categories.length) p.set('c', setup.categories.join(','))
  return `${base}/undercover/card#${p.toString()}`
}

export function parseSeatUrl(hash: string): SeatLinkParams | null {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  if (!raw) return null
  const p = new URLSearchParams(raw)
  const seed = p.get('s')
  const players = Number(p.get('n'))
  const seat = Number(p.get('p'))
  if (!seed || !players || !seat) return null
  return {
    seed,
    players,
    undercovers: Number(p.get('u') || 1),
    blanks: Number(p.get('b') || 0),
    seat,
    categories: (p.get('c') || '').split(',').filter(Boolean),
  }
}
