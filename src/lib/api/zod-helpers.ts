import { z } from 'zod'

export const sanityImageSchema = z.object({
  _type: z.literal('image'),
  asset: z.object({ _ref: z.string(), _type: z.literal('reference') }),
  hotspot: z
    .object({
      x: z.number(),
      y: z.number(),
      height: z.number(),
      width: z.number(),
    })
    .optional(),
  crop: z
    .object({
      top: z.number(),
      bottom: z.number(),
      left: z.number(),
      right: z.number(),
    })
    .optional(),
})

export const portableTextSchema = z.array(z.record(z.unknown())).min(1)

export const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function parseZodErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {}
  for (const issue of error.issues) {
    const path = issue.path.join('.')
    fieldErrors[path || '_root'] = issue.message
  }
  return fieldErrors
}
