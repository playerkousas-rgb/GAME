/**
 * 共用音效（Web Audio 合成，無需外部檔案）
 * Copyright (c) 2026 Scout System. All rights reserved.
 */

let ctx: AudioContext | null = null
let enabled = true

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    if (!ctx) {
      const C = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!C) return null
      ctx = new C()
    }
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function beep(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.18, delay = 0) {
  if (!enabled) return
  const a = ac()
  if (!a) return
  try {
    const t0 = a.currentTime + delay
    const osc = a.createOscillator()
    const gain = a.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t0)
    gain.gain.setValueAtTime(0.0001, t0)
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    osc.connect(gain)
    gain.connect(a.destination)
    osc.start(t0)
    osc.stop(t0 + dur + 0.02)
  } catch {
    /* ignore */
  }
}

function seq(notes: { f: number; d: number; t?: OscillatorType; v?: number }[], gap = 0.09) {
  notes.forEach((n, i) => beep(n.f, n.d, n.t ?? 'sine', n.v ?? 0.18, i * gap))
}

export const GameSound = {
  setEnabled(v: boolean) {
    enabled = v
  },
  isEnabled: () => enabled,
  /** 使用者手勢後呼叫，解鎖 iOS 音訊 */
  unlock() {
    ac()
  },
  click: () => beep(760, 0.05, 'sine', 0.1),
  start: () => seq([{ f: 523 }, { f: 659 }, { f: 784 }, { f: 1047, d: 0.28 }].map((n) => ({ d: 0.14, ...n }))),
  correct: () => seq([{ f: 784, d: 0.1 }, { f: 1047, d: 0.22 }]),
  wrong: () => beep(196, 0.32, 'square', 0.16),
  skip: () => seq([{ f: 500, d: 0.08, t: 'triangle' as OscillatorType }, { f: 380, d: 0.12, t: 'triangle' as OscillatorType }]),
  tick: () => beep(1100, 0.05, 'square', 0.08),
  /** 最後 5 秒的緊張提示音 */
  urgent: () => beep(1500, 0.09, 'square', 0.16),
  timeUp: () => seq([{ f: 400, d: 0.22, t: 'sawtooth' as OscillatorType }, { f: 260, d: 0.45, t: 'sawtooth' as OscillatorType }], 0.2),
  reveal: () => seq([{ f: 659, d: 0.1 }, { f: 880, d: 0.1 }, { f: 1175, d: 0.26 }]),
  victory: () =>
    seq(
      [{ f: 523 }, { f: 659 }, { f: 784 }, { f: 1047 }, { f: 784 }, { f: 1047 }, { f: 1319, d: 0.5 }].map((n) => ({
        d: 0.15,
        ...n,
      })),
      0.13,
    ),
  countdown: () => beep(880, 0.14, 'sine', 0.2),
}
