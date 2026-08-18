/**
 * Copyright (c) 2026 Scout System. All rights reserved.
 */
import { useState, useCallback } from 'react'
import {
  Users, Settings, Trophy, 
  Clock, Target, Gamepad2, BookOpen,
  Crown, Volume2, VolumeX
} from 'lucide-react'
import { Item, GameConfig, GameResult, Difficulty, GameMode, PlayMode, TeamScore, Competitor } from './types'
import { DEFAULT_BUILT_IN_ITEMS } from './data/items'
import { useImageUpload } from './hooks/useGame'
import { Sound } from './hooks/useSound'
import KimsGame from './components/KimsGame'
import MatchingPairs from './components/MatchingPairs'
import AudioKims from './components/AudioKims'
import TextMemory from './components/TextMemory'
import ItemManager from './components/ItemManager'
import CompetitionMode from './components/CompetitionMode'
import { BRAND, COPYRIGHT } from '../../shared/brand'

type AppPhase = 'home' | 'setup' | 'playing' | 'competition'

const GAME_MODES = [
  { id: 'kims' as GameMode, title: '金氏遊戲', subtitle: '視覺觀察記憶', icon: '👁️', desc: '物品展示後遮蓋，考驗記憶力', color: 'from-amber-500/20 to-amber-700/10', border: 'border-amber-600/30' },
  { id: 'audio-kims' as GameMode, title: '聽覺金氏遊戲', subtitle: '用耳朵記憶', icon: '🎧', desc: '聆聽聲音序列，考驗聽覺記憶力', color: 'from-violet-500/20 to-violet-700/10', border: 'border-violet-600/30' },
  { id: 'text-memory' as GameMode, title: '文字記憶', subtitle: '自訂文字卡', icon: '📝', desc: '輸入中文字詞，設定顏色讓成員全屏記憶', color: 'from-rose-500/20 to-rose-700/10', border: 'border-rose-600/30' },
  { id: 'matching' as GameMode, title: '配對記憶', subtitle: '翻牌配對', icon: '🃏', desc: '翻開卡片找出相同配對', color: 'from-purple-500/20 to-purple-700/10', border: 'border-purple-600/30' },
]

const DIFFICULTIES: { id: Difficulty; label: string; icon: string; color: string }[] = [
  { id: 'easy', label: '初級（幼童軍）', icon: '🌱', color: 'text-emerald-400' },
  { id: 'medium', label: '中級（童軍）', icon: '🔥', color: 'text-amber-400' },
  { id: 'hard', label: '高級（深資童軍）', icon: '⚡', color: 'text-rose-400' },
]

const PLAY_MODES: { id: PlayMode; label: string; icon: string; desc: string }[] = [
  { id: 'individual', label: '個人', icon: '🧑', desc: '單人挑戰' },
  { id: 'team', label: '小隊', icon: '👥', desc: '多小隊比拼' },
  { id: 'competition', label: '比賽', icon: '🏆', desc: 'Kahoot! 風格輪流作答' },
]

