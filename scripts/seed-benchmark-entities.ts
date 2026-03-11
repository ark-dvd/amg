import { createClient } from '@sanity/client'

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  token: process.env.SANITY_API_TOKEN!,
  apiVersion: '2024-01-01',
  useCdn: false,
})

async function seedBenchmarkEntities() {
  console.log('Seeding Lighthouse CI benchmark entities...')

  const existing = await client.fetch(
    `*[slug.current in ["ci-benchmark-service","ci-benchmark-project","ci-benchmark-article"]]`
  )

  if (existing.length > 0) {
    console.log('Benchmark entities already exist. Skipping seed.')
    return
  }

  const tx = client.transaction()

  tx.createOrReplace({
    _type: 'service',
    _id: 'ci-benchmark-service',
    title: 'CI Benchmark Service',
    slug: { _type: 'slug', current: 'ci-benchmark-service' },
    shortDescription: 'This is a Lighthouse CI benchmark entity. Do not edit or delete.',
    body: [
      {
        _type: 'block',
        _key: 'benchmark-block-1',
        style: 'normal',
        children: [
          {
            _type: 'span',
            _key: 'span-1',
            text: 'This benchmark service entity exists to provide stable content for Lighthouse CI performance testing. It should not be edited, archived, or deleted.',
            marks: [],
          },
        ],
        markDefs: [],
      },
    ],
    isActive: true,
    order: 9999,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  tx.createOrReplace({
    _type: 'project',
    _id: 'ci-benchmark-project',
    title: 'CI Benchmark Project',
    slug: { _type: 'slug', current: 'ci-benchmark-project' },
    shortDescription: 'This is a Lighthouse CI benchmark entity. Do not edit or delete.',
    projectType: 'Benchmark',
    body: [
      {
        _type: 'block',
        _key: 'benchmark-block-2',
        style: 'normal',
        children: [
          {
            _type: 'span',
            _key: 'span-2',
            text: 'This benchmark project entity exists to provide stable content for Lighthouse CI performance testing. It should not be edited, archived, or deleted.',
            marks: [],
          },
        ],
        markDefs: [],
      },
    ],
    isActive: true,
    isArchived: false,
    featuredOnHomepage: false,
    order: 9999,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  tx.createOrReplace({
    _type: 'article',
    _id: 'ci-benchmark-article',
    title: 'CI Benchmark Article',
    slug: { _type: 'slug', current: 'ci-benchmark-article' },
    excerpt: 'This is a Lighthouse CI benchmark entity used for stable performance testing.',
    body: [
      {
        _type: 'block',
        _key: 'benchmark-block-3',
        style: 'normal',
        children: [
          {
            _type: 'span',
            _key: 'span-3',
            text: 'This benchmark article entity exists to provide stable content for Lighthouse CI performance testing. It should not be edited, archived, or deleted.',
            marks: [],
          },
        ],
        markDefs: [],
      },
    ],
    isPublished: true,
    isDraft: false,
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  await tx.commit()
  console.log('Benchmark entities seeded successfully.')
  console.log('WARNING: These entities must never be edited, archived, or deleted.')
  console.log('Slugs: ci-benchmark-service, ci-benchmark-project, ci-benchmark-article')
}

seedBenchmarkEntities().catch(console.error)
