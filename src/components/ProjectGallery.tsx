'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { urlFor } from '@/lib/sanity/image'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { SanityImage } from '@/types/sanity'

interface ProjectGalleryProps {
  screenshots: SanityImage[]
  projectTitle: string
}

export function ProjectGallery({ screenshots, projectTitle }: ProjectGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const close = useCallback(() => setLightboxIndex(null), [])
  const prev = useCallback(() => {
    setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : screenshots.length - 1))
  }, [screenshots.length])
  const next = useCallback(() => {
    setLightboxIndex((i) => (i !== null && i < screenshots.length - 1 ? i + 1 : 0))
  }, [screenshots.length])

  useEffect(() => {
    if (lightboxIndex === null) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [lightboxIndex, close, prev, next])

  // Touch swipe support
  const [touchStart, setTouchStart] = useState<number | null>(null)

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {screenshots.map((screenshot, i) => (
          screenshot?.asset && (
            <button
              key={i}
              type="button"
              onClick={() => setLightboxIndex(i)}
              className="relative aspect-[4/3] rounded-lg overflow-hidden border border-border hover:opacity-90 transition-opacity cursor-pointer"
            >
              <Image
                src={urlFor(screenshot).width(400).height(300).url()}
                alt={`${projectTitle} — screenshot ${i + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            </button>
          )
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && screenshots[lightboxIndex]?.asset && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
          onClick={close}
          onTouchStart={(e) => setTouchStart(e.touches[0]?.clientX ?? null)}
          onTouchEnd={(e) => {
            if (touchStart === null) return
            const diff = (e.changedTouches[0]?.clientX ?? 0) - touchStart
            if (Math.abs(diff) > 50) {
              if (diff > 0) prev()
              else next()
            }
            setTouchStart(null)
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Image lightbox"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={close}
            className="absolute top-4 right-4 z-10 min-w-[44px] min-h-[44px] flex items-center justify-center text-white/80 hover:text-white"
            aria-label="Close lightbox"
          >
            <X className="h-7 w-7" />
          </button>

          {/* Prev button */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); prev() }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 min-w-[44px] min-h-[44px] flex items-center justify-center text-white/80 hover:text-white"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>

          {/* Next button */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); next() }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 min-w-[44px] min-h-[44px] flex items-center justify-center text-white/80 hover:text-white"
            aria-label="Next image"
          >
            <ChevronRight className="h-8 w-8" />
          </button>

          {/* Image */}
          <div
            className="relative max-w-[90vw] max-h-[85vh] w-full h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={urlFor(screenshots[lightboxIndex]!).width(1600).height(1200).fit('max').url()}
              alt={`${projectTitle} — screenshot ${lightboxIndex + 1}`}
              fill
              className="object-contain"
              sizes="90vw"
              priority
            />
          </div>

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            {lightboxIndex + 1} / {screenshots.length}
          </div>
        </div>
      )}
    </>
  )
}
