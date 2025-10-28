import { useState, useCallback } from 'react'

export interface UseConfirmDialogResult {
  isOpen: boolean
  open: () => void
  close: () => void
  confirm: () => Promise<void>
  isConfirming: boolean
  error: string | null
}

export interface UseConfirmDialogOptions {
  onConfirm: () => Promise<void> | void
  onSuccess?: () => void
  onError?: (error: string) => void
}

export function useConfirmDialog({
  onConfirm,
  onSuccess,
  onError
}: UseConfirmDialogOptions): UseConfirmDialogResult {
  const [isOpen, setIsOpen] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const open = useCallback(() => {
    setIsOpen(true)
    setError(null)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setError(null)
    setIsConfirming(false)
  }, [])

  const confirm = useCallback(async () => {
    setIsConfirming(true)
    setError(null)

    try {
      await onConfirm()
      setIsOpen(false)
      onSuccess?.()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsConfirming(false)
    }
  }, [onConfirm, onSuccess, onError])

  return {
    isOpen,
    open,
    close,
    confirm,
    isConfirming,
    error
  }
}