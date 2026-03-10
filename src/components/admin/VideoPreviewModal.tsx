'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

interface VideoPreviewModalProps {
  isOpen: boolean
  url: string
  onClose: () => void
}

function getEmbedUrl(url: string): { type: 'iframe' | 'video'; src: string } {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
  if (ytMatch?.[1]) {
    return { type: 'iframe', src: `https://www.youtube.com/embed/${ytMatch[1]}` }
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch?.[1]) {
    return { type: 'iframe', src: `https://player.vimeo.com/video/${vimeoMatch[1]}` }
  }

  // Direct video URL
  return { type: 'video', src: url }
}

export function VideoPreviewModal({ isOpen, url, onClose }: VideoPreviewModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen || !url) return null

  const embed = getEmbedUrl(url)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Video preview">
      <div className="fixed inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-3xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-12 right-0 min-w-[44px] min-h-[44px] flex items-center justify-center text-white hover:text-gray-300"
          aria-label="Close video preview"
        >
          <X className="h-6 w-6" />
        </button>
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
          {embed.type === 'iframe' ? (
            <iframe
              src={embed.src}
              className="w-full h-full"
              allow="autoplay; fullscreen"
              allowFullScreen
              title="Video preview"
            />
          ) : (
            <video
              src={embed.src}
              controls
              autoPlay
              className="w-full h-full"
            >
              <track kind="captions" />
            </video>
          )}
        </div>
      </div>
    </div>
  )
}
