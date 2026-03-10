'use client'

import { useState, useEffect, useCallback } from 'react'
import { adminGet, adminPut } from '@/lib/admin/api-client'
import { getErrorMessage } from '@/lib/admin/error-messages'
import { useUnsavedGuard } from '@/lib/admin/hooks/use-unsaved-guard'
import { ImageUpload } from '../ImageUpload'
import { CharacterCount } from '../CharacterCount'
import { PortableTextEditor } from '../PortableTextEditor'
import { SkeletonForm } from '../SkeletonRow'
import { ConfirmDialog } from '../ConfirmDialog'
import type { TabContext } from '../AdminShell'
import type { AboutDocument, SanityImage, PortableTextContent } from '@/types/sanity'

interface AboutTabProps {
  ctx: TabContext
}

export function AboutTab({ ctx }: AboutTabProps) {
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(true)
  const [rev, setRev] = useState('')
  const [saving, setSaving] = useState(false)
  const [conflict, setConflict] = useState(false)
  const [dirty, setDirty] = useState(false)

  const [coverImage, setCoverImage] = useState<SanityImage | null>(null)
  const [pageTitle, setPageTitle] = useState('')
  const [intro, setIntro] = useState('')
  const [body, setBody] = useState<PortableTextContent>([])
  const [teamSectionTitle, setTeamSectionTitle] = useState('')

  const { showDialog, guardedNavigate, confirmLeave, cancelLeave } = useUnsavedGuard({ isDirty: dirty })

  const loadData = useCallback(async () => {
    setLoading(true)
    const res = await adminGet<AboutDocument>('/api/admin/about')
    if (res.success && res.data) {
      const d = res.data
      setRev(d._rev)
      setCoverImage(d.coverImage ?? null)
      setPageTitle(d.pageTitle)
      setIntro(d.intro)
      setBody(d.body ?? [])
      setTeamSectionTitle(d.teamSectionTitle ?? '')
      setInitialized(true)
    } else if (res.initialized === false) {
      setInitialized(false)
    }
    setLoading(false)
    setDirty(false)
    setConflict(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  function markDirty() { setDirty(true) }

  async function save() {
    setSaving(true)
    setConflict(false)
    const payload = {
      coverImage: coverImage ?? undefined,
      pageTitle,
      intro,
      body,
      teamSectionTitle: teamSectionTitle || undefined,
      _rev: rev,
    }
    const res = await adminPut<AboutDocument>('/api/admin/about', payload)
    setSaving(false)
    if (res.success && res.data) {
      setRev(res.data._rev)
      setDirty(false)
      ctx.addNotification({ type: 'success', message: 'About page saved.', viewOnSiteUrl: '/about' })
    } else if (res.error?.code === 'CONFLICT') {
      setConflict(true)
    } else {
      const msg = getErrorMessage(res.error?.code ?? 'SERVER_ERROR')
      if (res.error?.mayHavePersisted) {
        ctx.addNotification({ type: 'warning', message: msg })
      } else {
        ctx.addNotification({ type: 'error', message: msg, retryable: res.error?.retryable })
      }
    }
  }

  if (loading) return <div className="bg-white rounded-lg shadow-sm"><SkeletonForm /></div>

  if (!initialized) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <p className="text-gray-500 mb-4">This section has not been set up yet.</p>
        <button type="button" onClick={save} className="px-6 py-2 text-sm font-medium text-white bg-charcoal hover:bg-gray-800 rounded-lg min-h-[44px]">
          Initialize About
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 max-w-4xl space-y-6">
      <h2 className="text-lg font-semibold text-charcoal">About Page</h2>

      {conflict && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800" role="alert">
          ⚠️ This content was modified in another session. <button type="button" onClick={loadData} className="underline font-medium">Reload Content</button>
        </div>
      )}

      <ImageUpload value={coverImage} onChange={(v) => { setCoverImage(v); markDirty() }} label="Cover Image" />

      <div>
        <label htmlFor="about-title" className="block text-sm font-medium text-gray-700 mb-1">Page Title <span className="text-red-500">*</span></label>
        <input id="about-title" type="text" value={pageTitle} onChange={(e) => { setPageTitle(e.target.value); markDirty() }} maxLength={100} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
        <div className="flex justify-end mt-1"><CharacterCount current={pageTitle.length} max={100} /></div>
      </div>

      <div>
        <label htmlFor="about-intro" className="block text-sm font-medium text-gray-700 mb-1">Intro <span className="text-red-500">*</span></label>
        <textarea id="about-intro" value={intro} onChange={(e) => { setIntro(e.target.value); markDirty() }} maxLength={500} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base resize-y focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
        <div className="flex justify-end mt-1"><CharacterCount current={intro.length} max={500} /></div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
        <PortableTextEditor value={body} onChange={(v) => { setBody(v); markDirty() }} />
      </div>

      <div>
        <label htmlFor="about-team-title" className="block text-sm font-medium text-gray-700 mb-1">Team Section Title</label>
        <input id="about-team-title" type="text" value={teamSectionTitle} onChange={(e) => { setTeamSectionTitle(e.target.value); markDirty() }} maxLength={80} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
        <div className="flex justify-end mt-1"><CharacterCount current={teamSectionTitle.length} max={80} /></div>
      </div>

      <div className="sticky bottom-0 bg-white pt-4 border-t border-gray-100 flex items-center gap-4">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="px-6 py-2 text-sm font-medium text-white bg-charcoal hover:bg-gray-800 rounded-lg min-h-[44px] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2"
        >
          {saving ? 'Saving...' : 'Save'}
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
