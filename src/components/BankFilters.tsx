/**
 * 題庫篩選器 — 難度與分類多選，共用於三個新遊戲
 * Copyright (c) 2026 Scout System. All rights reserved.
 */
import { type QDifficulty, DIFFICULTY_META } from '../shared/questionBank'

interface Props {
  levels: QDifficulty[]
  onLevels: (l: QDifficulty[]) => void
  categories: { name: string; count: number }[]
  selected: string[]
  onSelected: (c: string[]) => void
  matching: number
}

export default function BankFilters({
  levels,
  onLevels,
  categories,
  selected,
  onSelected,
  matching,
}: Props) {
  const toggleLevel = (l: QDifficulty) =>
    onLevels(levels.includes(l) ? levels.filter((x) => x !== l) : [...levels, l])

  const toggleCat = (c: string) =>
    onSelected(selected.includes(c) ? selected.filter((x) => x !== c) : [...selected, c])

  return (
    <div className="space-y-3">
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-xs font-medium text-white/75">🎯 難度（可多選）</label>
          <span className="text-[10px] text-white/75">符合 {matching} 題</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {(['easy', 'medium', 'hard'] as QDifficulty[]).map((l) => (
            <button
              key={l}
              onClick={() => toggleLevel(l)}
              className={`rounded-lg border px-2 py-2 text-xs font-medium transition ${
                levels.includes(l)
                  ? 'border-amber-400/60 bg-amber-400/15 text-amber-200'
                  : 'border-white/10 bg-black/20 text-white/75 hover:text-white/75'
              }`}
            >
              <span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${DIFFICULTY_META[l].dot}`} />
              {DIFFICULTY_META[l].label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-xs font-medium text-white/75">📂 分類</label>
          <button
            onClick={() => onSelected(selected.length === 0 ? categories.map((c) => c.name) : [])}
            className="text-[10px] text-amber-300/70 transition hover:text-amber-200"
          >
            {selected.length === 0 ? '全選' : '清除'}
          </button>
        </div>
        <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto pr-1">
          {categories.map((c) => {
            const on = selected.length === 0 || selected.includes(c.name)
            return (
              <button
                key={c.name}
                onClick={() => toggleCat(c.name)}
                className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
                  selected.includes(c.name)
                    ? 'border-amber-400/60 bg-amber-400/15 text-amber-200'
                    : on
                      ? 'border-white/10 bg-white/5 text-white/75 hover:text-white/80'
                      : 'border-white/5 bg-black/20 text-white/75'
                }`}
              >
                {c.name}
                <span className="ml-1 text-[10px] opacity-70">{c.count}</span>
              </button>
            )
          })}
        </div>
        {selected.length === 0 && (
          <p className="mt-1 text-[10px] text-white/75">未選擇 = 使用全部分類</p>
        )}
      </div>
    </div>
  )
}
