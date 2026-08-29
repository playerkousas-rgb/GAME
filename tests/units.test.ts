/**
 * 邏輯單測 — 題庫完整性、自訂題目儲存、座位 QR / 派題確定性
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { DRAW_BANK } from '../src/data/drawBank'
import { ACT_BANK } from '../src/data/actBank'
import { EMOJI_BANK } from '../src/data/emojiBank'
import { TEXT_PACKS, packWords } from '../src/data/textPacks'
import { loadCustom, saveCustom, shuffle, makeCustomId, parseBulk, type Question } from '../src/shared/questionBank'
import {
  buildPool,
  buildSeatUrl,
  parseSeatUrl,
  resolveRound,
  previewRounds,
  estimateUrlLength,
  MAX_URL_LENGTH,
  type DrawSeatSetup,
} from '../src/apps/draw/lib/seat'
import {
  dealRound,
  buildSeatUrl as ucBuildSeatUrl,
  parseSeatUrl as ucParseSeatUrl,
  seatLinkToSetup,
  suggestCounts,
  type GameSetup,
} from '../src/apps/undercover/lib/deal'
import { WORD_PAIRS } from '../src/apps/undercover/data/wordPairs'
import { DEFAULT_BUILT_IN_ITEMS } from '../src/apps/kims/data/items'
import { DECK_PACKS } from '../src/apps/photo/lib/generatedDeck'

beforeEach(() => {
  localStorage.clear()
})

/* ================= 題庫 ================= */

describe('內建題庫', () => {
  it('各題庫有足夠數量且欄位完整', () => {
    expect(DRAW_BANK.length).toBeGreaterThanOrEqual(80)
    expect(ACT_BANK.length).toBeGreaterThanOrEqual(80)
    expect(EMOJI_BANK.length).toBeGreaterThanOrEqual(60)
    expect(TEXT_PACKS.reduce((n, p) => n + p.words.length, 0)).toBeGreaterThanOrEqual(80)

    for (const q of DRAW_BANK) {
      expect(q.answer.trim().length).toBeGreaterThan(0)
      expect(q.category).toBeTruthy()
      expect(['easy', 'medium', 'hard']).toContain(q.level)
    }
    // 提示為選填；有就一定要非空
    for (const q of ACT_BANK) {
      expect(q.answer.trim().length).toBeGreaterThan(0)
      if (q.hint !== undefined) expect(q.hint.trim().length).toBeGreaterThan(0)
    }
    for (const q of EMOJI_BANK) {
      expect(q.answer.trim().length).toBeGreaterThan(0)
      expect(q.emoji?.length).toBeGreaterThan(0)
    }
    for (const p of TEXT_PACKS) {
      expect(p.name).toBeTruthy()
      expect(p.words.length).toBeGreaterThan(0)
      expect(packWords(p).length).toBe(p.words.length)
    }
  })

  it('答案不重複', () => {
    for (const bank of [DRAW_BANK, ACT_BANK, EMOJI_BANK]) {
      const answers = bank.map((q) => q.answer)
      expect(new Set(answers).size).toBe(answers.length)
    }
  })

  it('shuffle 保留元素且不改變長度', () => {
    const arr = Array.from({ length: 50 }, (_, i) => i)
    const s = shuffle(arr)
    expect(s).toHaveLength(50)
    expect([...s].sort((a, b) => a - b)).toEqual(arr)
  })
})

/* ================= 自訂題目儲存 ================= */

describe('自訂題目（localStorage）', () => {
  const mk = (answer: string): Question => ({ id: makeCustomId(), answer, category: '自訂', level: 'medium' })

  it('存取往返', () => {
    saveCustom('draw', [mk('甲'), mk('乙')])
    const got = loadCustom('draw')
    expect(got).toHaveLength(2)
    expect(got.map((q) => q.answer)).toEqual(['甲', '乙'])
    expect(got.every((q) => q.isCustom)).toBe(true)
  })

  it('寫入損毀資料時回傳空陣列（不崩潰）', () => {
    localStorage.setItem('scout-system:custom:draw', '{oops not json')
    expect(loadCustom('draw')).toEqual([])
  })

  it('不同遊戲各用各的 key，互不干擾', () => {
    saveCustom('draw', [mk('畫')])
    saveCustom('act', [mk('做'), mk('猜')])
    expect(loadCustom('draw')).toHaveLength(1)
    expect(loadCustom('act')).toHaveLength(2)
    expect(loadCustom('emoji')).toHaveLength(0)
  })

  it('批次匯入解析（答案 / 答案|分類 / emoji 格式）', () => {
    const normal = parseBulk('帳篷\n水瓶 | 裝備 | 易\n# 註解行', 'draw')
    expect(normal).toHaveLength(2)
    expect(normal[1]).toMatchObject({ answer: '水瓶', category: '裝備', level: 'easy' })
    const emojiQ = parseBulk('🦁👑 | 獅子王 | 動物 | 中', 'emoji')
    expect(emojiQ).toHaveLength(1)
    expect(emojiQ[0]).toMatchObject({ emoji: '🦁👑', answer: '獅子王', category: '動物', level: 'medium' })
  })
})

