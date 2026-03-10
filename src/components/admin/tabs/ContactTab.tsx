'use client'

import { useState, useEffect, useCallback } from 'react'
import { adminGet, adminPut } from '@/lib/admin/api-client'
import { getErrorMessage } from '@/lib/admin/error-messages'
import { useUnsavedGuard } from '@/lib/admin/hooks/use-unsaved-guard'
import { CharacterCount } from '../CharacterCount'
import { SkeletonForm } from '../SkeletonRow'
import { ConfirmDialog } from '../ConfirmDialog'
import type { TabContext } from '../AdminShell'
import type { SiteSettingsDocument } from '@/types/sanity'

interface ContactTabProps { ctx: TabContext }

export function ContactTab({ ctx }: ContactTabProps) {
  const [loading, setLoading] = useState(true)
  const [rev, setRev] = useState('')
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  const [pageHeading, setPageHeading] = useState('')
  const [pageSubheading, setPageSubheading] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactAddress, setContactAddress] = useState('')
  const [formNameLabel, setFormNameLabel] = useState('')
  const [formEmailLabel, setFormEmailLabel] = useState('')
  const [formPhoneLabel, setFormPhoneLabel] = useState('')
  const [formCompanyLabel, setFormCompanyLabel] = useState('')
  const [formMessageLabel, setFormMessageLabel] = useState('')
  const [formSubmitLabel, setFormSubmitLabel] = useState('')

  const { showDialog, confirmLeave, cancelLeave } = useUnsavedGuard({ isDirty: dirty })

  const loadData = useCallback(async () => {
    setLoading(true)
    const res = await adminGet<SiteSettingsDocument>('/api/admin/site-settings')
    if (res.success && res.data) {
      const s = res.data
      setRev(s._rev)
      setPageHeading(s.contact?.pageHeading ?? '')
      setPageSubheading(s.contact?.pageSubheading ?? '')
      setSuccessMessage(s.contact?.formSuccessMessage ?? '')
      setErrorMessage(s.contact?.formErrorMessage ?? '')
      setContactEmail(s.contactEmail ?? '')
      setContactPhone(s.contactPhone ?? '')
      setContactAddress(s.contactAddress ?? '')
      setFormNameLabel(s.contact?.formNameLabel ?? '')
      setFormEmailLabel(s.contact?.formEmailLabel ?? '')
      setFormPhoneLabel(s.contact?.formPhoneLabel ?? '')
      setFormCompanyLabel(s.contact?.formCompanyLabel ?? '')
      setFormMessageLabel(s.contact?.formMessageLabel ?? '')
      setFormSubmitLabel(s.contact?.formSubmitLabel ?? '')
    }
    setLoading(false)
    setDirty(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  function markDirty() { setDirty(true) }

  async function save() {
    setSaving(true)
    const res = await adminPut<SiteSettingsDocument>('/api/admin/site-settings', {
      contactEmail: contactEmail || undefined,
      contactPhone: contactPhone || undefined,
      contactAddress: contactAddress || undefined,
      contact: {
        pageHeading: pageHeading || undefined,
        pageSubheading: pageSubheading || undefined,
        formNameLabel: formNameLabel || undefined,
        formEmailLabel: formEmailLabel || undefined,
        formPhoneLabel: formPhoneLabel || undefined,
        formCompanyLabel: formCompanyLabel || undefined,
        formMessageLabel: formMessageLabel || undefined,
        formSubmitLabel: formSubmitLabel || undefined,
        formSuccessMessage: successMessage || undefined,
        formErrorMessage: errorMessage || undefined,
      },
      _rev: rev,
    })
    setSaving(false)
    if (res.success && res.data) {
      setRev(res.data._rev)
      setDirty(false)
      ctx.addNotification({ type: 'success', message: 'Contact settings saved.' })
    } else {
      ctx.addNotification({ type: 'error', message: getErrorMessage(res.error?.code ?? 'SERVER_ERROR') })
    }
  }

  if (loading) return <div className="bg-white rounded-lg shadow-sm"><SkeletonForm /></div>

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 max-w-4xl space-y-8">
      <h2 className="text-lg font-semibold text-charcoal">Contact Page</h2>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Page Content</h3>
        <div>
          <label htmlFor="ct-heading" className="block text-sm font-medium text-gray-700 mb-1">Page Heading</label>
          <input id="ct-heading" type="text" value={pageHeading} onChange={(e) => { setPageHeading(e.target.value); markDirty() }} maxLength={100} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
          <div className="flex justify-end mt-1"><CharacterCount current={pageHeading.length} max={100} /></div>
        </div>
        <div>
          <label htmlFor="ct-sub" className="block text-sm font-medium text-gray-700 mb-1">Page Subheading</label>
          <textarea id="ct-sub" value={pageSubheading} onChange={(e) => { setPageSubheading(e.target.value); markDirty() }} maxLength={300} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base resize-y focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
          <div className="flex justify-end mt-1"><CharacterCount current={pageSubheading.length} max={300} /></div>
        </div>
        <div>
          <label htmlFor="ct-success" className="block text-sm font-medium text-gray-700 mb-1">Success Message</label>
          <textarea id="ct-success" value={successMessage} onChange={(e) => { setSuccessMessage(e.target.value); markDirty() }} maxLength={300} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base resize-y focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
        </div>
        <div>
          <label htmlFor="ct-error" className="block text-sm font-medium text-gray-700 mb-1">Error Message</label>
          <textarea id="ct-error" value={errorMessage} onChange={(e) => { setErrorMessage(e.target.value); markDirty() }} maxLength={300} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base resize-y focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Contact Details</h3>
        <div>
          <label htmlFor="ct-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input id="ct-email" type="email" value={contactEmail} onChange={(e) => { setContactEmail(e.target.value); markDirty() }} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
        </div>
        <div>
          <label htmlFor="ct-phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input id="ct-phone" type="tel" value={contactPhone} onChange={(e) => { setContactPhone(e.target.value); markDirty() }} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
        </div>
        <div>
          <label htmlFor="ct-address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <textarea id="ct-address" value={contactAddress} onChange={(e) => { setContactAddress(e.target.value); markDirty() }} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base resize-y focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Form Labels</h3>
        {[
          { id: 'ct-name', label: 'Name Label', value: formNameLabel, set: setFormNameLabel, placeholder: 'Your Name' },
          { id: 'ct-email-label', label: 'Email Label', value: formEmailLabel, set: setFormEmailLabel, placeholder: 'Email Address' },
          { id: 'ct-phone-label', label: 'Phone Label', value: formPhoneLabel, set: setFormPhoneLabel, placeholder: 'Phone (optional)' },
          { id: 'ct-company', label: 'Company Label', value: formCompanyLabel, set: setFormCompanyLabel, placeholder: 'Company (optional)' },
          { id: 'ct-message', label: 'Message Label', value: formMessageLabel, set: setFormMessageLabel, placeholder: 'Message' },
          { id: 'ct-submit', label: 'Submit Label', value: formSubmitLabel, set: setFormSubmitLabel, placeholder: 'Send Message' },
        ].map((f) => (
          <div key={f.id}>
            <label htmlFor={f.id} className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
            <input id={f.id} type="text" value={f.value} onChange={(e) => { f.set(e.target.value); markDirty() }} placeholder={f.placeholder} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
          </div>
        ))}
      </section>

      <div className="sticky bottom-0 bg-white pt-4 border-t flex items-center gap-4">
        <button type="button" onClick={save} disabled={saving} className="px-6 py-2 text-sm font-medium text-white bg-charcoal hover:bg-gray-800 rounded-lg min-h-[44px] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2">
          {saving ? 'Saving...' : 'Save'}
        </button>
        {dirty && <span className="text-xs text-gray-400">Unsaved changes</span>}
      </div>

      <ConfirmDialog isOpen={showDialog} title="Unsaved changes" message="You have unsaved changes. Leaving now will discard them." confirmLabel="Leave" confirmVariant="danger" onConfirm={confirmLeave} onCancel={cancelLeave} />
    </div>
  )
}
