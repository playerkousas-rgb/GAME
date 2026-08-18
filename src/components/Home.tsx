/**
 * 主頁 — 遊戲中心（Hub）
 * Copyright (c) 2026 Scout System. All rights reserved.
 */
import { Link } from 'react-router-dom'
import { ArrowRight, Users, Clock, Monitor, Sparkles } from 'lucide-react'
import { BRAND } from '../shared/brand'
import { DRAW_BANK } from '../data/drawBank'
import { ACT_BANK } from '../data/actBank'
import { EMOJI_BANK } from '../data/emojiBank'
import Footer from './Footer'

type GameCard = {
  to: string
  emoji: string
  title: string
  subtitle: string
  desc: string
  tags: string[]
  bank?: number
  accent: string
}

const TOTAL_QUESTIONS = DRAW_BANK.length + ACT_BANK.length + EMOJI_BANK.length

const GAMES: GameCard[] = [
  {
    to: '/kims',
    emoji: '👁️',
    title: '童軍金氏遊戲',
    subtitle: "Scout Kim's Games",
    desc: '視覺、聽覺、文字、配對四合一的觀察與記憶訓練，內建物品庫、小隊積分榜與比賽模式。',
    tags: ['觀察力', '記憶力', '小隊比拼'],
    accent: 'from-amber-500/20 to-amber-700/5 border-amber-500/30 hover:border-amber-400/60',
  },
  {
    to: '/photo',
    emoji: '🖼️',
    title: '像素化猜謎圖',
    subtitle: 'Photo Guessing Game',
    desc: '上傳相片後以像素化、局部放大、變形扭曲、切割打亂四種方式出題，逐級降低難度讓成員搶答。',
    tags: ['搶答', '投影專用', '自訂圖片'],
    accent: 'from-indigo-500/20 to-indigo-700/5 border-indigo-500/30 hover:border-indigo-400/60',
  },
  {
    to: '/draw',
    emoji: '🎨',
    title: '猜猜畫畫',
    subtitle: 'Draw & Guess',
    desc: '一人看題作畫，隊友限時搶答。內建繪圖板（多色、粗幼、橡皮、復原）。另有「秘密派題」模式，題目直接送到畫家手機，防止偷望。',
    tags: ['繪畫', '手機出題', '限時'],
    bank: DRAW_BANK.length,
    accent: 'from-emerald-500/20 to-emerald-700/5 border-emerald-500/30 hover:border-emerald-400/60',
  },
  {
    to: '/act',
    emoji: '📺',
    title: '大電視',
    subtitle: 'Act & Guess',
    desc: '超大字投影出題，演員背向螢幕用身體動作演繹，隊友猜。自動計時、計分、跳過與結算。',
    tags: ['肢體演繹', '大螢幕', '氣氛爆燈'],
    bank: ACT_BANK.length,
    accent: 'from-rose-500/20 to-rose-700/5 border-rose-500/30 hover:border-rose-400/60',
  },
  {
    to: '/emoji',
    emoji: '🧩',
    title: 'EMOJI 猜謎',
    subtitle: 'Emoji Puzzle',
    desc: '用 Emoji 組合表達詞語、電影、成語與香港地標。支援打字自動判分或投影搶答兩種模式。',
    tags: ['腦筋急轉彎', '輸入/投影', '成語電影'],
    bank: EMOJI_BANK.length,
    accent: 'from-fuchsia-500/20 to-fuchsia-700/5 border-fuchsia-500/30 hover:border-fuchsia-400/60',
  },
  {
    to: '/undercover',
    emoji: '🕵️',
    title: '誰是臥底',
    subtitle: 'Who Is The Undercover',
    desc: '領袖設定人數即產生每人專屬 QR，掃一次派牌到手機。每局即場抽新代碼，角色真隨機無跡可尋；平民詞／臥底詞可自訂。',
    tags: ['手機派牌', '真隨機', '可自訂題目'],
    accent: 'from-slate-400/20 to-slate-700/5 border-slate-300/30 hover:border-amber-400/60',
  },
]

const FEATURES = [
  { icon: <Monitor className="h-4 w-4" />, label: '投影友好', desc: '全屏模式，字體自動放大' },
  { icon: <Users className="h-4 w-4" />, label: '小隊計分', desc: '自訂隊伍，輪流出戰計分' },
  { icon: <Clock className="h-4 w-4" />, label: '彈性限時', desc: '自由設定每題時間與題數' },
  { icon: <Sparkles className="h-4 w-4" />, label: '自訂題目', desc: '領袖可加題、批次匯入' },
]

export default function Home() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#02133e] text-white">
      {/* HERO */}
      <div className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 py-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400 text-3xl shadow-lg shadow-amber-500/20">
            ⚜
          </div>
          <h1 className="text-3xl font-black tracking-tight md:text-5xl">{BRAND.name}</h1>
          <p className="mt-2 text-base text-white/75 md:text-lg">
            {BRAND.nameZh} · {BRAND.tagline}
          </p>
          <p className="mt-3 inline-block rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-1.5 text-xs text-amber-200">
            🎲 6 個遊戲 · 內建 {TOTAL_QUESTIONS}+ 條題目 · 支援自訂題庫
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {FEATURES.map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/75"
              >
                <span className="text-amber-400">{f.icon}</span>
                {f.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* GAME CARDS */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white/80">
          <span className="text-amber-400">🎮</span> 選擇遊戲
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {GAMES.map((g) => (
            <Link
              key={g.to}
              to={g.to}
              className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 shadow-lg shadow-black/20 transition-all hover:scale-[1.02] ${g.accent}`}
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="text-4xl">{g.emoji}</div>
                <ArrowRight className="h-5 w-5 text-white/75 transition group-hover:translate-x-1 group-hover:text-white/70" />
              </div>
              <h3 className="text-lg font-black">{g.title}</h3>
              <p className="mt-0.5 text-[10px] uppercase tracking-wider text-white/75">{g.subtitle}</p>
              <p className="mt-2.5 text-xs leading-relaxed text-white/75">{g.desc}</p>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {g.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[10px] text-white/75"
                  >
                    {t}
                  </span>
                ))}
                {g.bank && (
                  <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/75">
                    {g.bank} 題
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* INFO */}
        <div className="mt-8 grid gap-3 md:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="mb-1.5 flex items-center gap-2 text-sm font-semibold">
                <span className="text-amber-400">{f.icon}</span>
                {f.label}
              </div>
              <p className="text-xs text-white/70">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="mb-2 text-sm font-semibold">📋 更多集會小遊戲建議</h3>
          <p className="text-xs leading-relaxed text-white/75">
            倉庫內附有 <code className="rounded bg-black/30 px-1.5 py-0.5 text-amber-300">docs/集會小遊戲建議.md</code>
            ，收錄 22 個適合旅團集會的破冰、團隊合作、技能訓練及室內外遊戲，含人數、時間、器材與玩法說明。
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}
