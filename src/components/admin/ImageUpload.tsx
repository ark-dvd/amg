'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Upload, X, RefreshCw } from 'lucide-react'
import { urlFor } from '@/lib/sanity/image'
import type { SanityImage } from '@/types/sanity'

interface ImageUploadProps {
  value: SanityImage | null
  onChange: (value: SanityImage | null) => void
  label: string
  required?: boolean
  id?: string
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE_MB = 10
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

export function ImageUpload({ value, onChange, label, required, id }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const fieldId = id ?? `upload-${label.toLowerCase().replace(/\s+/g, '-')}`

  async function handleFile(file: File) {
    setError(null)

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only JPEG, PNG, WebP, and GIF images are allowed.')
      return
    }

    if (file.size > MAX_SIZE_BYTES) {
      setError(`File size must be under ${MAX_SIZE_MB} MB.`)
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError((data as Record<string, unknown> | null)?.error?.toString() ?? 'Upload failed. Please try again.')
        return
      }

      const data = await res.json() as { data: { assetId: string } }
      onChange({
        _type: 'image',
        asset: { _ref: data.data.assetId, _type: 'reference' },
      })
    } catch {
      setError('Upload failed. Please check your connection.')
    } finally {
      setUploading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  return (
    <div>
      <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {value ? (
        <div className="flex items-start gap-4">
          <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200">
            <Image
              src={urlFor(value).width(256).height(256).url()}
              alt={label}
              fill
              className="object-cover"
              sizes="128px"
            />
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2"
            >
              <RefreshCw className="h-4 w-4" /> Replace
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-700 bg-white border border-gray-300 rounded-lg hover:bg-red-50 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              <X className="h-4 w-4" /> Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer
            transition-colors
            ${dragOver ? 'border-gold bg-gold/5' : 'border-gray-300 hover:border-gray-400'}
            ${uploading ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          {uploading ? (
            <RefreshCw className="h-6 w-6 text-gray-400 animate-spin" />
          ) : (
            <>
              <Upload className="h-6 w-6 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">Click or drag to upload</p>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        id={fieldId}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleInputChange}
        className="sr-only"
      />

      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">{error}</p>
      )}
    </div>
  )
}
