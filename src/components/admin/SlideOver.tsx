'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface SlideOverProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  isDirty?: boolean
  onConfirmClose?: () => void
}

export function SlideOver({ isOpen, onClose, title, children, isDirty, onConfirmClose }: SlideOverProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  })

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  function handleClose() {
    if (isDirty && onConfirmClose) {
      onConfirmClose()
    } else {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-labelledby="slide-over-title">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" onClick={handleClose} />

      {/* Panel */}
      <div
        ref={panelRef}
        className="
          fixed bg-white shadow-xl overflow-y-auto flex flex-col
          inset-0
          lg:inset-y-0 lg:left-auto lg:right-0 lg:w-[50vw] lg:max-w-3xl
        "
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between">
          <h2 id="slide-over-title" className="text-lg font-semibold text-charcoal">{title}</h2>
          <button
            type="button"
            onClick={handleClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600"
            aria-label="Close panel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 px-4 sm:px-6 py-6">
          {children}
        </div>
      </div>
    </div>
  )
}
