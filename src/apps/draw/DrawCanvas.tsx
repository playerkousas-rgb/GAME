/**
 * 繪畫畫布 — 支援滑鼠／觸控／手寫筆、粗幼、顏色、橡皮、復原
 * Copyright (c) 2026 Scout System. All rights reserved.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Eraser, Undo2, Trash2, Paintbrush } from 'lucide-react'

const COLORS = [
  '#ffffff', '#1f2937', '#ef4444', '#f97316', '#f59e0b',
  '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
]
const SIZES = [3, 6, 12, 24]

type Stroke = { color: string; size: number; points: { x: number; y: number }[]; erase: boolean }

export interface DrawCanvasHandle {
  clear: () => void
}

export default function DrawCanvas({ disabled = false }: { disabled?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const strokesRef = useRef<Stroke[]>([])
  const drawingRef = useRef(false)
  const [color, setColor] = useState('#ffffff')
  const [size, setSize] = useState(6)
  const [erase, setErase] = useState(false)
  const [strokeCount, setStrokeCount] = useState(0)

  const redraw = useCallback(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, cv.width, cv.height)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    for (const s of strokesRef.current) {
      if (s.points.length === 0) continue
      ctx.globalCompositeOperation = s.erase ? 'destination-out' : 'source-over'
      ctx.strokeStyle = s.color
      ctx.lineWidth = s.size
      ctx.beginPath()
      ctx.moveTo(s.points[0].x, s.points[0].y)
      if (s.points.length === 1) ctx.lineTo(s.points[0].x + 0.1, s.points[0].y)
      else for (let i = 1; i < s.points.length; i++) ctx.lineTo(s.points[i].x, s.points[i].y)
      ctx.stroke()
    }
    ctx.globalCompositeOperation = 'source-over'
  }, [])

  /* Resize canvas to container (keeps drawing via re-render) */
  useEffect(() => {
    const wrap = wrapRef.current
    const cv = canvasRef.current
    if (!wrap || !cv) return
    const ro = new ResizeObserver(() => {
      const r = wrap.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      cv.width = Math.max(1, Math.floor(r.width * dpr))
      cv.height = Math.max(1, Math.floor(r.height * dpr))
      cv.style.width = `${r.width}px`
      cv.style.height = `${r.height}px`
      const ctx = cv.getContext('2d')
      ctx?.scale(dpr, dpr)
      redraw()
    })
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [redraw])

  const pos = (e: React.PointerEvent) => {
    const cv = canvasRef.current!
    const r = cv.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  const down = (e: React.PointerEvent) => {
    if (disabled) return
    e.preventDefault()
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    drawingRef.current = true
    strokesRef.current.push({ color, size, erase, points: [pos(e)] })
    setStrokeCount(strokesRef.current.length)
    redraw()
  }

  const move = (e: React.PointerEvent) => {
    if (!drawingRef.current || disabled) return
    e.preventDefault()
    const s = strokesRef.current[strokesRef.current.length - 1]
    if (!s) return
    s.points.push(pos(e))
    redraw()
  }

  const up = () => {
    drawingRef.current = false
  }

  const undo = () => {
    strokesRef.current.pop()
    setStrokeCount(strokesRef.current.length)
    redraw()
  }

  const clear = () => {
    strokesRef.current = []
    setStrokeCount(0)
    redraw()
  }

  return (
    <div className="flex h-full flex-col gap-2">
      {/* 畫布 */}
      <div
        ref={wrapRef}
        className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-[#0b1a3d]"
        style={{ touchAction: 'none' }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerLeave={up}
          onPointerCancel={up}
          className={disabled ? 'cursor-not-allowed' : 'cursor-crosshair'}
        />
        {strokeCount === 0 && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="text-center text-white/15">
              <Paintbrush className="mx-auto mb-2 h-10 w-10" />
              <p className="text-sm">在此畫圖</p>
            </div>
          </div>
        )}
      </div>

      {/* 工具列 */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2">
        <div className="flex gap-1">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => {
                setColor(c)
                setErase(false)
              }}
              style={{ background: c }}
              className={`h-6 w-6 rounded-full border-2 transition ${
                color === c && !erase ? 'scale-110 border-amber-400' : 'border-white/20 hover:scale-105'
              }`}
              aria-label={`顏色 ${c}`}
            />
          ))}
        </div>

        <div className="mx-1 h-6 w-px bg-white/10" />

        <div className="flex gap-1">
          {SIZES.map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className={`grid h-7 w-7 place-items-center rounded-lg border transition ${
                size === s ? 'border-amber-400/60 bg-amber-400/15' : 'border-white/10 bg-black/20 hover:bg-white/10'
              }`}
            >
              <span className="rounded-full bg-white" style={{ width: s / 1.6 + 3, height: s / 1.6 + 3 }} />
            </button>
          ))}
        </div>

        <div className="mx-1 h-6 w-px bg-white/10" />

        <button
          onClick={() => setErase((e) => !e)}
          className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs transition ${
            erase ? 'border-amber-400/60 bg-amber-400/15 text-amber-200' : 'border-white/10 bg-black/20 text-white/50 hover:text-white'
          }`}
        >
          <Eraser className="h-3.5 w-3.5" /> 橡皮
        </button>
        <button
          onClick={undo}
          className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/20 px-2.5 py-1.5 text-xs text-white/50 transition hover:text-white"
        >
          <Undo2 className="h-3.5 w-3.5" /> 復原
        </button>
        <button
          onClick={clear}
          className="flex items-center gap-1 rounded-lg border border-rose-500/20 bg-rose-500/10 px-2.5 py-1.5 text-xs text-rose-300 transition hover:bg-rose-500/20"
        >
          <Trash2 className="h-3.5 w-3.5" /> 清除
        </button>
      </div>
    </div>
  )
}