/* ================= 猜猜畫畫：題目池與座位 QR ================= */

describe('猜猜畫畫 — buildPool / 座位 QR', () => {
  const baseSetup: DrawSeatSetup = {
    secret: 'testsecret01',
    players: 4,
    rounds: 12,
    levels: [],
    categories: [],
    customAnswers: [],
  }

  it('池 = 內建 + 自訂（自訂在後）', () => {
    const pool = buildPool(DRAW_BANK, {
      ...baseSetup,
      customAnswers: ['自訂答案一', '自訂答案二'],
    })
    expect(pool.length).toBe(DRAW_BANK.length + 2)
    expect(pool.slice(-2).map((p) => p.answer)).toEqual(['自訂答案一', '自訂答案二'])
  })

  it('難度／分類篩選有效', () => {
    const pool = buildPool(DRAW_BANK, { ...baseSetup, levels: ['easy'] })
    expect(pool.length).toBeGreaterThan(0)
    expect(pool.every((p) => p.level === 'easy')).toBe(true)
  })

  it('篩選後無題目時回退全庫（不會空池）', () => {
    const pool = buildPool(DRAW_BANK, { ...baseSetup, levels: [], categories: ['不存在的分類'] })
    expect(pool.length).toBeGreaterThan(0)
  })

  it('座位 URL 往返（含自訂題目與分類）', () => {
    const setup: DrawSeatSetup = {
      secret: 'abc123def456gh',
      players: 6,
      rounds: 20,
      levels: ['easy', 'hard'],
      categories: ['食物', '動物'],
      customAnswers: ['测试畫家題'],
    }
    const url = buildSeatUrl(setup, 4)
    expect(url).toContain('/draw/card#')
    const link = parseSeatUrl(url.split('#')[1] ?? '')
    expect(link).not.toBeNull()
    expect(link!.players).toBe(6)
    expect(link!.seat).toBe(4)
    expect(link!.rounds).toBe(20)
    expect(link!.levels).toEqual(['easy', 'hard'])
    expect(link!.categories).toEqual(['食物', '動物'])
    expect(link!.customAnswers).toEqual(['测试畫家題'])
  })

  it('URL 長度在 QR 容量內', () => {
    const len = estimateUrlLength({ ...baseSetup, players: 8, rounds: 30 })
    expect(len).toBeLessThanOrEqual(MAX_URL_LENGTH)
  })

  it('派題確定性：同密鑰同座位同局 → 完全一致', () => {
    for (let r = 1; r <= 12; r++) {
      expect(resolveRound(baseSetup, r, DRAW_BANK.length)).toEqual(resolveRound(baseSetup, r, DRAW_BANK.length))
    }
  })

  it('畫家次序：每人輪到、不連續重複', () => {
    const rounds = previewRounds(baseSetup, DRAW_BANK.length)
    expect(rounds).toHaveLength(12)
    const seen = new Set(rounds.map((r) => r.artistSeat))
    expect(seen.size).toBeGreaterThan(1)
    for (let i = 1; i < rounds.length; i++) {
      expect(rounds[i].artistSeat).not.toBe(rounds[i - 1].artistSeat)
    }
    for (const r of rounds) {
      expect(r.artistSeat).toBeGreaterThanOrEqual(1)
      expect(r.artistSeat).toBeLessThanOrEqual(4)
      expect(r.questionIndex).toBeGreaterThanOrEqual(0)
      expect(r.questionIndex).toBeLessThan(DRAW_BANK.length)
    }
  })
})

/* ================= 誰是臥底：派卡 ================= */

