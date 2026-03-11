import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

const TYPE_TO_PATHS: Record<string, string[]> = {
  hero:         ['/'],
  about:        ['/about'],
  siteSettings: ['/', '/about', '/services', '/portfolio', '/insights', '/contact'],
  service:      ['/services'],
  project:      ['/', '/portfolio'],
  article:      ['/insights'],
  testimonial:  ['/portfolio'],
}

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 })
  }

  let body: { _type?: string; slug?: { current?: string } }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ message: 'Invalid body' }, { status: 400 })
  }

  const { _type, slug } = body
  const paths = TYPE_TO_PATHS[_type ?? ''] ?? []

  for (const path of paths) {
    revalidatePath(path)
  }

  if (slug?.current) {
    if (_type === 'service')  revalidatePath(`/services/${slug.current}`)
    if (_type === 'project')  revalidatePath(`/portfolio/${slug.current}`)
    if (_type === 'article')  revalidatePath(`/insights/${slug.current}`)
  }

  return NextResponse.json({
    revalidated: true,
    paths: [
      ...paths,
      ...(slug?.current && _type
        ? [`/${_type === 'service' ? 'services' : _type === 'project' ? 'portfolio' : 'insights'}/${slug.current}`]
        : []),
    ],
  })
}
