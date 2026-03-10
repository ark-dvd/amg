import { useState, useCallback, useRef, useEffect } from 'react'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning'
  message: string
  retryable?: boolean
  onRetry?: () => void
  viewOnSiteUrl?: string
}

const MAX_NOTIFICATIONS = 3
const SUCCESS_DISMISS_MS = 4000

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const removeNotification = useCallback((id: string) => {
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const addNotification = useCallback(
    (notification: Omit<Notification, 'id'>) => {
      const id = crypto.randomUUID()
      const newNotification: Notification = { ...notification, id }

      setNotifications((prev) => {
        const next = [...prev, newNotification]
        if (next.length > MAX_NOTIFICATIONS) {
          const removed = next[0]
          if (removed) {
            const timer = timersRef.current.get(removed.id)
            if (timer) {
              clearTimeout(timer)
              timersRef.current.delete(removed.id)
            }
          }
          return next.slice(1)
        }
        return next
      })

      if (notification.type === 'success') {
        const timer = setTimeout(() => {
          removeNotification(id)
        }, SUCCESS_DISMISS_MS)
        timersRef.current.set(id, timer)
      }

      return id
    },
    [removeNotification]
  )

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer))
    }
  }, [])

  return { notifications, addNotification, removeNotification }
}
