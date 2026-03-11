'use client'

import { useState, useRef } from 'react'
import { Upload, X, RefreshCw, Film } from 'lucide-react'
import type { SanityFileAsset } from '@/types/sanity'

interface VideoUploadProps {
  value: SanityFileAsset | null
  onChange: (value: SanityFileAsset | null) => void
  label: string
  required?: boolean
  id?: string
}

const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/ogg']
const MAX_SIZE_MB = 50
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function VideoUpload({ value, onChange, label, required, id }: VideoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileSize, setFileSize] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fieldId = id ?? `upload-${label.toLowerCase().replace(/\s+/g, '-')}`

  async function handleFile(file: File) {
    setError(null)

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only MP4, WebM, and OGG video files are allowed.')
      return
    }

    if (file.size > MAX_SIZE_BYTES) {
      setError('File size exceeds 50MB. Please compress the video before uploading.')
      return
    }

    setUploading(true)
    setProgress(0)
    setFileName(file.name)
    setFileSize(file.size)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const xhr = new XMLHttpRequest()

      const result = await new Promise<{ data: { assetId: string } }>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100))
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText))
            } catch {
              reject(new Error('Invalid response'))
            }
          } else {
            try {
              const data = JSON.parse(xhr.responseText)
              reject(new Error(data?.error?.message ?? 'Upload failed'))
            } catch {
              reject(new Error('Upload failed. Please try again.'))
            }
          }
        })

        xhr.addEventListener('error', () => reject(new Error('Upload failed. Please check your connection.')))
        xhr.addEventListener('abort', () => reject(new Error('Upload cancelled.')))

        xhr.open('POST', '/api/admin/upload')
        xhr.send(formData)
      })

      onChange({
        _type: 'file',
        asset: { _ref: result.data.assetId, _type: 'reference' },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please check your connection.')
      setFileName(null)
      setFileSize(null)
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  function handleRemove() {
    onChange(null)
    setFileName(null)
    setFileSize(null)
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
          <div className="flex items-center justify-center w-32 h-32 rounded-lg border border-gray-200 bg-gray-50">
            <Film className="h-10 w-10 text-gray-400" />
          </div>
          <div className="flex flex-col gap-2">
            {fileName && (
              <p className="text-sm text-gray-700 truncate max-w-[200px]" title={fileName}>{fileName}</p>
            )}
            {fileSize && (
              <p className="text-xs text-gray-500">{formatBytes(fileSize)}</p>
            )}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2"
            >
              <RefreshCw className="h-4 w-4" /> Replace
            </button>
            <button
              type="button"
              onClick={handleRemove}
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
          onClick={() => !uploading && inputRef.current?.click()}
          className={`
            flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer
            transition-colors
            ${dragOver ? 'border-gold bg-gold/5' : 'border-gray-300 hover:border-gray-400'}
            ${uploading ? 'pointer-events-none' : ''}
          `}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2 w-full px-8">
              <RefreshCw className="h-6 w-6 text-gray-400 animate-spin" />
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gold h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">{progress}%</p>
            </div>
          ) : (
            <>
              <Upload className="h-6 w-6 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">Click or drag to upload video</p>
              <p className="text-xs text-gray-400 mt-1">MP4, WebM, or OGG (max 50MB)</p>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        id={fieldId}
        type="file"
        accept="video/mp4,video/webm,video/ogg"
        onChange={handleInputChange}
        className="sr-only"
      />

      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">{error}</p>
      )}
    </div>
  )
}
