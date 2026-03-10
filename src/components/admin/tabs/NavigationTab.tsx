'use client'

import { useState, useEffect, useCallback } from 'react'
import { adminGet, adminPut } from '@/lib/admin/api-client'
import { getErrorMessage } from '@/lib/admin/error-messages'
import { useUnsavedGuard } from '@/lib/admin/hooks/use-unsaved-guard'
import { SkeletonForm } from '../SkeletonRow'
import { ConfirmDialog } from '../ConfirmDialog'
import type { TabContext } from '../AdminShell'
import type { SiteSettingsDocument } from '@/types/sanity'

interface NavigationTabProps { ctx: TabContext }

export function NavigationTab({ ctx }: NavigationTabProps) {
  const [loading, setLoading] = useState(true)
  const [rev, setRev] = useState('')
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  const [aboutLabel, setAboutLabel] = useState('')
  const [servicesLabel, setServicesLabel] = useState('')
  const [portfolioLabel, setPortfolioLabel] = useState('')
  const [insightsLabel, setInsightsLabel] = useState('')
  const [contactLabel, setContactLabel] = useState('')
  const [ctaLabel, setCtaLabel] = useState('')

  const { showDialog, confirmLeave, cancelLeave } = useUnsavedGuard({ isDirty: dirty })

  const loadData = useCallback(async () => {
    setLoading(true)
    const res = await adminGet<SiteSettingsDocument>('/api/admin/site-settings')
    if (res.success && res.data) {
      const s = res.data
      setRev(s._rev)
      setAboutLabel(s.nav?.aboutLabel ?? '')
      setServicesLabel(s.nav?.servicesLabel ?? '')
      setPortfolioLabel(s.nav?.portfolioLabel ?? '')
      setInsightsLabel(s.nav?.insightsLabel ?? '')
      setContactLabel(s.nav?.contactLabel ?? '')
      setCtaLabel(s.nav?.ctaLabel ?? '')
    }
    setLoading(false)
    setDirty(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  function markDirty() { setDirty(true) }

  async function save() {
    setSaving(true)
    const res = await adminPut<SiteSettingsDocument>('/api/admin/site-settings', {
      nav: {
        aboutLabel: aboutLabel || undefined,
        servicesLabel: servicesLabel || undefined,
        portfolioLabel: portfolioLabel || undefined,
        insightsLabel: insightsLabel || undefined,
        contactLabel: contactLabel || undefined,
        ctaLabel: ctaLabel || undefined,
      },
      _rev: rev,
    })
    setSaving(false)
    if (res.success && res.data) {
      setRev(res.data._rev)
      setDirty(false)
      ctx.addNotification({ type: 'success', message: 'Navigation saved.' })
    } else {
      ctx.addNotification({ type: 'error', message: getErrorMessage(res.error?.code ?? 'SERVER_ERROR') })
    }
  }

  if (loading) return <div className="bg-white rounded-lg shadow-sm"><SkeletonForm /></div>

  const fields = [
    { id: 'nav-about', label: 'About', value: aboutLabel, set: setAboutLabel, placeholder: 'About' },
    { id: 'nav-services', label: 'Services', value: servicesLabel, set: setServicesLabel, placeholder: 'Services' },
    { id: 'nav-portfolio', label: 'Portfolio', value: portfolioLabel, set: setPortfolioLabel, placeholder: 'Portfolio' },
    { id: 'nav-insights', label: 'Insights', value: insightsLabel, set: setInsightsLabel, placeholder: 'Insights' },
    { id: 'nav-contact', label: 'Contact', value: contactLabel, set: setContactLabel, placeholder: 'Contact' },
    { id: 'nav-cta', label: 'CTA Button', value: ctaLabel, set: setCtaLabel, placeholder: 'Get in Touch' },
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 max-w-2xl space-y-6">
      <h2 className="text-lg font-semibold text-charcoal">Navigation Labels</h2>
      <p className="text-sm text-gray-500">Customize the labels shown in the navigation bar and footer links.</p>

      <div className="space-y-4">
        {fields.map((f) => (
          <div key={f.id}>
            <label htmlFor={f.id} className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
            <input
              id={f.id}
              type="text"
              value={f.value}
              onChange={(e) => { f.set(e.target.value); markDirty() }}
              placeholder={f.placeholder}
              maxLength={50}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2"
            />
          </div>
        ))}
      </div>

      <div className="sticky bottom-0 bg-white pt-4 border-t flex items-center gap-4">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="px-6 py-2 text-sm font-medium text-white bg-charcoal hover:bg-gray-800 rounded-lg min-h-[44px] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2"
        >
          {saving ? 'Saving...' : 'Save Navigation'}
        </button>
        {dirty && <span className="text-xs text-gray-400">Unsaved changes</span>}
      </div>

      <ConfirmDialog
        isOpen={showDialog}
        title="Unsaved changes"
        message="You have unsaved changes. Leaving now will discard them."
        confirmLabel="Leave"
        confirmVariant="danger"
        onConfirm={confirmLeave}
        onCancel={cancelLeave}
      />
    </div>
  )
}
