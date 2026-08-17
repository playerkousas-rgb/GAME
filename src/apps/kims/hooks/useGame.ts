import { useState, useCallback, useEffect, useRef } from 'react'

export function useTimer() {
  const [timeLeft, setTimeLeft] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<number | null>(null)

  const start = useCallback((seconds: number) => {
    setTimeLeft(seconds)
    setIsRunning(true)
  }, [])

  const stop = useCallback(() => {
    setIsRunning(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const reset = useCallback(() => {
    stop()
    setTimeLeft(0)
  }, [stop])

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, timeLeft])

  return { timeLeft, isRunning, start, stop, reset }
}

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue(prev => {
      const newValue = value instanceof Function ? value(prev) : value
      try {
        window.localStorage.setItem(key, JSON.stringify(newValue))
      } catch { /* noop */ }
      return newValue
    })
  }, [key])

  return [storedValue, setValue]
}

export function useImageUpload() {
  const [uploadedImages, setUploadedImages] = useState<{ id: string; name: string; dataUrl: string }[]>([])

  const upload = useCallback((files: FileList | null) => {
    if (!files) return
    const promises = Array.from(files).map((file) => {
      return new Promise<{ id: string; name: string; dataUrl: string }>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => {
          resolve({
            id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name: file.name.replace(/\.[^/.]+$/, ''),
            dataUrl: reader.result as string,
          })
        }
        reader.readAsDataURL(file)
      })
    })
    Promise.all(promises).then((results) => {
      setUploadedImages((prev) => [...prev, ...results])
    })
  }, [])

  const remove = useCallback((id: string) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== id))
  }, [])

  return { uploadedImages, upload, remove, setUploadedImages }
}