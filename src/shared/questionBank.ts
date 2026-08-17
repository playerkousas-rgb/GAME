/**
 * 共用題庫系統 — 型別、分類、隨機抽題、自訂題目儲存
 * Copyright (c) 2026 Scout System. All rights reserved.
 */

export type QDifficulty = 'easy' | 'medium' | 'hard'

/** 題庫所屬遊戲 */
export type BankId = 'draw' | 'act' | 'emoji' | 'text'

export interface Question {
  /** 唯一 id */
  id: string
  /** 答案／題目主體（畫畫與大電視為要表達的詞語；EMOJI 為謎底） */
  answer: string
  /** EMOJI 題專用：題面的 emoji 串 */
  emoji?: string
  /** 提示（可選） */
  hint?: string
  /** 分類 */
  category: string
  /** 難度 */
  level: QDifficulty
  /** 是否為使用者自訂 */
  isCustom?: boolean
}

export const DIFFICULTY_META: Record<QDifficulty, { label: string; short: string; color: string; dot: string }> = {
  easy: { label: '初級', short: '易', color: 'text-emerald-300', dot: 'bg-emerald-400' },
  medium: { label: '中級', short: '中', color: 'text-amber-300', dot: 'bg-amber-400' },
  hard: { label: '高級', short: '難', color: 'text-rose-300', dot: 'bg-rose-400' },
}

export const BANK_META: Record<BankId, { label: string; storageKey: string }> = {
  draw: { label: '猜猜畫畫', storageKey: 'scout-system:custom:draw' },
  act: { label: '大電視', storageKey: 'scout-system:custom:act' },
  emoji: { label: 'EMOJI 猜謎', storageKey: 'scout-system:custom:emoji' },
  text: { label: '文字記憶', storageKey: 'scout-system:custom:text' },
}

/* ==================== 隨機抽題 ==================== */

/** Fisher–Yates 洗牌（不改動原陣列） */
export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export interface DrawOptions {
  levels?: QDifficulty[]
  categories?: string[]
  /** 需要抽出的數量；不足時回傳全部 */
  count?: number
}

/** 依條件篩選題目 */
export function filterQuestions(pool: readonly Question[], opts: DrawOptions = {}): Question[] {
  const { levels, categories } = opts
  return pool.filter((q) => {
    if (levels && levels.length > 0 && !levels.includes(q.level)) return false
    if (categories && categories.length > 0 && !categories.includes(q.category)) return false
    return true
  })
}

/** 依條件隨機抽題（不重複） */
export function drawQuestions(pool: readonly Question[], opts: DrawOptions = {}): Question[] {
  const filtered = filterQuestions(pool, opts)
  const shuffled = shuffle(filtered)
  return opts.count && opts.count > 0 ? shuffled.slice(0, opts.count) : shuffled
}

/** 取出題庫中所有分類（依出現次數排序） */
export function listCategories(pool: readonly Question[]): { name: string; count: number }[] {
  const map = new Map<string, number>()
  pool.forEach((q) => map.set(q.category, (map.get(q.category) ?? 0) + 1))
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

/** 題庫統計 */
export function bankStats(pool: readonly Question[]) {
  return {
    total: pool.length,
    easy: pool.filter((q) => q.level === 'easy').length,
    medium: pool.filter((q) => q.level === 'medium').length,
    hard: pool.filter((q) => q.level === 'hard').length,
    categories: listCategories(pool).length,
    custom: pool.filter((q) => q.isCustom).length,
  }
}

/* ==================== 自訂題目儲存 ==================== */

export function loadCustom(bank: BankId): Question[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(BANK_META[bank].storageKey)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((q): q is Question => !!q && typeof q.answer === 'string' && q.answer.length > 0)
      .map((q) => ({ ...q, isCustom: true as const }))
  } catch {
    return []
  }
}

export function saveCustom(bank: BankId, questions: Question[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(BANK_META[bank].storageKey, JSON.stringify(questions))
  } catch {
    /* quota exceeded — 忽略 */
  }
}

export function makeCustomId(): string {
  return `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

/** 合併內建與自訂題庫 */
export function mergeBank(builtIn: readonly Question[], custom: readonly Question[]): Question[] {
  return [...builtIn, ...custom]
}

/* ==================== 匯入／匯出 ==================== */

/**
 * 由純文字批次解析題目。每行一題，支援：
 *   答案
 *   答案 | 分類
 *   答案 | 分類 | 難度(易/中/難 或 easy/medium/hard)
 *   答案 | 分類 | 難度 | 提示
 * EMOJI 題庫格式：emoji串 | 答案 | 分類 | 難度
 */
export function parseBulk(text: string, bank: BankId, defaultCategory = '自訂'): Question[] {
  const levelMap: Record<string, QDifficulty> = {
    易: 'easy', 初級: 'easy', easy: 'easy',
    中: 'medium', 中級: 'medium', medium: 'medium',
    難: 'hard', 高級: 'hard', hard: 'hard',
  }
  const out: Question[] = []
  for (const line of text.split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#') || t.startsWith('//')) continue
    const parts = t.split(/\s*[|｜]\s*/)
    if (bank === 'emoji') {
      const [emoji, answer, category, level, hint] = parts
      if (!emoji || !answer) continue
      out.push({
        id: makeCustomId(),
        emoji: emoji.trim(),
        answer: answer.trim(),
        category: (category || defaultCategory).trim(),
        level: levelMap[(level || '').trim().toLowerCase()] ?? 'medium',
        hint: hint?.trim() || undefined,
        isCustom: true,
      })
    } else {
      const [answer, category, level, hint] = parts
      if (!answer) continue
      out.push({
        id: makeCustomId(),
        answer: answer.trim(),
        category: (category || defaultCategory).trim(),
        level: levelMap[(level || '').trim().toLowerCase()] ?? 'medium',
        hint: hint?.trim() || undefined,
        isCustom: true,
      })
    }
  }
  return out
}

/** 匯出為可再匯入的純文字 */
export function exportBulk(questions: readonly Question[], bank: BankId): string {
  const levelZh: Record<QDifficulty, string> = { easy: '易', medium: '中', hard: '難' }
  return questions
    .map((q) =>
      bank === 'emoji'
        ? [q.emoji ?? '', q.answer, q.category, levelZh[q.level], q.hint ?? ''].filter(Boolean).join(' | ')
        : [q.answer, q.category, levelZh[q.level], q.hint ?? ''].filter(Boolean).join(' | '),
    )
    .join('\n')
}
