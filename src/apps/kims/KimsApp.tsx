/**
 * 童軍金氏遊戲 — 四合一觀察記憶遊戲（統一設計外殼）
 * Copyright (c) 2026 Scout System. All rights reserved.
 */
import { useState, useCallback } from 'react'
import {
  Users, Trophy, Clock, Target, Gamepad2, BookOpen, Crown,
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
import Footer from '../../components/Footer'
import { PageHeader, SoundToggle, ThemeToggle, StartButton } from '../../components/ui'

type AppPhase = 'home' | 'setup' | 'playing' | 'competition'

const GAME_MODES = [
  { id: 'kims' as GameMode, title: '金氏遊戲', subtitle: '視覺觀察記憶', icon: '👁️', desc: '物品展示後遮蓋，考驗記憶力', color: 'from-amber-500/20 to-amber-700/10', border: 'border-amber-500/25' },
  { id: 'audio-kims' as GameMode, title: '聽覺金氏遊戲', subtitle: '用耳朵記憶', icon: '🎧', desc: '聆聽聲音序列，考驗聽覺記憶力', color: 'from-violet-500/20 to-violet-700/10', border: 'border-violet-500/25' },
  { id: 'text-memory' as GameMode, title: '圖案記憶', subtitle: '圖案／圖形卡', icon: '🧠', desc: '大 Emoji 圖案、幾何圖形、自訂相片或文字卡，點選作答', color: 'from-rose-500/20 to-rose-700/10', border: 'border-rose-500/25' },
  { id: 'matching' as GameMode, title: '配對記憶', subtitle: '翻牌配對', icon: '🃏', desc: '翻開卡片找出相同配對', color: 'from-purple-500/20 to-purple-700/10', border: 'border-purple-500/25' },
]

const DIFFICULTIES: { id: Difficulty; label: string; icon: string; color: string }[] = [
  { id: 'easy', label: '初級（幼童軍）', icon: '🌱', color: 'text-emerald-300' },
  { id: 'medium', label: '中級（童軍）', icon: '🔥', color: 'text-amber-300' },
  { id: 'hard', label: '高級（深資童軍）', icon: '⚡', color: 'text-rose-300' },
]

const PLAY_MODES: { id: PlayMode; label: string; icon: string; desc: string }[] = [
  { id: 'individual', label: '個人', icon: '🧑', desc: '單人挑戰' },
  { id: 'team', label: '小隊', icon: '👥', desc: '多小隊比拼' },
  { id: 'competition', label: '比賽', icon: '🏆', desc: 'Kahoot! 風格輪流作答' },
]

const DEFAULT_TEAMS = ['獵鷹小隊', '灰狼小隊', '黑熊小隊', '海狸小隊', '白狐小隊']

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
    DEFAULT_TEAMS.map(name => ({ team: name, points: 0, rounds: 0 }))
  )
  const [gameKey, setGameKey] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [customTeamName, setCustomTeamName] = useState('')
  const [isCustomTeam, setIsCustomTeam] = useState(false)

  const click = useCallback(() => { if (soundEnabled) Sound.click() }, [soundEnabled])

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
      case 'matching': return <MatchingPairs key={gameKey} config={config} allItems={activeItems} onBack={() => setPhase('home')} onResult={handleGameResult} />
      default: return <div className="text-center p-8 muted">敬請期待 🚧<button onClick={() => setPhase('home')} className="mt-4 mx-auto block rounded-xl bg-amber-400 px-6 py-2 font-bold text-stone-900">返回</button></div>
    }
  }

  const renderCompetition = () => {
    const gameComponent = (props: { config: GameConfig; playerName: string; onResult: (r: GameResult) => void; onBack: () => void }) => {
      switch (config.mode) {
        case 'kims': return <KimsGame {...props} allItems={activeItems} onSoundEnabled={soundEnabled} />
        case 'audio-kims': return <AudioKims {...props} />
        case 'text-memory': return <TextMemory {...props} />
        case 'matching': return <MatchingPairs {...props} allItems={activeItems} />
        default: return <div className="text-center p-8 muted">敬請期待</div>
      }
    }
    return <CompetitionMode key={gameKey} config={config} gameComponent={gameComponent} onBack={() => setPhase('home')} onCompetitionEnd={handleCompetitionEnd} />
  }

  const mode = GAME_MODES.find(m => m.id === config.mode)

  return (
    <div className="ss-page flex flex-col">
      <PageHeader
        emoji="👁️"
        title="童軍金氏遊戲"
        subtitle="Scout Kim's Games"
        actions={
          <>
            <SoundToggle on={soundEnabled} onToggle={setSoundEnabled} />
            <ThemeToggle />
          </>
        }
      />

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-4">
        {/* HOME */}
        {phase === 'home' && (
          <div className="space-y-4">
            <div className="card-lg border-amber-400/20 bg-gradient-to-br from-amber-400/10 to-transparent text-center">
              <div className="animate-float mb-2 text-4xl">🏕️</div>
              <h2 className="text-2xl font-black sm:text-3xl">童軍金氏遊戲</h2>
              <p className="mt-1 mx-auto max-w-xl text-xs leading-relaxed muted">
                集合視覺、聽覺、圖案、配對四種訓練，觀察記憶一網打盡
              </p>
            </div>

            <section>
              <h3 className="section-title mb-2.5"><span className="accent-text"><Gamepad2 size={16} /></span> 選擇遊戲</h3>
              <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
                {GAME_MODES.map(gm => (
                  <button
                    key={gm.id}
                    type="button"
                    onClick={() => { setConfig(prev => ({ ...prev, mode: gm.id })); setPhase('setup'); click() }}
                    className={`card border-transparent bg-gradient-to-br ${gm.color} ${gm.border} p-3.5 text-left transition hover:scale-[1.02] active:scale-[0.98]`}
                  >
                    <div className="mb-1.5 text-2xl">{gm.icon}</div>
                    <div className="text-xs font-bold">{gm.title}</div>
                    <div className="mt-0.5 text-[10px] muted">{gm.subtitle}</div>
                  </button>
                ))}
              </div>
            </section>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="card p-3.5">
                <h3 className="section-title mb-2 text-xs"><span className="accent-text"><Trophy size={14} /></span> 榮譽積分榜</h3>
                <div className="space-y-1">
                  {scores.map((s, idx) => (
                    <div key={s.team} className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs ${idx === 0 ? 'border border-amber-400/30 bg-amber-400/10' : 'bg-black/20'}`}>
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span className={`grid h-4 w-4 shrink-0 place-items-center rounded-full text-[10px] font-bold ${idx === 0 ? 'bg-amber-400 text-stone-900' : idx === 1 ? 'bg-slate-400 text-stone-900' : idx === 2 ? 'bg-amber-600 text-white' : 'bg-white/10'}`}>{idx + 1}</span>
                        <span className="truncate">{s.team}</span>
                      </span>
                      <span className="font-bold text-amber-300 tabular-nums">{s.points}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="md:row-span-2">
                <ItemManager items={activeItems} onItemsChange={setActiveItems} onUploadImage={handleUpload} />
              </div>

              <div className="card p-3.5">
                <h3 className="section-title mb-2 text-xs"><span className="accent-text"><BookOpen size={14} /></span> 使用說明</h3>
                <ul className="space-y-1.5 text-[11px] leading-relaxed muted">
                  <li className="flex items-start gap-1.5"><span className="text-amber-400">1.</span><span>選擇遊戲模式</span></li>
                  <li className="flex items-start gap-1.5"><span className="text-amber-400">2.</span><span>設定難度、限時等參數</span></li>
                  <li className="flex items-start gap-1.5"><span className="text-amber-400">3.</span><span>選個人 / 小隊 / 比賽模式</span></li>
                  <li className="flex items-start gap-1.5"><span className="text-amber-400">4.</span><span>管理物品庫 — 可增刪內建及自訂物品</span></li>
                  <li className="flex items-start gap-1.5"><span className="text-amber-400">5.</span><span>全屏按鈕方便領袖投影給成員</span></li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* SETUP */}
        {phase === 'setup' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs muted">
              <button onClick={() => { setPhase('home'); click() }} className="transition hover:text-amber-300" type="button">← 返回</button>
              <span>/</span>
              <span className="font-semibold">{mode?.title}</span>
            </div>

            <div className="card-lg">
              <h2 className="section-title mb-3"><span className="accent-text"><Target size={16} /></span> {mode?.icon} {mode?.title} 設定</h2>

              <div className="grid gap-3.5 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 flex items-center gap-1 text-xs font-medium muted"><Target size={12} /> 難度</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {DIFFICULTIES.map(d => (
                      <button key={d.id} type="button" onClick={() => { setConfig(prev => ({ ...prev, difficulty: d.id })); click() }}
                        className={`chip !p-2.5 text-center ${config.difficulty === d.id ? 'chip-on' : ''}`}>
                        <div className="text-base leading-none">{d.icon}</div>
                        <div className={`mt-1 text-[10px] font-medium ${d.color}`}>{d.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-1 text-xs font-medium muted"><Users size={12} /> 遊玩模式</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {PLAY_MODES.map(pm => (
                      <button key={pm.id} type="button" onClick={() => { setConfig(prev => ({ ...prev, playMode: pm.id, competitionMode: pm.id === 'competition' })); click() }}
                        className={`chip !p-2.5 text-center ${config.playMode === pm.id ? 'chip-on' : ''}`}>
                        <div className="text-base leading-none">{pm.icon}</div>
                        <div className="mt-1 text-[10px] font-medium">{pm.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {config.playMode === 'team' && (
                  <div>
                    <label className="mb-1.5 block text-xs font-medium muted">👥 小隊名稱</label>
                    <select
                      value={isCustomTeam ? '__custom__' : config.teamName}
                      onChange={e => { if (e.target.value === '__custom__') setIsCustomTeam(true); else { setIsCustomTeam(false); setConfig(prev => ({ ...prev, teamName: e.target.value })); } }}
                      className="input"
                    >
                      {DEFAULT_TEAMS.map(n => <option key={n} value={n}>{n}</option>)}
                      <option value="__custom__">✏️ 自訂...</option>
                    </select>
                    {isCustomTeam && (
                      <input
                        value={customTeamName}
                        onChange={e => { setCustomTeamName(e.target.value); setConfig(prev => ({ ...prev, teamName: e.target.value || '自訂' })) }}
                        placeholder="輸入小隊名稱"
                        className="input mt-1.5"
                      />
                    )}
                  </div>
                )}
                {config.playMode === 'individual' && (
                  <div>
                    <label className="mb-1.5 block text-xs font-medium muted">🧑 玩家名稱</label>
                    <input value={config.teamName} onChange={e => setConfig(prev => ({ ...prev, teamName: e.target.value }))} placeholder="輸入名字" className="input" />
                  </div>
                )}
                {config.playMode === 'competition' && (
                  <div className="rounded-xl border border-amber-400/25 bg-amber-400/10 p-3">
                    <div className="mb-1 flex items-center gap-1.5 text-xs font-bold text-amber-300"><Crown size={14} /> 比賽模式</div>
                    <p className="text-[11px] leading-relaxed muted">進入大廳後可加入多位玩家，每人輪流出戰，即時排行榜</p>
                  </div>
                )}

                <div>
                  <label className="mb-1.5 flex items-center gap-1 text-xs font-medium muted"><Clock size={12} /> 限時</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <span className="text-[10px] muted-2">觀察</span>
                      <select value={config.observeSeconds} onChange={e => setConfig(prev => ({ ...prev, observeSeconds: Number(e.target.value) }))} className="input mt-0.5">
                        {[10, 15, 20, 30, 45, 60].map(s => <option key={s} value={s}>{s}秒</option>)}
                      </select>
                    </div>
                    <div>
                      <span className="text-[10px] muted-2">作答</span>
                      <select value={config.answerSeconds} onChange={e => setConfig(prev => ({ ...prev, answerSeconds: Number(e.target.value) }))} className="input mt-0.5">
                        {[20, 30, 45, 60, 90, 120].map(s => <option key={s} value={s}>{s}秒</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {config.mode === 'kims' && (
                  <>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium muted">📦 物品數量</label>
                      <select value={config.itemsCount} onChange={e => setConfig(prev => ({ ...prev, itemsCount: Number(e.target.value) }))} className="input">
                        {[8, 12, 16, 24, 36].map(n => <option key={n} value={n}>{n} 件</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium muted">✍️ 回答模式</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button type="button" onClick={() => setConfig(prev => ({ ...prev, answerMode: 'input' }))} className={`chip ${config.answerMode === 'input' ? 'chip-on' : ''}`}>輸入</button>
                        <button type="button" onClick={() => setConfig(prev => ({ ...prev, answerMode: 'select' }))} className={`chip ${config.answerMode === 'select' ? 'chip-on' : ''}`}>選擇</button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        id="distractors"
                        type="checkbox"
                        checked={config.enableDistractors}
                        onChange={e => setConfig(prev => ({ ...prev, enableDistractors: e.target.checked }))}
                        className="h-5 w-5 rounded border-white/20"
                      />
                      <label htmlFor="distractors" className="text-xs muted">加入干擾項（選擇模式）</label>
                    </div>
                  </>
                )}
              </div>
            </div>

            {config.mode === 'kims' && (
              <ItemManager items={activeItems} onItemsChange={setActiveItems} onUploadImage={handleUpload} />
            )}

            <div className="card p-3.5">
              <h3 className="section-title mb-2 text-xs"><span className="accent-text"><Trophy size={14} /></span> 積分榜</h3>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-5">
                {scores.map((s, idx) => (
                  <div key={s.team} className={`rounded-lg px-2 py-1.5 text-center ${idx === 0 ? 'border border-amber-400/30 bg-amber-400/10' : 'bg-black/20'}`}>
                    <div className="truncate text-[10px] muted">{s.team}</div>
                    <div className="text-sm font-bold text-amber-300 tabular-nums">{s.points}</div>
                  </div>
                ))}
              </div>
            </div>

            <StartButton onClick={() => { click(); startGame() }} sticky>
              {config.playMode === 'competition' ? '🏆 進入比賽大廳' : '🚀 開始遊戲'}
            </StartButton>
          </div>
        )}

        {/* PLAYING */}
        {phase === 'playing' && renderGame()}

        {/* COMPETITION */}
        {phase === 'competition' && renderCompetition()}
      </div>

      <Footer />
    </div>
  )
}

export default KimsApp
