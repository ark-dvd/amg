import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './src/sanity/schemas'
import { structure } from './src/sanity/lib/structure'

export default defineConfig({
  name: 'amg-studio',
  title: 'AMG Studio',
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? 'ifw94eds',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  plugins: [
    structureTool({ structure }),
    visionTool(),
  ],
  schema: {
    types: schemaTypes,
  },
})
