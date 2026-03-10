'use client'

import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react'
import type { Notification } from '@/lib/admin/hooks/use-notifications'

interface NotificationStackProps {
  notifications: Notification[]
  onDismiss: (id: string) => void
}

export function NotificationStack({ notifications, onDismiss }: NotificationStackProps) {
  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80 sm:w-96" aria-live="polite">
      {notifications.map((n) => (
        <div
          key={n.id}
          role="alert"
          className={`
            flex items-start gap-3 p-4 rounded-lg shadow-lg border text-sm
            ${n.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : ''}
            ${n.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : ''}
            ${n.type === 'warning' ? 'bg-orange-50 border-orange-200 text-orange-800' : ''}
          `}
        >
          <div className="shrink-0 mt-0.5">
            {n.type === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
            {n.type === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
            {n.type === 'warning' && <AlertTriangle className="h-5 w-5 text-orange-500" />}
          </div>
          <div className="flex-1 min-w-0">
            <p>{n.message}</p>
            <div className="flex items-center gap-3 mt-2">
              {n.retryable && n.onRetry && (
                <button
                  type="button"
                  onClick={n.onRetry}
                  className="text-xs font-medium underline hover:no-underline min-h-[44px] flex items-center"
                >
                  Retry
                </button>
              )}
              {n.viewOnSiteUrl && (
                <a
                  href={n.viewOnSiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium underline hover:no-underline min-h-[44px] flex items-center"
                >
                  View on site &rarr;
                </a>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onDismiss(n.id)}
            className="shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2 -mt-2"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
