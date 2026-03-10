import { redirect } from 'next/navigation'

export default function AdminPage() {
  redirect('/admin?tab=homepage')
}
