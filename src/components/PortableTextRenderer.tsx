import { PortableText } from '@portabletext/react'
import type { PortableTextContent } from '@/types/sanity'

interface PortableTextRendererProps {
  value: PortableTextContent
}

export function PortableTextRenderer({ value }: PortableTextRendererProps) {
  return (
    <div className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-charcoal prose-p:text-muted prose-a:text-gold prose-a:underline hover:prose-a:text-accent-light">
      <PortableText value={value} />
    </div>
  )
}
