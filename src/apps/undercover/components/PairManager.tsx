/**
 * 誰是臥底 — 領袖自訂詞語對管理
 * Copyright (c) 2026 Scout System. All rights reserved.
 */
import { useState } from 'react'
import { Plus, Trash2, Upload, X } from 'lucide-react'
import type { WordPair } from '../data/wordPairs'

type Props = {
  pairs: WordPair[]
  onChange: (p: WordPair[]) => void
  onlyCustom: boolean
  onOnlyCustom: (v: boolean) => void
}

function makeId() {
  return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`
}

export default function PairManager({ pairs, onChange, onlyCustom, onOnlyCustom }: Props) {
  const [civ, setCiv] = useState('')
  const [und, setUnd] = useState('')
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulk, setBulk] = useState('')
  const [err, setErr] = useState('')

  const add = () => {
    const a = civ.trim()
    const b = und.trim()
    if (!a || !b) {
      setErr('兩個詞都要填')
      return
    }
    if (a === b) {
      setErr('兩個詞不可相同，否則冇人分得出臥底')
      return
    }
    setErr('')
    onChange([...pairs, { id: makeId(), civilian: a, undercover: b, category: '自訂' }])
    setCiv('')
    setUnd('')
  }

  const importBulk = () => {
    const lines = bulk
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
    const added: WordPair[] = []
    lines.forEach((line) => {
      const parts = line.split(/[|,，\t]/).map((x) => x.trim())
      if (parts.length >= 2 && parts[0] && parts[1] && parts[0] !== parts[1]) {
        added.push({ id: makeId() + added.length, civilian: parts[0], undercover: parts[1], category: '自訂' })
      }
    })
    if (!added.length) {
      setErr('無法解析，請每行寫「平民詞 | 臥底詞」')
      return
    }
    setErr('')
    onChange([...pairs, ...added])
    setBulk('')
    setBulkOpen(false)
  }

  return (
    <div className="space-y-3">
      {/* 逐對新增 */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-[11px] font-medium text-emerald-200">平民詞</label>
          <input
            value={civ}
            onChange={(e) => setCiv(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="例：菠蘿包"
            className="w-full rounded-lg border border-emerald-400/40 bg-black/20 px-3 py-2.5 text-white placeholder:text-white/40"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-rose-200">臥底詞</label>
          <input
            value={und}
            onChange={(e) => setUnd(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="例：雞尾包"
            className="w-full rounded-lg border border-rose-400/40 bg-black/20 px-3 py-2.5 text-white placeholder:text-white/40"
          />
        </div>
      </div>

      {err && <div className="rounded-lg bg-rose-500/20 px-3 py-2 text-[11px] text-rose-100">{err}</div>}

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={add}
          className="rounded-xl bg-amber-400 py-3 text-sm font-bold text-stone-900 active:scale-95"
        >
          <Plus size={15} className="mr-1 inline" /> 加入這一對
        </button>
        <button
          onClick={() => setBulkOpen((v) => !v)}
          className="rounded-xl border border-white/20 bg-white/10 py-3 text-sm font-bold text-white active:scale-95"
        >
          <Upload size={15} className="mr-1 inline" /> 批次匯入
        </button>
      </div>

      {bulkOpen && (
        <div className="rounded-xl border border-white/15 bg-black/20 p-3">
          <div className="mb-1.5 text-[11px] text-white/75">
            每行一對，用 <code className="rounded bg-black/40 px-1 text-amber-200">|</code> 分隔：
            <br />
            <span className="text-white/60">菠蘿包 | 雞尾包</span>
          </div>
          <textarea
            value={bulk}
            onChange={(e) => setBulk(e.target.value)}
            rows={5}
            placeholder={'菠蘿包 | 雞尾包\n奶茶 | 咖啡\n帳篷 | 天幕'}
            className="w-full rounded-lg border border-white/20 bg-[#02133e] p-2.5 text-white placeholder:text-white/35"
          />
          <button
            onClick={importBulk}
            className="mt-2 w-full rounded-lg bg-amber-400 py-2.5 text-sm font-bold text-stone-900"
          >
            匯入
          </button>
        </div>
      )}

      {/* 清單 */}
      {pairs.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/80">
              自訂 <b className="text-amber-300">{pairs.length}</b> 對
            </span>
            <button onClick={() => onChange([])} className="text-[11px] text-rose-300 underline">
              全部清除
            </button>
          </div>
          <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
            {pairs.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2"
              >
                <span className="flex-1 truncate text-sm text-emerald-200">{p.civilian}</span>
                <span className="text-white/40">↔</span>
                <span className="flex-1 truncate text-sm text-rose-200">{p.undercover}</span>
                <button
                  onClick={() => onChange(pairs.filter((x) => x.id !== p.id))}
                  className="rounded-md p-1 text-rose-300 hover:bg-rose-500/20"
                  aria-label="刪除"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3">
            <input
              type="checkbox"
              checked={onlyCustom}
              onChange={(e) => onOnlyCustom(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 accent-amber-400"
            />
            <span className="text-xs text-amber-100">
              <b>只用自訂詞語</b>
              <br />
              <span className="text-amber-100/75">
                剔選後本局只會抽自訂嘅 {pairs.length} 對；唔剔就會同內建題庫一齊隨機。
              </span>
            </span>
          </label>
        </>
      )}

      {pairs.length === 0 && !bulkOpen && (
        <div className="rounded-xl border border-white/10 bg-black/25 p-3 text-center text-[11px] leading-relaxed text-white/70">
          <X size={14} className="mb-1 inline text-white/50" />
          <br />
          未有自訂詞語，本局會使用內建題庫。
          <br />
          自訂詞語會一併寫入 QR Code，玩家掃咗即用。
        </div>
      )}
    </div>
  )
}
