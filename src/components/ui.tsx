/**
 * 共用 UI 套件 — 全站統一設計語言（頁頭、按鈕、選項、統計…）
 * Copyright (c) 2026 Scout System. All rights reserved.
 */
import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  Home, Sun, Moon, Volume2, VolumeX, Pause, Plus, Minus, Maximize2, Minimize2, ChevronDown,
} from 'lucide-react'
import { useTheme } from '../context/useTheme'
import { COPYRIGHT_UPPER } from '../shared/brand'

/* ---------- 圖示按鈕 ---------- */

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      className="icon-btn"
      aria-label="切換深淺色主題"
      title={theme === 'dark' ? '切換淺色主題' : '切換深色主題'}
    >
      {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  )
}

export function SoundToggle({ on, onToggle }: { on: boolean; onToggle: (v: boolean) => void }) {
  return (
    <button onClick={() => onToggle(!on)} className="icon-btn" aria-label="音效開關" title="音效開關">
      {on ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
    </button>
  )
}

/* ---------- 頁首（設定頁／各遊戲共用） ---------- */

export interface PageHeaderProps {
  emoji?: string
  title: string
  subtitle?: string
  /** 顯示返回主頁按鈕（預設顯示） */
  back?: boolean
  to?: string
  /** 自訂返回行為（優於 to） */
  onBack?: () => void
  /** 右側操作區（主題、音效…） */
  actions?: ReactNode
}

export function PageHeader({ emoji, title, subtitle, back = true, to = '/', onBack, actions }: PageHeaderProps) {
  return (
    <header className="ss-header">
      <div className="mx-auto flex max-w-5xl items-center gap-2 px-3 py-2.5 sm:gap-2.5">
        {back && (onBack ? (
          <button type="button" onClick={onBack} className="icon-btn shrink-0" aria-label="返回" title="返回">
            <Home className="h-5 w-5" />
          </button>
        ) : (
          <Link to={to} className="icon-btn shrink-0" aria-label="返回遊戲中心" title="返回遊戲中心">
            <Home className="h-5 w-5" />
          </Link>
        ))}
        {emoji && <span className="shrink-0 text-2xl leading-none">{emoji}</span>}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-bold leading-tight">{title}</h1>
          {subtitle && <p className="truncate text-[10px] muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">{actions}</div>}
      </div>
    </header>
  )
}

/* ---------- 遊戲進行中頁首（draw／act／emoji 共用） ---------- */

export interface PlayHeaderProps {
  emoji: string
  progress: string
  score?: number
  meta?: ReactNode
  /** 額外右側按鈕（遮蔽、顯示/隱藏題目…） */
  extra?: ReactNode
  onPause: () => void
  full: boolean
  onToggleFull: () => void
  /** 顯示 ±10 秒按鈕 */
  timed?: boolean
  onTimeMinus?: () => void
  onTimePlus?: () => void
}

export function PlayHeader({
  emoji, progress, score, meta, extra, onPause, full, onToggleFull, timed, onTimeMinus, onTimePlus,
}: PlayHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[var(--ss-header-bg)] backdrop-blur">
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="shrink-0 text-xl leading-none">{emoji}</span>
        <span className="shrink-0 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-bold tabular-nums">{progress}</span>
        {score !== undefined && (
          <span className="shrink-0 rounded-lg bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-300 tabular-nums">
            ✓ {score}
          </span>
        )}
        {meta && <span className="hidden min-w-0 truncate text-[11px] sm:inline">{meta}</span>}
        <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
          {extra}
          <button onClick={onPause} className="icon-btn" title="暫停 (P)" aria-label="暫停">
            <Pause className="h-4 w-4" />
          </button>
          {timed && (
            <>
              <button onClick={onTimeMinus} className="icon-btn" title="減 10 秒" aria-label="減 10 秒">
                <Minus className="h-4 w-4" />
              </button>
              <button onClick={onTimePlus} className="icon-btn" title="加 10 秒" aria-label="加 10 秒">
                <Plus className="h-4 w-4" />
              </button>
            </>
          )}
          <button onClick={onToggleFull} className="icon-btn" title={full ? '退出全屏' : '全屏 (F)'} aria-label="全屏">
            {full ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  )
}

/* ---------- 選項組（時間／題數／模式…） ---------- */

export interface OptionItem<T> {
  value: T
  label: ReactNode
}

export function OptionGroup<T extends string | number>({
  label, options, value, onChange, cols = 4, large = false,
}: {
  label: ReactNode
  options: OptionItem<T>[]
  value: T
  onChange: (v: T) => void
  cols?: number
  /** 大按鈕（如玩家人數、局數） */
  large?: boolean
}) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-medium muted">{label}</div>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            onClick={() => onChange(o.value)}
            className={`chip ${large ? 'chip-lg' : ''} ${value === o.value ? 'chip-on' : ''}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ---------- 步驟加減器 ---------- */

export function Stepper({
  value, min, max, onChange, suffix,
}: {
  value: number
  min: number
  max: number
  onChange: (v: number) => void
  suffix: string
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="icon-btn h-12 w-12 !rounded-xl border border-white/15 bg-white/10 !text-2xl font-black"
        aria-label="減少"
      >
        −
      </button>
      <div className="flex-1 rounded-xl border border-amber-400/30 bg-amber-400/10 py-2.5 text-center">
        <div className="text-2xl font-black text-amber-300 tabular-nums">{value}</div>
        <div className="text-[10px] text-amber-100/85">{suffix}</div>
      </div>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="icon-btn h-12 w-12 !rounded-xl border border-white/15 bg-white/10 !text-2xl font-black"
        aria-label="增加"
      >
        +
      </button>
    </div>
  )
}

/* ---------- 統計磚 ---------- */

const STAT_TONES = {
  default: '',
  emerald: 'text-emerald-300',
  amber: 'text-amber-300',
  rose: 'text-rose-300',
  indigo: 'text-indigo-300',
  fuchsia: 'text-fuchsia-300',
} as const

export function StatBox({
  label, value, tone = 'default',
}: {
  label: string
  value: ReactNode
  tone?: keyof typeof STAT_TONES
}) {
  return (
    <div className="stat">
      <div className={`stat-value ${STAT_TONES[tone]}`}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

/* ---------- 區塊卡片（icon + 標題 + 說明） ---------- */

export function Section({
  icon, title, hint, right, children, className = '',
}: {
  icon?: ReactNode
  title: ReactNode
  hint?: ReactNode
  right?: ReactNode
  children?: ReactNode
  className?: string
}) {
  return (
    <div className={`card-lg ${className}`}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="section-title">
            {icon && <span className="accent-text shrink-0">{icon}</span>}
            <span className="min-w-0">{title}</span>
          </h3>
          {hint && <p className="mt-0.5 text-[11px] leading-relaxed muted-2">{hint}</p>}
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
      {children}
    </div>
  )
}

/* ---------- 可折疊區塊 ---------- */

export function Collapsible({
  title, children, defaultOpen = true,
}: {
  title: ReactNode
  children: ReactNode
  defaultOpen?: boolean
}) {
  return (
    <details open={defaultOpen} className="card-lg group">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
        <h3 className="section-title">{title}</h3>
        <ChevronDown className="h-4 w-4 shrink-0 muted transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  )
}

/* ---------- 開始按鈕（支援底部吸附） ---------- */

export function StartButton({
  onClick, disabled, children, sticky = false, className = '',
}: {
  onClick: () => void
  disabled?: boolean
  children: ReactNode
  sticky?: boolean
  className?: string
}) {
  const btn = (
    <button type="button" onClick={onClick} disabled={disabled} className={`btn-primary w-full ${className}`}>
      {children}
    </button>
  )
  if (!sticky) return btn
  return <div className="ss-sticky-cta -mx-4 px-4">{btn}</div>
}

/* ---------- 版權水印 ---------- */

export function CopyrightMark() {
  return (
    <div className="pointer-events-none fixed bottom-1 right-2 z-10 text-[10px] muted-2 opacity-50 select-none">
      {COPYRIGHT_UPPER}
    </div>
  )
}

/* ---------- 整頁外殼 ---------- */

export function GameShell({ children, withMark = true }: { children: ReactNode; withMark?: boolean }) {
  return (
    <div className="ss-page">
      {children}
      {withMark && <CopyrightMark />}
    </div>
  )
}
