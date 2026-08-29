/**
 * 主頁 — 遊戲中心（Hub）
 * Copyright (c) 2026 Scout System. All rights reserved.
 */
import { Link } from 'react-router-dom'
import { ChevronRight, Users, Clock, Monitor, Sparkles } from 'lucide-react'
import { BRAND } from '../shared/brand'
import { DRAW_BANK } from '../data/drawBank'
import { ACT_BANK } from '../data/actBank'
import { EMOJI_BANK } from '../data/emojiBank'
import Footer from './Footer'
import { ThemeToggle } from './ui'

type GameCard = {
  to: string
  emoji: string
  title: string
  subtitle: string
  desc: string
  tags: string[]
  bank?: number
  tile: string
}

const TOTAL_QUESTIONS = DRAW_BANK.length + ACT_BANK.length + EMOJI_BANK.length

const GAMES: GameCard[] = [
  {
    to: '/draw',
    emoji: '🎨',
    title: '猜猜畫畫',
    subtitle: 'Draw & Guess',
    desc: '一人看題作畫，隊友限時搶答。內建繪圖板，另有「秘密派題」模式，題目直接送到畫家手機。',
    tags: ['繪畫', '手機出題', '限時'],
    bank: DRAW_BANK.length,
    tile: 'bg-emerald-500/15',
  },
  {
    to: '/act',
    emoji: '📺',
    title: '大電視',
    subtitle: 'Act & Guess',
    desc: '超大字投影出題，演員背向螢幕用身體動作演繹。自動計時、計分、跳過與結算。',
    tags: ['肢體演繹', '大螢幕', '氣氛爆燈'],
    bank: ACT_BANK.length,
    tile: 'bg-rose-500/15',
  },
  {
    to: '/emoji',
    emoji: '🧩',
    title: 'EMOJI 猜謎',
    subtitle: 'Emoji Puzzle',
    desc: '用 Emoji 組合表達詞語、電影、成語與香港地標。支援打字自動判分或投影搶答。',
    tags: ['腦筋急轉彎', '成語電影', '自動判分'],
    bank: EMOJI_BANK.length,
    tile: 'bg-fuchsia-500/15',
  },
  {
    to: '/kims',
    emoji: '👁️',
    title: '童軍金氏遊戲',
    subtitle: "Scout Kim's Games",
    desc: '視覺、聽覺、圖案、配對四合一的觀察與記憶訓練，內建物品庫與小隊積分榜。',
    tags: ['觀察力', '記憶力', '小隊比拼'],
    tile: 'bg-amber-500/15',
  },
  {
    to: '/photo',
    emoji: '🖼️',
    title: '像素化猜謎圖',
    subtitle: 'Photo Guessing Game',
    desc: '上傳相片或一鍵生成題目圖，以像素化、局部放大、變形、切割四種方式出題搶答。',
    tags: ['搶答', '投影專用', '自訂圖片'],
    tile: 'bg-indigo-500/15',
  },
  {
    to: '/undercover',
    emoji: '🕵️',
    title: '誰是臥底',
    subtitle: 'Who Is The Undercover',
    desc: '設定人數即產生每人專屬 QR，掃一次派牌到手機。每局即場抽新代碼，角色真隨機。',
    tags: ['手機派牌', '真隨機', '可自訂題目'],
    tile: 'bg-slate-400/15',
  },
]

const FEATURES = [
  { icon: <Monitor className="h-3.5 w-3.5" />, label: '投影友好' },
  { icon: <Users className="h-3.5 w-3.5" />, label: '小隊計分' },
  { icon: <Clock className="h-3.5 w-3.5" />, label: '彈性限時' },
  { icon: <Sparkles className="h-3.5 w-3.5" />, label: '自訂題目' },
]

export default function Home() {
  return (
    <div className="ss-page flex flex-col">
      {/* 頂部導覽列 */}
      <header className="ss-header">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-400 text-lg font-black text-stone-900">⚜</span>
            <div>
              <div className="text-sm font-black leading-tight">{BRAND.name}</div>
              <div className="text-[10px] muted leading-tight">{BRAND.nameZh}</div>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* HERO */}
      <div className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 pb-8 pt-10 text-center sm:pt-14">
          <h1 className="text-2xl font-black tracking-tight sm:text-4xl">{BRAND.nameZh}</h1>
          <p className="mt-2 text-sm muted sm:text-base">{BRAND.tagline}</p>
          <p className="mt-4 inline-block rounded-full border border-amber-400/25 bg-amber-400/10 px-4 py-1.5 text-xs font-medium text-amber-200">
            🎲 6 個遊戲 · 內建 {TOTAL_QUESTIONS}+ 條題目 · 支援自訂題庫
          </p>
          <div className="no-scrollbar mt-5 flex items-center justify-start gap-2 overflow-x-auto sm:justify-center">
            {FEATURES.map((f) => (
              <div
                key={f.label}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs muted"
              >
                <span className="text-amber-400">{f.icon}</span>
                {f.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* GAME CARDS */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold muted">
          <span className="text-base">🎮</span> 選擇遊戲
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {GAMES.map((g) => (
            <Link
              key={g.to}
              to={g.to}
              className="card group flex items-start gap-3.5 p-4 transition hover:border-white/25 hover:bg-white/[0.07] active:scale-[0.99]"
            >
              <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl text-2xl ${g.tile}`}>
                {g.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="min-w-0 truncate text-base font-black">{g.title}</h3>
                  {g.bank && (
                    <span className="ml-auto shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold muted">
                      {g.bank} 題
                    </span>
                  )}
                </div>
                <p className="text-[10px] uppercase tracking-wider muted-2">{g.subtitle}</p>
                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed muted">{g.desc}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {g.tags.map((t) => (
                    <span key={t} className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[10px] muted">
                      {t}
                    </span>
                  ))}
                  <ChevronRight className="ml-auto h-4 w-4 muted-2 transition group-hover:translate-x-0.5 group-hover:text-amber-300" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* INFO */}
        <div className="mt-6 card p-4">
          <h3 className="mb-1.5 text-sm font-semibold">📋 更多集會小遊戲建議</h3>
          <p className="text-xs leading-relaxed muted">
            倉庫內附有 <code className="rounded bg-black/30 px-1.5 py-0.5 text-amber-300">docs/集會小遊戲建議.md</code>
            ，收錄 22 個適合旅團集會的破冰、團隊合作、技能訓練及室內外遊戲，含人數、時間、器材與玩法說明。
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}
