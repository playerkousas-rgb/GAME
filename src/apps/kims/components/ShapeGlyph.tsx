/**
 * 幾何圖形卡繪製（SVG）
 * Copyright (c) 2026 Scout System. All rights reserved.
 */
import type { ShapeKind } from '../data/symbols'

const PATHS: Record<ShapeKind, string> = {
  circle: 'M50 6a44 44 0 1 0 .1 0z',
  square: 'M10 10h80v80H10z',
  triangle: 'M50 8 92 88H8z',
  diamond: 'M50 6 94 50 50 94 6 50z',
  star: 'M50 5 62 38h35L69 59l11 34-30-21-30 21 11-34L3 38h35z',
  heart: 'M50 88C22 68 8 52 8 36A22 22 0 0 1 50 26 22 22 0 0 1 92 36c0 16-14 32-42 52z',
  hexagon: 'M28 10h44l22 40-22 40H28L6 50z',
  pentagon: 'M50 6 94 38 77 90H23L6 38z',
  cross: 'M38 6h24v32h32v24H62v32H38V62H6V38h32z',
  ring: 'M50 6a44 44 0 1 0 .1 0zm0 26a18 18 0 1 1-.1 0z',
  half: 'M6 50a44 44 0 0 1 88 0z',
  lightning: 'M58 4 20 56h24l-8 40 42-56H52z',
  'arrow-up': 'M50 6 92 52H68v42H32V52H8z',
  'arrow-down': 'M50 94 8 48h24V6h36v42h24z',
  'arrow-left': 'M6 50 52 8v24h42v36H52v24z',
  'arrow-right': 'M94 50 48 92V68H6V32h42V8z',
}

export default function ShapeGlyph({
  kind,
  color,
  size = 64,
  className = '',
}: {
  kind: ShapeKind
  color: string
  size?: number
  className?: string
}) {
  const isRing = kind === 'ring'
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      style={{ display: 'block' }}
      aria-hidden
    >
      <path
        d={PATHS[kind]}
        fill={color}
        fillRule={isRing ? 'evenodd' : 'nonzero'}
        stroke="rgba(0,0,0,0.25)"
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </svg>
  )
}
