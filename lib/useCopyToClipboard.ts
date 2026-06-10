'use client'

import { useCallback } from 'react'

/**
 * Hook mínimo para copiar texto al portapapeles.
 * Devuelve `copy`, que resuelve a `true` si la copia fue exitosa.
 * El feedback al usuario (toast/snackbar) lo maneja el componente que lo use.
 */
export function useCopyToClipboard(): { copy: (text: string) => Promise<boolean> } {
  const copy = useCallback(async (text: string): Promise<boolean> => {
    if (navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text)
        return true
      } catch {
        return fallbackCopy(text)
      }
    }
    return fallbackCopy(text)
  }, [])

  return { copy }
}

function fallbackCopy(text: string): boolean {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()

  try {
    const ok = document.execCommand('copy')
    return ok
  } catch {
    return false
  } finally {
    document.body.removeChild(textarea)
  }
}
