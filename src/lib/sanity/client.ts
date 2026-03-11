import { createClient } from '@sanity/client'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
const apiVersion = '2024-01-01'

export const readClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
  token: process.env.SANITY_API_TOKEN,
})

export const writeClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

/**
 * Derive a CDN URL from a Sanity file asset _ref.
 * Ref format: "file-<id>-<ext>" → "https://cdn.sanity.io/files/<project>/<dataset>/<id>.<ext>"
 */
export function fileUrl(ref: string): string {
  const match = ref.match(/^file-(.+)-([^-]+)$/)
  if (!match) return ''
  return `https://cdn.sanity.io/files/${projectId}/${dataset}/${match[1]}.${match[2]}`
}

/**
 * Derive MIME type from a Sanity file asset _ref.
 * Example: "file-abc123-mp4" → "video/mp4"
 */
export function fileMimeType(ref: string): string {
  const ext = ref.split('-').pop()?.toLowerCase()
  const map: Record<string, string> = {
    mp4: 'video/mp4',
    webm: 'video/webm',
    ogg: 'video/ogg',
    ogv: 'video/ogg',
  }
  return map[ext ?? ''] ?? 'video/mp4'
}
