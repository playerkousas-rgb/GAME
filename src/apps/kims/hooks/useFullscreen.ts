import { useState, useCallback } from 'react'

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.()
        .then(() => setIsFullscreen(true))
        .catch(() => {})
    } else {
      document.exitFullscreen?.()
        .then(() => setIsFullscreen(false))
        .catch(() => {})
    }
  }, [])

  // Listen for fullscreen change
  if (typeof document !== 'undefined') {
    document.addEventListener('fullscreenchange', () => {
      setIsFullscreen(!!document.fullscreenElement)
    })
  }

  return { isFullscreen, toggleFullscreen }
}
