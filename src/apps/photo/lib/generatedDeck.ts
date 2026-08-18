/**
 * 內建圖片題目包 — 用 Canvas 即時生成題目圖，毋須上傳相片即可開玩
 * Copyright (c) 2026 Scout System. All rights reserved.
 */
import { DRAW_BANK } from '../../../data/drawBank'
import { EMOJI_BANK } from '../../../data/emojiBank'
import { shuffle, type Question } from '../../../shared/questionBank'

export interface DeckPack {
  id: string
  name: string
  emoji: string
  desc: string
  count: number
}

export const DECK_PACKS: DeckPack[] = [
  { id: 'emoji', name: 'Emoji 大圖', emoji: '🧩', desc: '大 Emoji 圖案，像素化後更難認', count: EMOJI_BANK.length },
  { id: 'word', name: '文字卡', emoji: '🔤', desc: '大字題目卡，適合文字辨認', count: DRAW_BANK.length },
  { id: 'shape', name: '色塊圖形', emoji: '🎯', desc: '幾何色塊組合，純視覺挑戰', count: 40 },
]

const BG_COLORS = [
  '#1e3a5f', '#7f1d1d', '#064e3b', '#4c1d95', '#0c4a6e',
  '#78350f', '#831843', '#134e4a', '#3730a3', '#111827',
]
const FG_COLORS = ['#ffffff', '#fbbf24', '#34d399', '#60a5fa', '#f472b6', '#fb923c', '#a78bfa']

function canvasToFile(cv: HTMLCanvasElement, name: string): Promise<File> {
  return new Promise((resolve) => {
    cv.toBlob((blob) => {
      resolve(new File([blob ?? new Blob()], `${name}.png`, { type: 'image/png' }))
    }, 'image/png')
  })
}

function newCanvas(w = 1280, h = 720) {
  const cv = document.createElement('canvas')
  cv.width = w
  cv.height = h
  return cv
}

/** Emoji 大圖 */
async function makeEmojiCard(q: Question, i: number): Promise<File> {
  const cv = newCanvas()
  const ctx = cv.getContext('2d')!
  ctx.fillStyle = BG_COLORS[i % BG_COLORS.length]
  ctx.fillRect(0, 0, cv.width, cv.height)
  const chars = [...(q.emoji ?? '❓')]
  const size = chars.length <= 2 ? 380 : chars.length <= 4 ? 250 : 170
  ctx.font = `${size}px "Apple Color Emoji","Noto Color Emoji","Segoe UI Emoji",sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(chars.join(''), cv.width / 2, cv.height / 2)
  return canvasToFile(cv, q.answer)
}

/** 文字卡 */
async function makeWordCard(q: Question, i: number): Promise<File> {
  const cv = newCanvas()
  const ctx = cv.getContext('2d')!
  ctx.fillStyle = BG_COLORS[i % BG_COLORS.length]
  ctx.fillRect(0, 0, cv.width, cv.height)
  const len = q.answer.length
  const size = len <= 2 ? 340 : len <= 4 ? 230 : len <= 6 ? 160 : 120
  ctx.fillStyle = FG_COLORS[i % FG_COLORS.length]
  ctx.font = `900 ${size}px "Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(q.answer, cv.width / 2, cv.height / 2)
  return canvasToFile(cv, q.answer)
}

/** 隨機色塊圖形 */
async function makeShapeCard(i: number): Promise<File> {
  const cv = newCanvas()
  const ctx = cv.getContext('2d')!
  ctx.fillStyle = BG_COLORS[i % BG_COLORS.length]
  ctx.fillRect(0, 0, cv.width, cv.height)
  const n = 3 + Math.floor(Math.random() * 5)
  for (let k = 0; k < n; k++) {
    ctx.fillStyle = FG_COLORS[Math.floor(Math.random() * FG_COLORS.length)]
    ctx.globalAlpha = 0.55 + Math.random() * 0.45
    const x = Math.random() * cv.width
    const y = Math.random() * cv.height
    const r = 80 + Math.random() * 220
    const kind = Math.floor(Math.random() * 3)
    ctx.beginPath()
    if (kind === 0) ctx.arc(x, y, r / 2, 0, Math.PI * 2)
    else if (kind === 1) ctx.rect(x - r / 2, y - r / 2, r, r)
    else {
      ctx.moveTo(x, y - r / 2)
      ctx.lineTo(x + r / 2, y + r / 2)
      ctx.lineTo(x - r / 2, y + r / 2)
      ctx.closePath()
    }
    ctx.fill()
  }
  ctx.globalAlpha = 1
  return canvasToFile(cv, `圖形-${i + 1}`)
}

/** 產生一副題目圖 */
export async function generateDeck(packId: string, count: number): Promise<File[]> {
  if (packId === 'shape') {
    return Promise.all(Array.from({ length: count }, (_, i) => makeShapeCard(i)))
  }
  const pool = packId === 'emoji' ? EMOJI_BANK : DRAW_BANK
  const picked = shuffle(pool).slice(0, count)
  const maker = packId === 'emoji' ? makeEmojiCard : makeWordCard
  return Promise.all(picked.map((q, i) => maker(q, i)))
}
