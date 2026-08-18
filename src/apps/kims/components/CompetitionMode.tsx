import { useState, useEffect, useMemo, useCallback } from 'react'
import { 
  Users, Crown, ArrowLeft, Plus, Trash2, Play, 
  UserPlus, Star, Volume2, VolumeX 
} from 'lucide-react'
import { Competitor, GameConfig, GameResult } from '../types'
import { Sound } from '../hooks/useSound'

interface Props {
  config: GameConfig
  gameComponent: (props: {
    config: GameConfig
    playerName: string
    onResult: (result: GameResult) => void
    onBack: () => void
  }) => React.ReactNode
  onBack: () => void
  onCompetitionEnd: (results: Competitor[]) => void
}

type Phase = 'lobby' | 'playing' | 'leaderboard'

export default function CompetitionMode({ config, gameComponent, onBack, onCompetitionEnd }: Props) {
  const [phase, setPhase] = useState<Phase>('lobby')
  const [competitors, setCompetitors] = useState<Competitor[]>(config.competitors || [
    { id: 'p1', name: '', teamName: config.teamName, score: 0, correct: 0, wrong: 0, accuracy: 0, finished: false },
    { id: 'p2', name: '', teamName: config.teamName, score: 0, correct: 0, wrong: 0, accuracy: 0, finished: false },
  ])
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [newPlayerName, setNewPlayerName] = useState('')
  const [newTeamName, setNewTeamName] = useState(config.teamName)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [playerResults, setPlayerResults] = useState<Map<string, GameResult>>(new Map())
  const [isTransitioning, setIsTransitioning] = useState(false)

  const activeCompetitors = useMemo(() => 
    competitors.filter(c => c.name.trim() !== ''), 
  [competitors])

  const currentPlayer = useMemo(() => 
    competitors[currentPlayerIndex], 
  [competitors, currentPlayerIndex])

  const addPlayer = useCallback(() => {
    if (!newPlayerName.trim()) return
    Sound.playerJoin()
    setCompetitors(prev => [...prev, {
      id: `p${Date.now()}`,
      name: newPlayerName.trim(),
      teamName: newTeamName || config.teamName,
      score: 0, correct: 0, wrong: 0, accuracy: 0, finished: false,
    }])
    setNewPlayerName('')
  }, [newPlayerName, newTeamName, config.teamName])

  const removePlayer = useCallback((id: string) => {
    if (competitors.length <= 2) return
    setCompetitors(prev => prev.filter(c => c.id !== id))
  }, [competitors.length])

  const startCompetition = useCallback(() => {
    if (activeCompetitors.length < 2) return
    Sound.gameStart()
    setCurrentPlayerIndex(0)
    setPlayerResults(new Map())
    setPhase('playing')
  }, [activeCompetitors.length])

  const handlePlayerResult = useCallback((result: GameResult) => {
    const newResults = new Map(playerResults)
    newResults.set(competitors[currentPlayerIndex].id, result)
    setPlayerResults(newResults)

    // 更新該玩家資料
    setCompetitors(prev => prev.map(c => 
      c.id === competitors[currentPlayerIndex].id 
        ? { ...c, score: result.score, correct: result.correct, wrong: result.wrong, accuracy: result.accuracy, finished: true }
        : c
    ))

    // 檢查是否所有玩家都完成了
    if (currentPlayerIndex + 1 >= activeCompetitors.length) {
      Sound.victory()
      // 全部完成
      setTimeout(() => {
        setPhase('leaderboard')
      }, 500)
    } else {
      // 下一位玩家
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentPlayerIndex(prev => prev + 1)
        setIsTransitioning(false)
      }, 2000)
    }
  }, [currentPlayerIndex, competitors, playerResults, activeCompetitors.length])

  const sortedCompetitors = useMemo(() => 
    [...competitors].filter(c => c.name).sort((a, b) => b.score - a.score),
  [competitors])

  const handleBackToLobby = useCallback(() => {
    setPhase('lobby')
  }, [])

  const handleEndCompetition = useCallback(() => {
    onCompetitionEnd(sortedCompetitors)
    onBack()
  }, [sortedCompetitors, onCompetitionEnd, onBack])

  // 如果當前玩家沒有名字（不應該發生），跳過
  useEffect(() => {
    if (phase !== 'playing' || isTransitioning) return
    const player = competitors[currentPlayerIndex]
    if (player && player.name) return
    // 以 timeout 延後，避免在 effect 內同步 setState 造成連鎖渲染
    const t = window.setTimeout(() => {
      if (currentPlayerIndex + 1 >= activeCompetitors.length) {
        setPhase('leaderboard')
      } else {
        setCurrentPlayerIndex(prev => prev + 1)
      }
    }, 0)
    return () => window.clearTimeout(t)
  }, [phase, currentPlayerIndex, competitors, activeCompetitors.length, isTransitioning])

  return (
    <div className="space-y-4">
      {/* 頂欄 */}
      <div className="flex items-center justify-between rounded-xl bg-[#02133E]/80 border border-blue-800/50 p-3">
        <button onClick={phase === 'leaderboard' ? handleBackToLobby : onBack} className="flex items-center gap-1 text-blue-300 hover:text-blue-100 text-sm">
          <ArrowLeft size={16} /> 返回
        </button>
        <div className="flex items-center gap-2 text-sm text-blue-200">
          <Crown size={14} className="text-amber-400" />
          <span>🏆 比賽模式</span>
          {phase === 'playing' && (
            <>
              <span className="text-blue-400">|</span>
              <span className="text-white">
                {currentPlayerIndex + 1} / {activeCompetitors.length}
              </span>
            </>
          )}
        </div>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="text-blue-300 hover:text-white"
          title={soundEnabled ? '關閉音效' : '開啟音效'}
        >
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
      </div>

      {/* 大廳 - 玩家註冊 */}
      {phase === 'lobby' && (
        <div className="rounded-2xl border border-blue-800/40 bg-[#02133E]/80 p-6">
          <div className="text-center mb-6">
            <div className="text-5xl mb-2">🏆</div>
            <h2 className="text-2xl font-bold text-white">比賽大廳</h2>
            <p className="text-blue-300 text-sm mt-1">加入玩家後開始 Kahoot! 風格比賽</p>
          </div>

          {/* 新增玩家 */}
          <div className="bg-[#0a1e4a]/60 rounded-xl border border-blue-700/30 p-4 mb-4">
            <h3 className="text-sm font-medium text-blue-200 mb-3 flex items-center gap-2">
              <UserPlus size={16} className="text-amber-400" />
              新增玩家
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input
                value={newPlayerName}
                onChange={e => setNewPlayerName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addPlayer()}
                placeholder="玩家名稱"
                className="rounded-lg border border-blue-700 bg-[#02133E] p-2.5 text-white placeholder-blue-500 focus:border-amber-400 focus:outline-none"
              />
              <input
                value={newTeamName}
                onChange={e => setNewTeamName(e.target.value)}
                placeholder="所屬小隊 (可選)"
                className="rounded-lg border border-blue-700 bg-[#02133E] p-2.5 text-white placeholder-blue-500 focus:border-amber-400 focus:outline-none"
              />
              <button
                onClick={addPlayer}
                className="rounded-lg bg-amber-400 px-4 py-2.5 font-bold text-stone-900 hover:bg-amber-300 transition-all flex items-center justify-center gap-1"
              >
                <Plus size={16} /> 加入
              </button>
            </div>
          </div>

          {/* 玩家列表 */}
          <div className="space-y-2 mb-4">
            <h3 className="text-sm font-medium text-blue-300 flex items-center gap-2">
              <Users size={14} /> 已加入玩家 ({activeCompetitors.length})
            </h3>
            {activeCompetitors.length === 0 && (
              <p className="text-sm text-blue-500 text-center py-4">尚未有玩家加入</p>
            )}
            {activeCompetitors.map((c, idx) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg bg-[#0a1e4a]/40 border border-blue-800/30 px-3 py-2.5">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    idx === 0 ? 'bg-amber-400 text-stone-900' :
                    idx === 1 ? 'bg-gray-400 text-stone-900' :
                    idx === 2 ? 'bg-amber-700 text-white' : 'bg-blue-800 text-blue-200'
                  }`}>
                    {idx + 1}
                  </span>
                  <div>
                    <span className="text-sm font-medium text-white">{c.name || '未命名'}</span>
                    {c.teamName && <span className="text-xs text-blue-400 ml-2">({c.teamName})</span>}
                  </div>
                </div>
                <button
                  onClick={() => removePlayer(c.id)}
                  className="text-rose-400 hover:text-rose-300 p-1"
                  disabled={competitors.length <= 2}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* 快捷加入 */}
          <details className="mb-4">
            <summary className="text-sm text-blue-400 cursor-pointer hover:text-blue-200">
              📋 快速填滿示範玩家
            </summary>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {['張小明', '陳小華', '李大同', '王小花', '林小強', '黃小美'].map(name => (
                <button
                  key={name}
                  onClick={() => {
                    setCompetitors(prev => {
                      if (prev.some(c => c.name === name)) return prev
                      return [...prev, { id: `p${Date.now()}-${Math.random()}`, name, teamName: config.teamName, score: 0, correct: 0, wrong: 0, accuracy: 0, finished: false }]
                    })
                    Sound.playerJoin()
                  }}
                  className="text-left text-sm text-blue-300 hover:text-white hover:bg-blue-800/30 rounded-lg px-3 py-1.5 border border-blue-800/20"
                >
                  + {name}
                </button>
              ))}
            </div>
          </details>

          {/* 開始按鈕 */}
          <button
            onClick={startCompetition}
            disabled={activeCompetitors.length < 2}
            className={`w-full rounded-xl py-3.5 font-bold text-lg transition-all flex items-center justify-center gap-2 ${
              activeCompetitors.length >= 2
                ? 'bg-amber-400 text-stone-900 hover:bg-amber-300 hover:scale-[1.01]'
                : 'bg-blue-900/50 text-blue-500 cursor-not-allowed'
            }`}
          >
            <Play size={20} />
            開始比賽 ({activeCompetitors.length} 位玩家)
          </button>
        </div>
      )}

      {/* 進行中 - 輪流作答 */}
      {phase === 'playing' && (
        <div>
          {/* 轉場提示 */}
          {isTransitioning ? (
            <div className="rounded-2xl border border-blue-800/40 bg-[#02133E]/80 p-12 text-center">
              <div className="text-4xl mb-3 animate-bounce">🔄</div>
              <h2 className="text-xl font-bold text-white">準備下一位玩家…</h2>
              <p className="text-blue-300 mt-2">請將裝置傳給 {competitors[currentPlayerIndex + 1]?.name}</p>
              <div className="mt-3 text-2xl font-bold text-amber-400">
                {competitors[currentPlayerIndex + 1]?.name}
              </div>
            </div>
          ) : (
            <div>
              {/* 目前玩家資訊條 */}
              <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-900/30 to-amber-800/20 p-3 mb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-400 flex items-center justify-center text-lg font-bold text-stone-900">
                      {currentPlayerIndex + 1}
                    </div>
                    <div>
                      <div className="text-lg font-bold text-white">{currentPlayer?.name}</div>
                      <div className="text-xs text-amber-300">{currentPlayer?.teamName} · 第 {currentPlayerIndex + 1}/{activeCompetitors.length} 位</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-blue-400">目前分數</div>
                    <div className="text-lg font-bold text-amber-400">{currentPlayer?.score || 0}</div>
                  </div>
                </div>
              </div>

              {/* 遊戲組件 - 傳入當前玩家設定 */}
              {currentPlayer && (
                <div key={currentPlayer.id}>
                  {/* 這裡渲染對應的遊戲組件 */}
                  {gameComponent({
                    config: { ...config, teamName: currentPlayer.teamName || config.teamName },
                    playerName: currentPlayer.name,
                    onResult: handlePlayerResult,
                    onBack: handleBackToLobby,
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 最終排行榜 */}
      {phase === 'leaderboard' && (
        <div className="rounded-2xl border border-blue-800/40 bg-[#02133E]/80 p-6">
          <div className="text-center mb-6">
            <div className="text-5xl mb-2">🏆</div>
            <h2 className="text-2xl font-bold text-white">最終排行榜</h2>
            <p className="text-blue-300 text-sm mt-1">比賽結束！以下是所有玩家的成績</p>
          </div>

          {/* 頒獎台 */}
          <div className="flex justify-center items-end gap-3 mb-6">
            {/* 第二名 */}
            {sortedCompetitors[1] && (
              <div className="text-center">
                <div className="text-2xl mb-1">🥈</div>
                <div className="text-sm font-bold text-white">{sortedCompetitors[1].name}</div>
                <div className="text-xs text-blue-300">{sortedCompetitors[1].teamName}</div>
                <div className="bg-gray-600 rounded-t-lg px-4 pt-3 pb-2 mt-1" style={{ height: 60 }}>
                  <div className="text-lg font-bold text-white">{sortedCompetitors[1].score}</div>
                </div>
              </div>
            )}
            {/* 第一名 */}
            {sortedCompetitors[0] && (
              <div className="text-center">
                <div className="text-3xl mb-1">👑</div>
                <div className="text-base font-bold text-amber-400">{sortedCompetitors[0].name}</div>
                <div className="text-xs text-amber-300">{sortedCompetitors[0].teamName}</div>
                <div className="bg-amber-500 rounded-t-lg px-6 pt-4 pb-2 mt-1" style={{ height: 80 }}>
                  <div className="text-2xl font-bold text-stone-900">{sortedCompetitors[0].score}</div>
                  <div className="text-xs text-stone-700">第 1 名</div>
                </div>
              </div>
            )}
            {/* 第三名 */}
            {sortedCompetitors[2] && (
              <div className="text-center">
                <div className="text-2xl mb-1">🥉</div>
                <div className="text-sm font-bold text-white">{sortedCompetitors[2].name}</div>
                <div className="text-xs text-blue-300">{sortedCompetitors[2].teamName}</div>
                <div className="bg-amber-800 rounded-t-lg px-4 pt-3 pb-2 mt-1" style={{ height: 45 }}>
                  <div className="text-lg font-bold text-white">{sortedCompetitors[2].score}</div>
                </div>
              </div>
            )}
          </div>

          {/* 完整排行榜 */}
          <div className="space-y-2">
            {sortedCompetitors.map((c, idx) => (
              <div key={c.id} className={`flex items-center justify-between rounded-xl px-4 py-3 ${
                idx === 0 ? 'bg-amber-900/30 border border-amber-600/30' :
                idx === 1 ? 'bg-gray-800/30 border border-gray-600/30' :
                idx === 2 ? 'bg-amber-900/20 border border-amber-700/20' :
                'bg-blue-900/20 border border-blue-800/20'
              }`}>
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                    idx === 0 ? 'bg-amber-400 text-stone-900' :
                    idx === 1 ? 'bg-gray-400 text-stone-900' :
                    idx === 2 ? 'bg-amber-700 text-white' :
                    'bg-blue-800 text-blue-200'
                  }`}>
                    {idx + 1}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-white">{c.name}</div>
                    <div className="text-xs text-blue-400">{c.teamName}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-lg font-bold text-amber-400">{c.score}</div>
                    <div className="text-xs text-blue-400">{c.accuracy}% 準確</div>
                  </div>
                  {idx === 0 && <Crown size={18} className="text-amber-400" />}
                </div>
              </div>
            ))}
          </div>

          {/* 詳細統計 */}
          <div className="mt-6 rounded-xl bg-[#0a1e4a]/50 border border-blue-800/30 p-4">
            <h3 className="text-sm font-medium text-blue-200 mb-3 flex items-center gap-2">
              <Star size={14} className="text-amber-400" />
              詳細統計
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
              <div className="bg-blue-900/30 rounded-lg p-2">
                <div className="text-xs text-blue-400">參賽者</div>
                <div className="text-lg font-bold text-white">{sortedCompetitors.length}</div>
              </div>
              <div className="bg-blue-900/30 rounded-lg p-2">
                <div className="text-xs text-blue-400">最高分</div>
                <div className="text-lg font-bold text-amber-400">{sortedCompetitors[0]?.score || 0}</div>
              </div>
              <div className="bg-blue-900/30 rounded-lg p-2">
                <div className="text-xs text-blue-400">平均分</div>
                <div className="text-lg font-bold text-white">
                  {Math.round(sortedCompetitors.reduce((a, c) => a + c.score, 0) / sortedCompetitors.length)}
                </div>
              </div>
              <div className="bg-blue-900/30 rounded-lg p-2">
                <div className="text-xs text-blue-400">平均準確率</div>
                <div className="text-lg font-bold text-emerald-400">
                  {Math.round(sortedCompetitors.reduce((a, c) => a + c.accuracy, 0) / sortedCompetitors.length)}%
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleEndCompetition}
            className="mt-6 w-full rounded-xl bg-amber-400 px-4 py-3.5 font-bold text-stone-900 hover:bg-amber-300 transition-all text-lg"
          >
            🎯 返回主頁
          </button>
        </div>
      )}
    </div>
  )
}