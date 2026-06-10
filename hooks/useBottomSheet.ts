'use client'

import { useCallback, useEffect } from 'react'

/**
 * Manages SwipeableDrawer state with Android/iOS back-button support.
 *
 * When the sheet opens, pushes a history entry so that pressing the
 * hardware/gesture back button closes the sheet instead of navigating away.
 *
 * Usage:
 *   const { handleOpen, handleClose } = useBottomSheet(isOpen, setIsOpen)
 */
export function useBottomSheet(
  isOpen: boolean,
  setIsOpen: (open: boolean) => void,
) {
  // Push history entry when the sheet opens
  const handleOpen = useCallback(() => {
    setIsOpen(true)
    window.history.pushState({ bottomSheet: true }, '')
  }, [setIsOpen])

  // On manual close: pop the history entry we pushed (if it's still there)
  const handleClose = useCallback(() => {
    setIsOpen(false)
    if (window.history.state?.bottomSheet) {
      window.history.back()
    }
  }, [setIsOpen])

  // Intercept the browser/OS back navigation
  useEffect(() => {
    if (!isOpen) return

    function onPopState() {
      setIsOpen(false)
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [isOpen, setIsOpen])

  return { handleOpen, handleClose }
}
