'use client'

import { signOut } from 'next-auth/react'
import { Menu } from 'lucide-react'

interface AdminHeaderProps {
  email: string
  onToggleSidebar: () => void
}

export function AdminHeader({ email, onToggleSidebar }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 h-14 flex items-center px-4 gap-4">
      <button
        type="button"
        onClick={onToggleSidebar}
        className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center text-charcoal"
        aria-label="Toggle sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      <span className="font-serif text-lg font-semibold text-charcoal">AMG Back Office</span>

      <div className="ml-auto flex items-center gap-4">
        <span className="text-sm text-gray-500 hidden sm:inline">{email}</span>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className="text-sm text-gray-600 hover:text-charcoal min-h-[44px] flex items-center px-2 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 rounded"
        >
          Sign Out
        </button>
      </div>
    </header>
  )
}
