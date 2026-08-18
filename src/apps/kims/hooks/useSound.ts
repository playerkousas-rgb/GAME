// Web Audio API 音效系統 - 無需外部檔案
let audioCtx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext()
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioCtx
}

function playBeep(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.3) {
  try {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, ctx.currentTime)
    gain.gain.setValueAtTime(volume, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + duration)
  } catch { /* 靜默處理 */ }
}

function playNoteSequence(notes: { freq: number; dur: number; delay?: number }[], type: OscillatorType = 'sine') {
  notes.forEach((n, i) => {
    setTimeout(() => playBeep(n.freq, n.dur, type, 0.25), (n.delay || i * 0.15) * 1000)
  })
}

/** 音效生成器 - 用於聽覺金氏遊戲 */
export function playSoundEffect(effectId: string) {
  const ctx = getCtx()
  switch (effectId) {
    // === 動物叫聲 ===
    case 'cat':    playBeep(800, 0.3, 'sawtooth', 0.2); setTimeout(() => playBeep(600, 0.4, 'sawtooth', 0.2), 300); break
    case 'dog':    playBeep(400, 0.15, 'square', 0.25); setTimeout(() => playBeep(400, 0.15, 'square', 0.25), 200); setTimeout(() => playBeep(500, 0.2, 'square', 0.25), 400); break
    case 'bird':   
      for (let i = 0; i < 3; i++) {
        setTimeout(() => playBeep(1200 + Math.random() * 600, 0.08, 'sine', 0.2), i * 120)
      }
      break
    case 'duck':   playBeep(500, 0.15, 'square', 0.2); setTimeout(() => playBeep(450, 0.2, 'square', 0.2), 180); break
    case 'frog':   playBeep(220, 0.25, 'sawtooth', 0.15); setTimeout(() => playBeep(180, 0.3, 'sawtooth', 0.15), 300); break
    case 'cow':    playBeep(180, 0.4, 'sawtooth', 0.2); setTimeout(() => playBeep(160, 0.5, 'sawtooth', 0.2), 400); break
    case 'sheep':  playBeep(600, 0.2, 'triangle', 0.2); setTimeout(() => playBeep(550, 0.3, 'triangle', 0.2), 250); break
    case 'bee':    
      for (let i = 0; i < 5; i++) {
        setTimeout(() => playBeep(400 + i * 50, 0.06, 'square', 0.1), i * 60)
      }
      break

    // === 自然聲音 ===
    case 'rain':   
      for (let i = 0; i < 8; i++) {
        setTimeout(() => playBeep(2000 + Math.random() * 3000, 0.04, 'sine', 0.05), i * 80)
      }
      break
    case 'wind': {
      const now = ctx.currentTime
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(300, now)
      osc2.frequency.linearRampToValueAtTime(800, now + 0.5)
      osc2.frequency.linearRampToValueAtTime(200, now + 1.0)
      gain2.gain.setValueAtTime(0.08, now)
      gain2.gain.linearRampToValueAtTime(0.15, now + 0.3)
      gain2.gain.linearRampToValueAtTime(0.05, now + 1.0)
      osc2.connect(gain2)
      gain2.connect(ctx.destination)
      osc2.start()
      osc2.stop(now + 1.0)
      break
    }
    case 'thunder': playBeep(100, 0.6, 'sawtooth', 0.3); break
    case 'water':  
      for (let i = 0; i < 4; i++) {
        setTimeout(() => playBeep(1500 + Math.random() * 1000, 0.05, 'sine', 0.08), i * 100)
      }
      break

    // === 交通 ===
    case 'car':    playBeep(200, 0.3, 'sawtooth', 0.15); setTimeout(() => playBeep(220, 0.3, 'sawtooth', 0.15), 300); break
    case 'train':  playBeep(150, 0.5, 'square', 0.15); setTimeout(() => playBeep(200, 0.3, 'square', 0.12), 200); setTimeout(() => playBeep(250, 0.2, 'square', 0.1), 400); break
    case 'bike':   playBeep(600, 0.08, 'triangle', 0.12); setTimeout(() => playBeep(650, 0.08, 'triangle', 0.12), 200); break

    // === 樂器 ===
    case 'piano':  playBeep(523, 0.4, 'sine', 0.25); break
    case 'drum':   playBeep(100, 0.15, 'square', 0.25); playBeep(80, 0.2, 'sawtooth', 0.2); break
    case 'bell':   playBeep(1047, 0.5, 'sine', 0.2); break
    case 'guitar': playBeep(440, 0.3, 'triangle', 0.2); break

    // === 日常 ===
    case 'clock':  playBeep(1000, 0.05, 'sine', 0.15); break
    case 'knock':  playBeep(500, 0.06, 'square', 0.2); setTimeout(() => playBeep(500, 0.06, 'square', 0.2), 200); break
    case 'phone':  playBeep(800, 0.15, 'sine', 0.2); setTimeout(() => playBeep(600, 0.15, 'sine', 0.2), 300); break
    case 'whistle': playBeep(1500, 0.3, 'sine', 0.15); break
    case 'snore':  playBeep(120, 0.6, 'sawtooth', 0.1); setTimeout(() => playBeep(130, 0.5, 'sawtooth', 0.1), 700); break

    default: playBeep(440, 0.2, 'sine', 0.15)
  }
}

