import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AdminShell } from '@/components/admin/AdminShell'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AMG Back Office',
  robots: { index: false, follow: false },
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/admin/login')

  return <AdminShell session={session}>{children}</AdminShell>
}
