import { useEffect, useMemo } from 'react'

/** 由 Blob/File 產生暫時網址，卸載或換檔時自動釋放 */
export function useObjectUrl(blobOrFile: Blob | File | null | undefined) {
  const url = useMemo(() => (blobOrFile ? URL.createObjectURL(blobOrFile) : null), [blobOrFile])

  useEffect(() => {
    if (!url) return
    return () => URL.revokeObjectURL(url)
  }, [url])

  return url
}