/* 聽覺金氏遊戲專用：聲音庫定義 */
export interface SoundItem {
  id: string
  name: string
  emoji: string
  category: string
  effectId: string
}

export const SOUND_LIBRARY: SoundItem[] = [
  // 動物
  { id: 'sound-cat', name: '貓叫', emoji: '🐱', category: '動物', effectId: 'cat' },
  { id: 'sound-dog', name: '狗吠', emoji: '🐶', category: '動物', effectId: 'dog' },
  { id: 'sound-bird', name: '鳥鳴', emoji: '🐦', category: '動物', effectId: 'bird' },
  { id: 'sound-duck', name: '鴨叫', emoji: '🦆', category: '動物', effectId: 'duck' },
  { id: 'sound-frog', name: '蛙鳴', emoji: '🐸', category: '動物', effectId: 'frog' },
  { id: 'sound-cow', name: '牛叫', emoji: '🐄', category: '動物', effectId: 'cow' },
  { id: 'sound-sheep', name: '羊叫', emoji: '🐑', category: '動物', effectId: 'sheep' },
  { id: 'sound-bee', name: '蜜蜂', emoji: '🐝', category: '動物', effectId: 'bee' },
  // 自然
  { id: 'sound-rain', name: '雨聲', emoji: '🌧️', category: '自然', effectId: 'rain' },
  { id: 'sound-wind', name: '風聲', emoji: '🌬️', category: '自然', effectId: 'wind' },
  { id: 'sound-thunder', name: '雷聲', emoji: '⚡', category: '自然', effectId: 'thunder' },
  { id: 'sound-water', name: '流水', emoji: '💧', category: '自然', effectId: 'water' },
  // 交通
  { id: 'sound-car', name: '汽車', emoji: '🚗', category: '交通', effectId: 'car' },
  { id: 'sound-train', name: '火車', emoji: '🚂', category: '交通', effectId: 'train' },
  { id: 'sound-bike', name: '單車鈴', emoji: '🚲', category: '交通', effectId: 'bike' },
  // 樂器
  { id: 'sound-piano', name: '鋼琴', emoji: '🎹', category: '樂器', effectId: 'piano' },
  { id: 'sound-drum', name: '鼓聲', emoji: '🥁', category: '樂器', effectId: 'drum' },
  { id: 'sound-bell', name: '鈴聲', emoji: '🔔', category: '樂器', effectId: 'bell' },
  { id: 'sound-guitar', name: '結他', emoji: '🎸', category: '樂器', effectId: 'guitar' },
  // 日常
  { id: 'sound-clock', name: '時鐘', emoji: '🕐', category: '日常', effectId: 'clock' },
  { id: 'sound-knock', name: '敲門', emoji: '🚪', category: '日常', effectId: 'knock' },
  { id: 'sound-phone', name: '電話', emoji: '📞', category: '日常', effectId: 'phone' },
  { id: 'sound-whistle', name: '哨子', emoji: '📯', category: '日常', effectId: 'whistle' },
  { id: 'sound-snore', name: '鼻鼾', emoji: '💤', category: '日常', effectId: 'snore' },
]

export const Sound = {
  gameStart() {
    playNoteSequence([
      { freq: 523, dur: 0.15 },
      { freq: 659, dur: 0.15 },
      { freq: 784, dur: 0.2 },
      { freq: 1047, dur: 0.4 },
    ])
  },
  correct() {
    playNoteSequence([
      { freq: 784, dur: 0.12 },
      { freq: 988, dur: 0.12 },
      { freq: 1175, dur: 0.25 },
    ])
  },
  wrong() {
    playBeep(200, 0.3, 'square', 0.2)
  },
  submit() {
    playBeep(660, 0.15, 'sine', 0.2)
    setTimeout(() => playBeep(880, 0.15, 'sine', 0.2), 100)
  },
  tick() {
    playBeep(1000, 0.08, 'square', 0.15)
  },
  timeout() {
    playBeep(300, 0.3, 'sawtooth', 0.25)
    setTimeout(() => playBeep(200, 0.5, 'sawtooth', 0.25), 300)
  },
  click() {
    playBeep(800, 0.05, 'sine', 0.1)
  },
  victory() {
    playNoteSequence([
      { freq: 523, dur: 0.15 },
      { freq: 659, dur: 0.15 },
      { freq: 784, dur: 0.15 },
      { freq: 1047, dur: 0.15 },
      { freq: 1319, dur: 0.4 },
    ])
  },
  match() {
    playNoteSequence([
      { freq: 660, dur: 0.1 },
      { freq: 880, dur: 0.2 },
    ])
  },
  playerJoin() {
    playNoteSequence([
      { freq: 440, dur: 0.1 },
      { freq: 554, dur: 0.1 },
      { freq: 659, dur: 0.15 },
    ])
  },
}