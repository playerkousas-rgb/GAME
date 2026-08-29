import { useState, useMemo } from 'react'
import { Plus, Trash2, Search, RotateCcw, Upload } from 'lucide-react'
import { Item, Difficulty } from '../types'
import { DEFAULT_BUILT_IN_ITEMS } from '../data/items'

interface Props {
  items: Item[]
  onItemsChange: (items: Item[]) => void
  onUploadImage: (files: FileList | null) => void
}

const ALL_EMOJIS = [...new Set([...'📦🎒🔦🧭🗺️📯🪢⛺🔥🔪🩹🧤🥾📻🏮📦🎒🔦🧭🗺️📯🪢⛺🔥🔪🩹🧤🥾📻🏮🐶🐱🐭🐹🐰🦊🐻🐼🐨🐯🦁🐮🐷🐸🐵🐔🐧🐦🐤🦆🦅🦉🦇🐺🐗🐴🦄🐝🐛🦋🐌🐞🐜🦟🦗🐢🐍🦎🦖🦕🐙🦑🦐🦀🐡🐠🐟🐬🐳🐋🦈🐊🐅🦣🐘🦏🦒🦘🐂🐄🐪🐫🦙🦥🦨🦔🐿️🦫🐇🐁🐀🐈🐕🦮🐩🐕‍🦺🐾🐒🦧🦍🦌🐕🐩🐈🐓🦃🦤🦚🦜🦢🦩🕊️🐇🦝🦡🦦🦥🐄🐖🐏🐑🐐🦌🐕🐈'])]

const CATEGORIES = ['求生', '定向', '安全', '夜間', '裝備', '補給', '制服', '記錄', '榮譽', '時間', '服裝', '衛生', '炊事', '露營', '觀察', '通訊', '防護', '天候', '生火', '繩結', '工具', '求救', '醫療', '動物', '自訂']

const LEVELS: { id: Difficulty; label: string }[] = [
  { id: 'easy', label: '初級' },
  { id: 'medium', label: '中級' },
  { id: 'hard', label: '高級' },
]

