// 共享類型定義

export type Difficulty = 'easy' | 'medium' | 'hard'
export type GameMode = 
  | 'kims'           // 金氏遊戲（視覺觀察）
  | 'audio-kims'     // 聽覺金氏遊戲
  | 'find-object'    // 找物件（場景隱藏）
  | 'spot-diff'      // 找不同（Photo Hunt）
  | 'matching'       // 配對記憶
  | 'text-memory'    // 文字記憶（全新！）
export type PlayMode = 'individual' | 'team' | 'competition'
export type GamePhase = 'setup' | 'observe' | 'hidden' | 'answer' | 'results'
export type AnswerMode = 'input' | 'select'
export type CompetitionPhase = 'lobby' | 'playing' | 'leaderboard'
export type TimerMode = 'countdown' // 只有倒計時模式

export interface Item {
  id: string
  name: string
  emoji: string
  category: string
  level: Difficulty
  imageUrl?: string
  isCustom?: boolean
  builtIn?: boolean  // 是否為內建（可刪除但可恢復）
}

export interface TeamScore {
  team: string
  points: number
  rounds: number
}

export interface Competitor {
  id: string
  name: string
  teamName?: string
  score: number
  correct: number
  wrong: number
  accuracy: number
  finished: boolean
  answers?: { itemId: string; correct: boolean }[]
}

export interface GameConfig {
  mode: GameMode
  difficulty: Difficulty
  observeSeconds: number
  answerSeconds: number
  itemsCount: number
  answerMode: AnswerMode
  enableDistractors: boolean
  playMode: PlayMode
  teamName: string
  competitionMode: boolean
  teams: string[]
  competitors?: Competitor[]
  currentPlayerIndex?: number
}

export interface GameResult {
  correct: number
  wrong: number
  missed: number
  accuracy: number
  score: number
  rank: string
  timeUsed: number
}

/** 音訊檔案上傳 */
export interface AudioClip {
  id: string
  name: string
  dataUrl: string
  duration: number
}

/** 文字記憶題目 */
export interface TextMemoryCard {
  id: string
  text: string
  borderColor: string
  textColor: string
  bgColor: string
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: '初級（幼童軍）',
  medium: '中級（童軍）',
  hard: '高級（深資童軍）',
}

export const DIFFICULTY_TIMES: Record<Difficulty, { observe: number; answer: number; items: number }> = {
  easy: { observe: 60, answer: 90, items: 8 },
  medium: { observe: 30, answer: 60, items: 16 },
  hard: { observe: 15, answer: 45, items: 24 },
}

// 預設邊框色和文字色
export const BORDER_COLORS = [
  { name: '紅色', value: '#EF4444' },
  { name: '藍色', value: '#3B82F6' },
  { name: '綠色', value: '#10B981' },
  { name: '黃色', value: '#F59E0B' },
  { name: '紫色', value: '#8B5CF6' },
  { name: '橙色', value: '#F97316' },
  { name: '粉紅', value: '#EC4899' },
  { name: '青色', value: '#06B6D4' },
  { name: '白色', value: '#FFFFFF' },
  { name: '黑色', value: '#1F2937' },
]

export const TEXT_COLORS = [
  { name: '白色', value: '#FFFFFF' },
  { name: '黑色', value: '#1F2937' },
  { name: '紅色', value: '#EF4444' },
  { name: '藍色', value: '#3B82F6' },
  { name: '綠色', value: '#10B981' },
  { name: '黃色', value: '#F59E0B' },
  { name: '紫色', value: '#8B5CF6' },
  { name: '橙色', value: '#F97316' },
  { name: '粉紅', value: '#EC4899' },
  { name: '金色', value: '#FFD700' },
]