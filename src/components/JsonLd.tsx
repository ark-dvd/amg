interface JsonLdProps {
  data: Record<string, unknown>[]
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <>
      {data.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
    </>
  )
}
