import { readClient } from '@/lib/sanity/client'

export async function checkRevConflict(
  entityId: string,
  submittedRev: string
): Promise<boolean> {
  const doc = await readClient.fetch<{ _rev: string } | null>(
    '*[_id == $id][0]{ _rev }',
    { id: entityId }
  )
  if (!doc) return false
  return doc._rev !== submittedRev
}

export async function getCurrentRev(entityId: string): Promise<string | null> {
  const doc = await readClient.fetch<{ _rev: string } | null>(
    '*[_id == $id][0]{ _rev }',
    { id: entityId }
  )
  return doc?._rev ?? null
}
