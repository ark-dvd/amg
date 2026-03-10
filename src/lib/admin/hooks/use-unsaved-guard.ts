import { useEffect, useCallback, useState } from 'react'

interface UseUnsavedGuardOptions {
  isDirty: boolean
}

export function useUnsavedGuard({ isDirty }: UseUnsavedGuardOptions) {
  const [showDialog, setShowDialog] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

  useEffect(() => {
    if (!isDirty) return

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }

    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  const guardedNavigate = useCallback(
    (action: () => void) => {
      if (isDirty) {
        setPendingAction(() => action)
        setShowDialog(true)
      } else {
        action()
      }
    },
    [isDirty]
  )

  const confirmLeave = useCallback(() => {
    setShowDialog(false)
    if (pendingAction) {
      pendingAction()
      setPendingAction(null)
    }
  }, [pendingAction])

  const cancelLeave = useCallback(() => {
    setShowDialog(false)
    setPendingAction(null)
  }, [])

  return {
    showDialog,
    guardedNavigate,
    confirmLeave,
    cancelLeave,
  }
}
