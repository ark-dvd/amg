import imageUrlBuilder from '@sanity/image-url'
import type { SanityImageSource } from '@sanity/image-url/lib/types/types'
import { readClient } from './client'

const builder = imageUrlBuilder(readClient)

export function urlFor(source: SanityImageSource) {
  return builder.image(source)
}
