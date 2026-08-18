/**
 * 本地產生 QR Code（毋須連外部 API）
 * Copyright (c) 2026 Scout System. All rights reserved.
 */
import { useEffect, useState } from 'react'
import QR from 'qrcode'

type Props = {
  value: string
  size?: number
  className?: string
  /** 深色前景 */
  dark?: string
  light?: string
}

export default function QRCode({ value, size = 240, className = '', dark = '#02133e', light = '#ffffff' }: Props) {
  const [src, setSrc] = useState('')

  useEffect(() => {
    let alive = true
    QR.toDataURL(value, {
      width: size * 2,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark, light },
    })
      .then((url) => {
        if (alive) setSrc(url)
      })
      .catch(() => {
        if (alive) setSrc('')
      })
    return () => {
      alive = false
    }
  }, [value, size, dark, light])

  if (!src) {
    return (
      <div
        className={`grid place-items-center rounded-xl bg-white/10 text-xs text-white/70 ${className}`}
        style={{ width: size, height: size }}
      >
        產生中…
      </div>
    )
  }
  return (
    <img
      src={src}
      alt="QR Code"
      width={size}
      height={size}
      className={`rounded-xl bg-white ${className}`}
      style={{ width: size, height: size }}
      draggable={false}
    />
  )
}
