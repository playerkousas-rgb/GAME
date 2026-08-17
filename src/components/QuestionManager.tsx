/**
 * 自訂題目管理器 — 領袖可自行加入／刪除／批次匯入題目
 * Copyright (c) 2026 Scout System. All rights reserved.
 */
import { useMemo, useState } from 'react'
import { Plus, Trash2, Upload, Download, X, Search, ChevronDown } from 'lucide-react'
import {
  type BankId,
  type Question,
  type QDifficulty,
  DIFFICULTY_META,
  makeCustomId,
  parseBulk,
  exportBulk,
  listCategories,
} from '../shared/questionBank'

interface Props {
  bank: BankId
  builtIn: readonly Question[]
  custom: Question[]
  onChange: (next: Question[]) => void
  onClose?: () => void
}

export default function QuestionManager({ bank, builtIn, custom, onChange, onClose }: Props) {
  const isEmoji = bank === 'emoji'
  const [answer, setAnswer] = useState('')
  const [emoji, setEmoji] = useState('')
  const [category, setCategory] = useState('自訂')
  const [level, setLevel] = useState<QDifficulty>('medium')
  const [hint, setHint] = useState('')
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [query, setQuery] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  const categories = useMemo(() => listCategories([...builtIn, ...custom]), [builtIn, custom])

  const flash = (m: string) => {
    setMsg(m)
    setTimeout(() => setMsg(null), 2200)
  }

  const add = () => {
    const a = answer.trim()
    if (!a) return flash('請輸入答案')
    if (isEmoji && !emoji.trim()) return flash('請輸入 Emoji 題面')
    const q: Question = {
      id: makeCustomId(),
      answer: a,
      emoji: isEmoji ? emoji.trim() : undefined,
      category: category.trim() || '自訂',
      level,
      hint: hint.trim() || undefined,
      isCustom: true,
    }
    onChange([...custom, q])
    setAnswer('')
    setEmoji('')
    setHint('')
    flash(`已加入「${a}」`)
  }

  const remove = (id: string) => onChange(custom.filter((q) => q.id !== id))

  const importBulk = () => {
    const parsed = parseBulk(bulkText, bank)
    if (parsed.length === 0) return flash('未能解析任何題目')
    onChange([...custom, ...parsed])
    setBulkText('')
    setBulkOpen(false)
    flash(`成功匯入 ${parsed.length} 題`)
  }

  const doExport = () => {
    const text = exportBulk(custom, bank)
    if (!text) return flash('沒有自訂題目可匯出')
    navigator.clipboard?.writeText(text).then(
      () => flash('已複製到剪貼簿'),
      () => flash('複製失敗，請手動選取'),
    )
    setBulkText(text)
    setBulkOpen(true)
  }

  const filtered = query.trim()
    ? custom.filter(
        (q) =>
          q.answer.includes(query.trim()) ||
          q.category.includes(query.trim()) ||
          (q.emoji ?? '').includes(query.trim()),
      )
    : custom

  const placeholder = isEmoji
    ? '🐢 | 烏龜 | 動物 | 易\n🦁👑 | 獅子王 | 電影 | 中'
    : '帳篷 | 童軍裝備 | 易\n打繩結 | 童軍活動 | 中 | 用手示範'

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold">
          <span className="text-amber-400">✏️</span>
          自訂題目
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-normal text-white/50">
            {custom.length} 題
          </span>
        </h3>
        {onClose && (
          <button onClick={onClose} className="rounded-lg p-1 text-white/30 transition hover:bg-white/10 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* 新增表單 */}
      <div className="grid gap-2 md:grid-cols-2">
        {isEmoji && (
          <input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            placeholder="Emoji 題面（例：🦁👑）"
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-lg outline-none focus:border-amber-400/50"
          />
        )}
        <input
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder={isEmoji ? '答案（例：獅子王）' : '題目／答案（例：帳篷）'}
          className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-amber-400/50"
        />
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          list={`cats-${bank}`}
          placeholder="分類"
          className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-amber-400/50"
        />
        <datalist id={`cats-${bank}`}>
          {categories.map((c) => (
            <option key={c.name} value={c.name} />
          ))}
        </datalist>
        <input
          value={hint}
          onChange={(e) => setHint(e.target.value)}
          placeholder="提示（可選）"
          className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-amber-400/50"
        />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          {(['easy', 'medium', 'hard'] as QDifficulty[]).map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                level === l
                  ? 'border-amber-400/60 bg-amber-400/15 text-amber-200'
                  : 'border-white/10 bg-black/20 text-white/40 hover:text-white/70'
              }`}
            >
              {DIFFICULTY_META[l].label}
            </button>
          ))}
        </div>
        <button
          onClick={add}
          className="ml-auto flex items-center gap-1.5 rounded-lg bg-amber-400 px-4 py-1.5 text-xs font-bold text-stone-900 transition hover:bg-amber-300"
        >
          <Plus className="h-3.5 w-3.5" />
          加入題目
        </button>
      </div>

      {/* 批次工具 */}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={() => setBulkOpen((o) => !o)}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/20 px-3 py-1.5 text-[11px] text-white/60 transition hover:text-white"
        >
          <Upload className="h-3.5 w-3.5" />
          批次匯入
          <ChevronDown className={`h-3 w-3 transition ${bulkOpen ? 'rotate-180' : ''}`} />
        </button>
        <button
          onClick={doExport}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/20 px-3 py-1.5 text-[11px] text-white/60 transition hover:text-white"
        >
          <Download className="h-3.5 w-3.5" />
          匯出／複製
        </button>
        {custom.length > 0 && (
          <button
            onClick={() => {
              if (confirm(`確定清除全部 ${custom.length} 條自訂題目？`)) onChange([])
            }}
            className="flex items-center gap-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-[11px] text-rose-300 transition hover:bg-rose-500/20"
          >
            <Trash2 className="h-3.5 w-3.5" />
            全部清除
          </button>
        )}
      </div>

      {bulkOpen && (
        <div className="mt-2 rounded-xl border border-white/10 bg-black/30 p-3">
          <p className="mb-2 text-[11px] leading-relaxed text-white/40">
            每行一題，用 <code className="rounded bg-white/10 px-1 text-amber-300">|</code> 分隔。格式：
            <br />
            <code className="text-amber-300">
              {isEmoji ? 'Emoji | 答案 | 分類 | 難度 | 提示' : '答案 | 分類 | 難度 | 提示'}
            </code>
            （難度：易／中／難，可省略）
          </p>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={6}
            placeholder={placeholder}
            className="w-full resize-y rounded-lg border border-white/10 bg-black/40 p-2 font-mono text-xs outline-none focus:border-amber-400/50"
          />
          <button
            onClick={importBulk}
            className="mt-2 rounded-lg bg-emerald-500/20 px-4 py-1.5 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/30"
          >
            匯入
          </button>
        </div>
      )}

      {msg && (
        <div className="mt-2 rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-[11px] text-amber-200">
          {msg}
        </div>
      )}

      {/* 自訂題目清單 */}
      {custom.length > 0 && (
        <>
          <div className="mt-3 flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-white/25" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜尋自訂題目..."
              className="flex-1 rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-xs outline-none focus:border-amber-400/40"
            />
          </div>
          <div className="mt-2 max-h-52 space-y-1 overflow-y-auto pr-1">
            {filtered.map((q) => (
              <div
                key={q.id}
                className="flex items-center gap-2 rounded-lg bg-black/20 px-2.5 py-1.5 text-xs"
              >
                {q.emoji && <span className="text-base">{q.emoji}</span>}
                <span className="font-medium">{q.answer}</span>
                <span className="text-[10px] text-white/30">({q.category})</span>
                <span className={`text-[10px] ${DIFFICULTY_META[q.level].color}`}>
                  {DIFFICULTY_META[q.level].short}
                </span>
                <button
                  onClick={() => remove(q.id)}
                  className="ml-auto rounded p-1 text-white/20 transition hover:bg-rose-500/20 hover:text-rose-300"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="py-3 text-center text-[11px] text-white/25">沒有符合的題目</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
