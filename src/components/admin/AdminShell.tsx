'use client'

import { useState, useCallback, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import type { Session } from 'next-auth'
import { SessionProvider } from 'next-auth/react'
import { AdminHeader } from './AdminHeader'
import { Sidebar, type TabId } from './Sidebar'
import { NotificationStack } from './NotificationStack'
import { useNotifications, type Notification } from '@/lib/admin/hooks/use-notifications'
import { ensureCsrfToken } from '@/lib/admin/csrf'
import { useEffect } from 'react'

// Lazy-load tab components
import { HomepageTab } from './tabs/HomepageTab'
import { AboutTab } from './tabs/AboutTab'
import { ServicesTab } from './tabs/ServicesTab'
import { PortfolioTab } from './tabs/PortfolioTab'
import { InsightsTab } from './tabs/InsightsTab'
import { ContactTab } from './tabs/ContactTab'
import { SiteSettingsTab } from './tabs/SiteSettingsTab'
import { NavigationTab } from './tabs/NavigationTab'

interface AdminShellProps {
  session: Session
  children?: React.ReactNode
}

export interface TabContext {
  addNotification: (n: Omit<Notification, 'id'>) => string
}

const validTabs: TabId[] = ['homepage', 'about', 'services', 'portfolio', 'insights', 'contact', 'site-settings', 'navigation']

export function AdminShell({ session }: AdminShellProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab') as TabId | null
  const activeTab: TabId = tabParam && validTabs.includes(tabParam) ? tabParam : 'homepage'
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const { notifications, addNotification, removeNotification } = useNotifications()

  useEffect(() => {
    ensureCsrfToken()
  }, [])

  const handleTabChange = useCallback(
    (tab: TabId) => {
      router.push(`/admin?tab=${tab}`, { scroll: false })
    },
    [router]
  )

  const ctx: TabContext = useMemo(() => ({ addNotification }), [addNotification])

  const email = session.user?.email ?? ''

  return (
    <SessionProvider session={session}>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-gold focus:text-white focus:rounded">
        Skip to main content
      </a>

      <div className="flex flex-col h-screen bg-[#f8f7f4]">
        <AdminHeader email={email} onToggleSidebar={() => setMobileSidebarOpen((v) => !v)} />

        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            mobileOpen={mobileSidebarOpen}
            onCloseMobile={() => setMobileSidebarOpen(false)}
          />

          <main id="main-content" className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {activeTab === 'homepage' && <HomepageTab ctx={ctx} />}
            {activeTab === 'about' && <AboutTab ctx={ctx} />}
            {activeTab === 'services' && <ServicesTab ctx={ctx} />}
            {activeTab === 'portfolio' && <PortfolioTab ctx={ctx} />}
            {activeTab === 'insights' && <InsightsTab ctx={ctx} />}
            {activeTab === 'contact' && <ContactTab ctx={ctx} />}
            {activeTab === 'site-settings' && <SiteSettingsTab ctx={ctx} />}
            {activeTab === 'navigation' && <NavigationTab ctx={ctx} />}
          </main>
        </div>
      </div>

      <NotificationStack notifications={notifications} onDismiss={removeNotification} />
    </SessionProvider>
  )
}
