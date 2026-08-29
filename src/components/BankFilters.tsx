/**
 * 題庫篩選器 — 難度與分類多選，共用於三個出題遊戲
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
    <div className="space-y-4">
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-medium muted">🎯 難度（可多選）</span>
          <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
            符合 {matching} 題
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {(['easy', 'medium', 'hard'] as QDifficulty[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => toggleLevel(l)}
              className={`chip ${levels.includes(l) ? 'chip-on' : ''}`}
            >
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${DIFFICULTY_META[l].dot}`} />
              {DIFFICULTY_META[l].label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-medium muted">📂 分類</span>
          <button
            type="button"
            onClick={() => onSelected(selected.length === 0 ? categories.map((c) => c.name) : [])}
            className="text-[11px] font-medium text-amber-300/80 transition hover:text-amber-200"
          >
            {selected.length === 0 ? '全選' : '清除'}
          </button>
        </div>
        <div className="flex max-h-36 flex-wrap gap-1.5 overflow-y-auto pr-1">
          {categories.map((c) => {
            const on = selected.length === 0 || selected.includes(c.name)
            return (
              <button
                key={c.name}
                type="button"
                onClick={() => toggleCat(c.name)}
                className={`chip !rounded-full !py-1 !text-[11px] ${
                  selected.includes(c.name) ? 'chip-on' : on ? '' : 'opacity-50'
                }`}
              >
                {c.name}
                <span className="text-[10px] opacity-70">{c.count}</span>
              </button>
            )
          })}
        </div>
        {selected.length === 0 && (
          <p className="mt-1.5 text-[10px] muted-2">未選擇 = 使用全部分類</p>
        )}
      </div>
    </div>
  )
}