export default function ItemManager({ items, onItemsChange, onUploadImage }: Props) {
  const [search, setSearch] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmoji, setNewEmoji] = useState('📦')
  const [newCategory, setNewCategory] = useState('自訂')
  const [newLevel, setNewLevel] = useState<Difficulty>('easy')
  const [deletedIds, setDeletedIds] = useState<string[]>([])

  // Filter items based on search
  const filteredItems = useMemo(() => {
    let list = items
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(i => i.name.includes(s) || i.category.includes(s) || i.emoji.includes(s))
    }
    return list
  }, [items, search])

  const builtInIds = useMemo(() => new Set(DEFAULT_BUILT_IN_ITEMS.map(i => i.id)), [])
  const customItems = useMemo(() => items.filter(i => !builtInIds.has(i.id)), [items, builtInIds])
  const builtInActive = useMemo(() => items.filter(i => builtInIds.has(i.id)), [items, builtInIds])

  // Delete item
  const handleDelete = (id: string) => {
    onItemsChange(items.filter(i => i.id !== id))
    setDeletedIds(prev => [...prev, id])
  }

  // Restore all deleted built-in items
  const handleRestore = () => {
    const restored = DEFAULT_BUILT_IN_ITEMS.filter(d => !items.some(i => i.id === d.id))
    onItemsChange([...items, ...restored])
    setDeletedIds([])
  }

  // Add custom item
  const handleAdd = () => {
    if (!newName.trim()) return
    const newItem: Item = {
      id: `custom-${Date.now()}`,
      name: newName.trim(),
      emoji: newEmoji || '📦',
      category: newCategory,
      level: newLevel,
      isCustom: true,
    }
    onItemsChange([...items, newItem])
    setNewName('')
    setShowAddForm(false)
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white/60">📦 物品庫管理</span>
          <span className="text-xs text-white/60">共 {items.length} 件</span>
          <span className="text-xs text-white/60">(內建 {builtInActive.length} + 自訂 {customItems.length})</span>
        </div>
        <div className="flex gap-1">
          {deletedIds.length > 0 && (
            <button onClick={handleRestore} className="text-xs text-emerald-400 hover:text-emerald-300 px-2 py-1 rounded flex items-center gap-1">
              <RotateCcw size={12} /> 還原
            </button>
          )}
          <button onClick={() => setShowAddForm(!showAddForm)} className="text-xs text-amber-400 hover:text-amber-300 px-2 py-1 rounded flex items-center gap-1">
            <Plus size={12} /> 新增
          </button>
        </div>
      </div>

      {/* 搜尋 */}
      <div className="relative mb-2">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/60" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="搜尋物品..."
          className="w-full rounded-lg border border-white/15 bg-[#02133e] py-1.5 pl-7 pr-3 text-xs text-white placeholder:text-white/40 focus:border-amber-400/50 focus:outline-none"
        />
      </div>

      {/* 新增表單 */}
      {showAddForm && (
        <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-400/10 p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-white/60">名稱</label>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="物品名稱" className="w-full rounded border border-white/15 bg-[#02133e] p-1.5 text-xs text-white" />
            </div>
            <div>
              <label className="text-[10px] text-white/60">Emoji</label>
              <div className="flex gap-1">
                <input value={newEmoji} onChange={e => setNewEmoji(e.target.value)} placeholder="📦" maxLength={2} className="w-12 rounded border border-white/15 bg-[#02133e] p-1.5 text-xs text-center text-white" />
                <div className="flex-1 max-h-16 overflow-y-auto flex flex-wrap gap-0.5">
                  {ALL_EMOJIS.map(e => (
                    <button key={e} onClick={() => setNewEmoji(e)} className={`w-6 h-6 rounded text-xs flex items-center justify-center ${newEmoji === e ? 'bg-amber-400/30 border border-amber-400' : 'bg-black/25 hover:bg-white/10'}`}>{e}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-white/60">分類</label>
              <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="w-full rounded border border-white/15 bg-[#02133e] p-1.5 text-xs text-white">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-white/60">難度</label>
              <select value={newLevel} onChange={e => setNewLevel(e.target.value as Difficulty)} className="w-full rounded border border-white/15 bg-[#02133e] p-1.5 text-xs text-white">
                {LEVELS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="flex-1 rounded bg-amber-400 py-1.5 text-xs font-bold text-stone-900 hover:bg-amber-300">新增</button>
            <button onClick={() => setShowAddForm(false)} className="px-3 rounded border border-white/15 py-1.5 text-xs text-white/70">取消</button>
          </div>
        </div>
      )}

      {/* 上傳圖片按鈕 */}
      <div className="mb-2">
        <label className="flex items-center gap-1.5 rounded-lg border border-dashed border-white/15 px-3 py-1.5 text-xs text-white/70 cursor-pointer hover:border-amber-400/50 transition-colors">
          <Upload size={12} />
          上傳圖片轉為物品
          <input type="file" multiple accept="image/*" onChange={e => onUploadImage(e.target.files)} className="hidden" />
        </label>
      </div>

      {/* 物品列表 */}
      <div className="max-h-48 overflow-y-auto space-y-0.5">
        {filteredItems.length === 0 && (
          <p className="text-xs text-white/60 text-center py-4">沒有符合的物品</p>
        )}
        {filteredItems.map(item => (
          <div key={item.id} className="flex items-center justify-between rounded-lg px-2 py-1 hover:bg-black/25 group text-xs">
            <div className="flex items-center gap-2 min-w-0">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="w-5 h-5 rounded object-cover flex-shrink-0" />
              ) : (
                <span className="flex-shrink-0">{item.emoji}</span>
              )}
              <span className="text-white truncate">{item.name}</span>
              <span className="text-white/60 hidden md:inline text-[10px]">({item.category})</span>
              {item.isCustom && <span className="text-amber-500 text-[10px]">自訂</span>}
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {item.builtIn && (
                <span className="text-[10px] text-white/70">內建</span>
              )}
              <button
                onClick={() => handleDelete(item.id)}
                className="text-rose-400 hover:text-rose-300 p-0.5"
                title="刪除"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}