describe('誰是臥底 — dealRound', () => {
  const base: GameSetup = {
    secret: 'uc-secret-001',
    players: 5,
    undercovers: 1,
    blanks: 0,
    categories: [],
    customPairs: [],
    onlyCustom: false,
    rounds: 10,
  }

  it('每局確定性：同密鑰同局完全一致（多台裝置同步）', () => {
    for (let r = 1; r <= 10; r++) {
      expect(dealRound(base, r)).toEqual(dealRound(base, r))
    }
  })

  it('角色數量正確：平民／臥底／白卡', () => {
    const res = dealRound(base, 1)
    const roles = res.seats.map((s) => s.role)
    expect(roles.filter((r) => r === 'undercover')).toHaveLength(1)
    expect(roles.filter((r) => r === 'civilian')).toHaveLength(4)

    const withBlank = dealRound({ ...base, blanks: 1 }, 2)
    const bRoles = withBlank.seats.map((s) => s.role)
    expect(bRoles.filter((r) => r === 'blank')).toHaveLength(1)
    expect(bRoles.filter((r) => r === 'civilian')).toHaveLength(3)
    expect(bRoles.filter((r) => r === 'undercover')).toHaveLength(1)
  })

  it('詞語：平民詞 ≠ 臥底詞；平民同詞；白卡空字串', () => {
    const res = dealRound(base, 1)
    expect(res.civilianWord).not.toBe(res.undercoverWord)
    const civilians = res.seats.filter((s) => s.role === 'civilian')
    expect(new Set(civilians.map((s) => s.word)).size).toBe(1)
    const under = res.seats.filter((s) => s.role === 'undercover')
    expect(under.every((s) => s.word === res.undercoverWord)).toBe(true)

    const blank = dealRound({ ...base, blanks: 1 }, 3)
    expect(blank.seats.filter((s) => s.role === 'blank').every((s) => s.word === '')).toBe(true)
  })

  it('發言順序 1..N 不重複', () => {
    const res = dealRound(base, 1)
    const orders = res.seats.map((s) => s.order).sort((a, b) => a - b)
    expect(orders).toEqual([1, 2, 3, 4, 5])
  })

  it('自訂詞對可用且 onlyCustom 時只用自訂', () => {
    const setup: GameSetup = {
      ...base,
      customPairs: [{ civilian: '自訂平民詞', undercover: '自訂臥底詞', category: '自訂' }],
      onlyCustom: true,
    }
    const res = dealRound(setup, 1)
    const words = new Set([res.civilianWord, res.undercoverWord])
    expect(words.has('自訂平民詞')).toBe(true)
    expect(words.has('自訂臥底詞')).toBe(true)
  })

  it('座位 URL 往返（含自訂詞對）', () => {
    const setup: GameSetup = {
      ...base,
      customPairs: [{ civilian: '平民甲', undercover: '臥底乙', category: '自訂' }],
    }
    const url = ucBuildSeatUrl(setup, 3)
    expect(url).toContain('/undercover/card#')
    const link = ucParseSeatUrl(url.split('#')[1] ?? '')
    expect(link).not.toBeNull()
    const back = seatLinkToSetup(link!)
    expect(back.players).toBe(5)
    expect(back.undercovers).toBe(1)
    expect(back.customPairs).toHaveLength(1)
    expect(back.customPairs[0]).toMatchObject({ civilian: '平民甲', undercover: '臥底乙' })
  })

  it('人數建議合理', () => {
    for (const players of [3, 4, 6, 8, 10, 12]) {
      const s = suggestCounts(players)
      expect(s.undercovers).toBeGreaterThanOrEqual(1)
      expect(s.blanks).toBeGreaterThanOrEqual(0)
      expect(s.undercovers + s.blanks).toBeLessThan(players)
    }
  })
})

/* ================= 金氏遊戲 / 像素猜謎 資料 ================= */

describe('金氏遊戲物品庫 & 像素猜謎題目包', () => {
  it('內建物品 ≥ 24 件且名稱唯一', () => {
    expect(DEFAULT_BUILT_IN_ITEMS.length).toBeGreaterThanOrEqual(24)
    const names = DEFAULT_BUILT_IN_ITEMS.map((i) => i.name)
    expect(new Set(names).size).toBe(names.length)
    for (const i of DEFAULT_BUILT_IN_ITEMS) {
      expect(i.emoji).toBeTruthy()
      expect(i.category).toBeTruthy()
    }
  })

  it('像素猜謎有三個內建題目包', () => {
    expect(DECK_PACKS).toHaveLength(3)
    for (const p of DECK_PACKS) {
      expect(p.count).toBeGreaterThanOrEqual(10)
      expect(p.name).toBeTruthy()
    }
  })

  it('臥底詞對完整（≥ 15 對，兩詞不同）', () => {
    expect(WORD_PAIRS.length).toBeGreaterThanOrEqual(15)
    for (const p of WORD_PAIRS) {
      expect(p.civilian).not.toBe(p.undercover)
      expect(p.civilian.trim().length).toBeGreaterThan(0)
      expect(p.category).toBeTruthy()
    }
  })
})
