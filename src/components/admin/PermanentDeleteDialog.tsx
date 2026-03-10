'use client'

import { useState, useEffect } from 'react'

interface PermanentDeleteDialogProps {
  isOpen: boolean
  projectTitle: string
  testimonialCount: number
  onConfirm: () => void
  onCancel: () => void
}

export function PermanentDeleteDialog({
  isOpen,
  projectTitle,
  testimonialCount,
  onConfirm,
  onCancel,
}: PermanentDeleteDialogProps) {
  const [typedName, setTypedName] = useState('')

  useEffect(() => {
    if (!isOpen) setTypedName('')
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onCancel])

  const nameMatches = typedName === projectTitle

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="perm-delete-title">
      <div className="fixed inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 id="perm-delete-title" className="text-lg font-semibold text-charcoal mb-2">
          Permanently delete &ldquo;{projectTitle}&rdquo;?
        </h3>
        <p className="text-sm text-gray-600 mb-2">
          This will permanently destroy the project and its {testimonialCount} testimonial(s).
        </p>
        <p className="text-sm text-red-600 font-medium mb-4">This cannot be undone.</p>

        <div className="mb-6">
          <label htmlFor="confirm-name" className="block text-sm font-medium text-gray-700 mb-1">
            Type the project name to confirm:
          </label>
          <input
            id="confirm-name"
            type="text"
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            autoComplete="off"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!nameMatches}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg min-h-[44px] focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-700"
          >
            Permanently Delete
          </button>
        </div>
      </div>
    </div>
  )
}
