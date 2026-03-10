import { PortableText } from '@portabletext/react'
import type { PortableTextContent } from '@/types/sanity'

interface PortableTextRendererProps {
  value: PortableTextContent
}

export function PortableTextRenderer({ value }: PortableTextRendererProps) {
  return (
    <div className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-charcoal prose-a:text-gold prose-a:underline hover:prose-a:text-gold/80">
      <PortableText value={value} />
    </div>
  )
}