function KimsApp() {
  const [phase, setPhase] = useState<AppPhase>('home')
  const [config, setConfig] = useState<GameConfig>({
    mode: 'kims', difficulty: 'medium', observeSeconds: 30, answerSeconds: 60, itemsCount: 16,
    answerMode: 'input', enableDistractors: false, playMode: 'team', teamName: '獵鷹小隊',
    competitionMode: false, teams: ['獵鷹小隊', '灰狼小隊', '黑熊小隊'],
  })
  const { upload } = useImageUpload()
  const [activeItems, setActiveItems] = useState<Item[]>(() => [...DEFAULT_BUILT_IN_ITEMS])
  const [scores, setScores] = useState<TeamScore[]>(
    ['獵鷹小隊', '灰狼小隊', '黑熊小隊', '海狸小隊', '白狐小隊'].map(name => ({ team: name, points: 0, rounds: 0 }))
  )
  const [gameKey, setGameKey] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [customTeamName, setCustomTeamName] = useState('')
  const [isCustomTeam, setIsCustomTeam] = useState(false)

  const toggleSound = useCallback(() => setSoundEnabled(prev => !prev), [])

  const handleUpload = useCallback((files: FileList | null) => {
    if (!files) return
    const newItems: Item[] = Array.from(files).map((file, index) => ({
      id: `custom-${Date.now()}-${index}`,
      name: file.name.replace(/\.[^/.]+$/, ''),
      emoji: '🖼️', category: '自訂', level: 'easy' as const,
      imageUrl: URL.createObjectURL(file), isCustom: true,
    }))
    setActiveItems(prev => [...prev, ...newItems])
    upload(files)
  }, [upload])

  const handleGameResult = useCallback((result: GameResult) => {
    if (config.playMode === 'individual') return
    setScores(prev => {
      const existing = prev.find(s => s.team === config.teamName)
      if (existing) {
        return prev.map(s => s.team === config.teamName ? { ...s, points: s.points + result.score, rounds: s.rounds + 1 } : s).sort((a, b) => b.points - a.points)
      }
      return [...prev, { team: config.teamName, points: result.score, rounds: 1 }].sort((a, b) => b.points - a.points)
    })
  }, [config.playMode, config.teamName])

  const handleCompetitionEnd = useCallback((results: Competitor[]) => {
    const teamMap = new Map<string, number>()
    results.forEach(c => { const t = c.teamName || '個人'; teamMap.set(t, (teamMap.get(t) || 0) + c.score) })
    setScores(prev => {
      const newScores = [...prev]
      teamMap.forEach((points, team) => {
        const existing = newScores.find(s => s.team === team)
        if (existing) { existing.points += points; existing.rounds += 1 }
        else newScores.push({ team, points, rounds: 1 })
      })
      return newScores.sort((a, b) => b.points - a.points)
    })
  }, [])

  const startGame = useCallback(() => {
    if (config.playMode === 'competition') setPhase('competition')
    else setPhase('playing')
    setGameKey(prev => prev + 1)
    if (soundEnabled) Sound.gameStart()
  }, [config.playMode, soundEnabled])

  const renderGame = () => {
    switch (config.mode) {
      case 'kims': return <KimsGame key={gameKey} config={config} allItems={activeItems} onBack={() => setPhase('home')} onResult={handleGameResult} onSoundEnabled={soundEnabled} />
      case 'audio-kims': return <AudioKims key={gameKey} config={config} onBack={() => setPhase('home')} onResult={handleGameResult} />
      case 'text-memory': return <TextMemory key={gameKey} config={config} onBack={() => setPhase('home')} onResult={handleGameResult} />
      case 'matching': return <MatchingPairs key={gameKey} config={config} onBack={() => setPhase('home')} onResult={handleGameResult} />
      default: return <div className="text-center p-8 text-blue-300">敬請期待 🚧<button onClick={() => setPhase('home')} className="block mx-auto mt-4 px-6 py-2 rounded-xl bg-amber-400 text-stone-900 font-bold">返回</button></div>
    }
  }

  const renderCompetition = () => {
    const gameComponent = (props: { config: GameConfig; playerName: string; onResult: (r: GameResult) => void; onBack: () => void }) => {
      switch (config.mode) {
        case 'kims': return <KimsGame {...props} allItems={activeItems} onSoundEnabled={soundEnabled} />
        case 'audio-kims': return <AudioKims {...props} />
        case 'text-memory': return <TextMemory {...props} />
        case 'matching': return <MatchingPairs {...props} />
        default: return <div className="text-center p-8 text-blue-300">敬請期待</div>
      }
    }
    return <CompetitionMode key={gameKey} config={config} gameComponent={gameComponent} onBack={() => setPhase('home')} onCompetitionEnd={handleCompetitionEnd} />
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#02133E' }}>
      <header className="border-b border-blue-800/20 bg-[#02133E]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-6xl px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-400 flex items-center justify-center text-base font-bold text-stone-900">⚜</div>
            <div>
              <h1 className="text-sm font-bold text-white leading-tight">童軍金氏遊戲</h1>
              <p className="text-[10px] text-blue-400">Scout System</p>
            </div>
          </div>
          <nav className="flex items-center gap-2 text-[10px] text-blue-300">
            {phase !== 'home' && <><span className="hidden md:inline">🎯 {GAME_MODES.find(m => m.id === config.mode)?.title}</span><span className="hidden md:inline">|</span></>}
            <button onClick={toggleSound} className={`p-1 rounded-lg ${soundEnabled ? 'text-blue-300 hover:text-white' : 'text-blue-600'}`}>{soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}</button>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-4">
        {/* HOME */}
        {phase === 'home' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-blue-800/30 bg-gradient-to-br from-[#02133E] to-[#0a1e4a] p-5 text-center">
              <div className="text-4xl mb-2">🏕️</div>
              <h2 className="text-2xl md:text-3xl font-bold text-white">童軍金氏遊戲指揮台</h2>
              <p className="text-blue-300 text-xs mt-1 max-w-xl mx-auto">集合視覺、聽覺、文字等多種訓練遊戲</p>
            </div>

            <section>
              <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2"><Gamepad2 size={16} className="text-amber-400" />選擇遊戲</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {GAME_MODES.map(mode => (
                  <button key={mode.id} onClick={() => { setConfig(prev => ({ ...prev, mode: mode.id })); setPhase('setup'); if (soundEnabled) Sound.click(); }}
                    className={`rounded-xl border p-3 text-left transition-all hover:scale-[1.02] ${mode.border} ${mode.color} hover:border-amber-400/50`}>
                    <div className="text-2xl mb-1">{mode.icon}</div>
                    <div className="font-bold text-white text-xs">{mode.title}</div>
                    <div className="text-[10px] text-blue-300 mt-0.5">{mode.subtitle}</div>
                  </button>
                ))}
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-xl border border-blue-800/30 bg-[#02133E]/60 p-3">
                <h3 className="font-semibold text-white text-xs mb-2 flex items-center gap-1.5"><Trophy size={14} className="text-amber-400" />榮譽積分榜</h3>
                <div className="space-y-1">
                  {scores.map((s, idx) => (
                    <div key={s.team} className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs ${idx === 0 ? 'bg-amber-900/20 border border-amber-700/20' : 'bg-blue-900/20'}`}>
                      <span className="flex items-center gap-1.5">
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${idx === 0 ? 'bg-amber-400 text-stone-900' : idx === 1 ? 'bg-gray-400 text-stone-900' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-blue-800 text-blue-200'}`}>{idx + 1}</span>
                        {s.team}
                      </span>
                      <span className="font-bold text-amber-300">{s.points}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-blue-800/30 bg-[#02133E]/60 p-3">
                <ItemManager items={activeItems} onItemsChange={setActiveItems} onUploadImage={handleUpload} />
              </div>

              <div className="rounded-xl border border-blue-800/30 bg-[#02133E]/60 p-3">
                <h3 className="font-semibold text-white text-xs mb-2 flex items-center gap-1.5"><BookOpen size={14} className="text-amber-400" />使用說明</h3>
                <ul className="text-[10px] text-blue-300 space-y-1.5">
                  <li className="flex items-start gap-1.5"><span className="text-amber-400">1.</span><span>選擇遊戲模式</span></li>
                  <li className="flex items-start gap-1.5"><span className="text-amber-400">2.</span><span>設定難度、限時等參數</span></li>
                  <li className="flex items-start gap-1.5"><span className="text-amber-400">3.</span><span>選個人 / 小隊 / 比賽模式</span></li>
                  <li className="flex items-start gap-1.5"><span className="text-amber-400">4.</span><span>管理物品庫—可增刪內建及自訂物品</span></li>
                  <li className="flex items-start gap-1.5"><span className="text-amber-400">5.</span><span>全屏按鈕方便領袖投影給成員</span></li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* SETUP */}
        {phase === 'setup' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-blue-300 mb-1">
              <button onClick={() => { setPhase('home'); if (soundEnabled) Sound.click(); }} className="hover:text-white">← 返回</button>
              <span>/</span>
              <span className="text-white">{GAME_MODES.find(m => m.id === config.mode)?.title}</span>
            </div>

            <div className="rounded-xl border border-blue-800/30 bg-[#02133E]/60 p-4">
              <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2"><Settings size={16} className="text-amber-400" />{GAME_MODES.find(m => m.id === config.mode)?.icon} 設定</h2>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs text-blue-200 font-medium flex items-center gap-1"><Target size={12} /> 難度</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {DIFFICULTIES.map(d => (
                      <button key={d.id} onClick={() => { setConfig(prev => ({ ...prev, difficulty: d.id })); if (soundEnabled) Sound.click(); }}
                        className={`rounded-lg border p-2 text-center transition-all text-xs ${config.difficulty === d.id ? 'border-amber-400 bg-amber-400/10' : 'border-blue-700/20 bg-blue-900/20 hover:border-blue-500/30'}`}>
                        <div className="text-base">{d.icon}</div>
                        <div className={`text-[10px] font-medium mt-0.5 ${d.color}`}>{d.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-blue-200 font-medium flex items-center gap-1"><Users size={12} /> 遊玩模式</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {PLAY_MODES.map(m => (
                      <button key={m.id} onClick={() => { setConfig(prev => ({ ...prev, playMode: m.id, competitionMode: m.id === 'competition' })); if (soundEnabled) Sound.click(); }}
                        className={`rounded-lg border p-2 text-center transition-all ${config.playMode === m.id ? 'border-amber-400 bg-amber-400/10' : 'border-blue-700/20 bg-blue-900/20 hover:border-blue-500/30'}`}>
                        <div className="text-base">{m.icon}</div>
                        <div className="text-[10px] font-medium text-white">{m.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {config.playMode === 'team' && (
                  <div className="space-y-1.5">
                    <label className="text-xs text-blue-200 font-medium">👥 小隊名稱</label>
                    <select value={isCustomTeam ? '__custom__' : config.teamName} onChange={e => { if (e.target.value === '__custom__') setIsCustomTeam(true); else { setIsCustomTeam(false); setConfig(prev => ({ ...prev, teamName: e.target.value })); }}}
                      className="w-full rounded-lg border border-blue-700/40 bg-[#0a1e4a] p-2 text-xs text-white">
                      {['獵鷹小隊', '灰狼小隊', '黑熊小隊', '海狸小隊', '白狐小隊'].map(n => <option key={n} value={n}>{n}</option>)}
                      <option value="__custom__">✏️ 自訂...</option>
                    </select>
                    {isCustomTeam && <input value={customTeamName} onChange={e => { setCustomTeamName(e.target.value); setConfig(prev => ({ ...prev, teamName: e.target.value || '自訂' })); }} placeholder="輸入小隊名稱" className="w-full rounded-lg border border-amber-500/40 bg-[#0a1e4a] p-2 text-xs text-white" />}
                  </div>
                )}
                {config.playMode === 'individual' && (
                  <div className="space-y-1.5">
                    <label className="text-xs text-blue-200 font-medium">🧑 玩家名稱</label>
                    <input value={config.teamName} onChange={e => setConfig(prev => ({ ...prev, teamName: e.target.value }))} placeholder="輸入名字" className="w-full rounded-lg border border-blue-700/40 bg-[#0a1e4a] p-2 text-xs text-white" />
                  </div>
                )}
                {config.playMode === 'competition' && (
                  <div className="rounded-lg border border-amber-500/20 bg-gradient-to-r from-amber-900/20 to-amber-800/10 p-2.5">
                    <div className="flex items-center gap-1.5 text-amber-300 font-semibold text-xs mb-1"><Crown size={14} /> 比賽模式</div>
                    <p className="text-[10px] text-blue-200">進入大廳後可加入多位玩家，每人輪流出戰，即時排行榜</p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs text-blue-200 font-medium flex items-center gap-1"><Clock size={12} /> 限時</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <span className="text-[10px] text-blue-400">觀察</span>
                      <select value={config.observeSeconds} onChange={e => setConfig(prev => ({ ...prev, observeSeconds: Number(e.target.value) }))} className="w-full rounded border border-blue-700/40 bg-[#0a1e4a] p-1.5 text-xs text-white mt-0.5">
                        <option value={10}>10秒</option><option value={15}>15秒</option><option value={20}>20秒</option><option value={30}>30秒</option><option value={45}>45秒</option><option value={60}>60秒</option>
                      </select>
                    </div>
                    <div>
                      <span className="text-[10px] text-blue-400">作答</span>
                      <select value={config.answerSeconds} onChange={e => setConfig(prev => ({ ...prev, answerSeconds: Number(e.target.value) }))} className="w-full rounded border border-blue-700/40 bg-[#0a1e4a] p-1.5 text-xs text-white mt-0.5">
                        <option value={20}>20秒</option><option value={30}>30秒</option><option value={45}>45秒</option><option value={60}>60秒</option><option value={90}>90秒</option><option value={120}>120秒</option>
                      </select>
                    </div>
                  </div>
                </div>

                {config.mode === 'kims' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs text-blue-200 font-medium">📦 物品數量</label>
                      <select value={config.itemsCount} onChange={e => setConfig(prev => ({ ...prev, itemsCount: Number(e.target.value) }))} className="w-full rounded-lg border border-blue-700/40 bg-[#0a1e4a] p-2 text-xs text-white">
                        <option value={8}>8 件</option><option value={12}>12 件</option><option value={16}>16 件</option><option value={24}>24 件</option><option value={36}>36 件</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-blue-200 font-medium">✍️ 回答模式</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button onClick={() => setConfig(prev => ({ ...prev, answerMode: 'input' }))} className={`rounded-lg border p-2 text-center text-xs transition-all ${config.answerMode === 'input' ? 'border-amber-400 bg-amber-400/10' : 'border-blue-700/20 bg-blue-900/20'}`}>輸入</button>
                        <button onClick={() => setConfig(prev => ({ ...prev, answerMode: 'select' }))} className={`rounded-lg border p-2 text-center text-xs transition-all ${config.answerMode === 'select' ? 'border-amber-400 bg-amber-400/10' : 'border-blue-700/20 bg-blue-900/20'}`}>選擇</button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 pt-1">
                      <input type="checkbox" id="distractors" checked={config.enableDistractors} onChange={e => setConfig(prev => ({ ...prev, enableDistractors: e.target.checked }))} className="rounded border-blue-700" />
                      <label htmlFor="distractors" className="text-xs text-blue-200">干擾項</label>
                    </div>
                  </>
                )}
              </div>

              {config.mode === 'kims' && (
                <div className="mt-3">
                  <ItemManager items={activeItems} onItemsChange={setActiveItems} onUploadImage={handleUpload} />
                </div>
              )}

              <button onClick={() => { if (soundEnabled) Sound.click(); startGame(); }}
                className="mt-3 w-full rounded-lg bg-amber-400 py-2.5 font-bold text-stone-900 hover:bg-amber-300 text-sm transition-all">
                {config.playMode === 'competition' ? '🏆 進入比賽大廳' : '🚀 開始遊戲'}
              </button>
            </div>

            <div className="rounded-xl border border-blue-800/30 bg-[#02133E]/60 p-3">
              <h3 className="font-semibold text-white text-xs mb-2 flex items-center gap-1.5"><Trophy size={14} className="text-amber-400" />積分榜</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-1.5">
                {scores.map((s, idx) => (
                  <div key={s.team} className={`rounded-lg px-2 py-1.5 text-center ${idx === 0 ? 'bg-amber-900/20 border border-amber-700/20' : 'bg-blue-900/20'}`}>
                    <div className="text-[10px] text-blue-300">{s.team}</div>
                    <div className="text-sm font-bold text-amber-300">{s.points}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PLAYING */}
        {phase === 'playing' && renderGame()}

        {/* COMPETITION */}
        {phase === 'competition' && renderCompetition()}
      </div>

      <footer className="border-t border-blue-800/20 bg-[#02133E]/80 mt-6">
        <div className="mx-auto max-w-6xl px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-1">
          <div className="text-[10px] text-blue-400">⚜ {COPYRIGHT}</div>
          <div className="text-[10px] text-blue-500">{BRAND.version}</div>
        </div>
      </footer>
    </div>
  )
}

export default KimsApp