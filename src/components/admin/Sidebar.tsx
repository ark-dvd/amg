'use client'

import {
  Home, User, Briefcase, FolderOpen, FileText, Mail,
  Settings, Navigation, X,
} from 'lucide-react'

export type TabId =
  | 'homepage' | 'about' | 'services' | 'portfolio'
  | 'insights' | 'contact' | 'site-settings' | 'navigation'

interface SidebarProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  mobileOpen: boolean
  onCloseMobile: () => void
}

const pages: Array<{ id: TabId; label: string; icon: typeof Home }> = [
  { id: 'homepage', label: 'Homepage', icon: Home },
  { id: 'about', label: 'About', icon: User },
  { id: 'services', label: 'Services', icon: Briefcase },
  { id: 'portfolio', label: 'Portfolio', icon: FolderOpen },
  { id: 'insights', label: 'Insights', icon: FileText },
  { id: 'contact', label: 'Contact', icon: Mail },
]

const globals: Array<{ id: TabId; label: string; icon: typeof Settings }> = [
  { id: 'site-settings', label: 'Site Settings', icon: Settings },
  { id: 'navigation', label: 'Navigation', icon: Navigation },
]

function NavItem({
  item,
  active,
  onClick,
}: {
  item: { id: TabId; label: string; icon: typeof Home }
  active: boolean
  onClick: () => void
}) {
  const Icon = item.icon
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors
        min-h-[44px]
        focus:outline-none focus:ring-2 focus:ring-gold focus:ring-inset
        ${active
          ? 'border-l-[3px] border-gold bg-white/10 text-white font-medium'
          : 'border-l-[3px] border-transparent text-gray-400 hover:text-white hover:bg-white/5'
        }
      `}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="hidden lg:inline">{item.label}</span>
    </button>
  )
}

export function Sidebar({ activeTab, onTabChange, mobileOpen, onCloseMobile }: SidebarProps) {
  const content = (
    <nav className="flex flex-col h-full py-4" aria-label="Admin navigation">
      <div className="mb-2 px-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pages</p>
      </div>
      {pages.map((item) => (
        <NavItem
          key={item.id}
          item={item}
          active={activeTab === item.id}
          onClick={() => { onTabChange(item.id); onCloseMobile() }}
        />
      ))}

      <div className="mt-6 mb-2 px-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Global</p>
      </div>
      {globals.map((item) => (
        <NavItem
          key={item.id}
          item={item}
          active={activeTab === item.id}
          onClick={() => { onTabChange(item.id); onCloseMobile() }}
        />
      ))}
    </nav>
  )

  return (
    <>
      {/* Desktop / Tablet sidebar */}
      <aside className="hidden md:flex flex-col w-16 lg:w-56 bg-charcoal shrink-0">
        {content}
      </aside>

      {/* Mobile overlay sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/30" onClick={onCloseMobile} />
          <aside className="fixed inset-y-0 left-0 w-64 bg-charcoal z-50 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <span className="text-white font-serif font-semibold">Menu</span>
              <button
                type="button"
                onClick={onCloseMobile}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {content}
          </aside>
        </div>
      )}
    </>
  )
}
