import type { SlugValidationContext } from 'sanity'

export async function isUniqueSlug(
  slug: string,
  context: SlugValidationContext
): Promise<boolean> {
  const { document, getClient } = context
  const client = getClient({ apiVersion: '2024-01-01' })
  const id = document?._id?.replace(/^drafts\./, '')
  const params = {
    draft: `drafts.${id}`,
    published: id,
    slug,
    type: document?._type,
  }
  const query =
    '!defined(*[_type == $type && !(_id in [$draft, $published]) && slug.current == $slug][0]._id)'
  const isUnique = await client.fetch<boolean>(query, params)
  return isUnique
}
