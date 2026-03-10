'use client'

import { useState, useEffect } from 'react'
import { CharacterCount } from './CharacterCount'

interface SlugFieldProps {
  value: string
  onChange: (value: string) => void
  fromTitle: string
  isFirstSave: boolean
  urlPrefix: string
  maxLength?: number
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function SlugField({ value, onChange, fromTitle, isFirstSave, urlPrefix, maxLength = 80 }: SlugFieldProps) {
  const [unlocked, setUnlocked] = useState(false)
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    if (isFirstSave && fromTitle) {
      onChange(slugify(fromTitle))
    }
  }, [fromTitle, isFirstSave, onChange])

  const isReadOnly = !isFirstSave && !unlocked

  function handleUnlock() {
    setShowWarning(true)
    setUnlocked(true)
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
          URL Slug <span className="text-red-500">*</span>
        </label>
        {!isFirstSave && !unlocked && (
          <button
            type="button"
            onClick={handleUnlock}
            className="text-xs text-gold hover:text-gold/80 underline min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            Unlock
          </button>
        )}
      </div>
      <input
        id="slug"
        type="text"
        value={value}
        onChange={(e) => onChange(slugify(e.target.value))}
        readOnly={isReadOnly}
        className={`
          w-full px-3 py-2 border rounded-lg text-base
          focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2
          ${isReadOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'border-gray-300'}
        `}
        maxLength={maxLength}
      />
      <div className="flex items-center justify-between mt-1">
        <p className="text-xs text-gray-400">
          {urlPrefix}/{value || '...'}
        </p>
        <CharacterCount current={value.length} max={maxLength} />
      </div>
      {showWarning && (
        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800" role="alert">
          ⚠️ Changing a slug will break existing links. You are responsible for setting up redirects.
        </div>
      )}
    </div>
  )
}
