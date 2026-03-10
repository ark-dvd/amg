'use client'

import { useState, useEffect, useCallback } from 'react'
import { adminGet, adminPost, adminPut, adminPatch, adminDelete } from '@/lib/admin/api-client'
import { getErrorMessage } from '@/lib/admin/error-messages'
import { StatusBadge } from '../StatusBadge'
import { SlideOver } from '../SlideOver'
import { ConfirmDialog } from '../ConfirmDialog'
import { ImageUpload } from '../ImageUpload'
import { CharacterCount } from '../CharacterCount'
import { SlugField } from '../SlugField'
import { PortableTextEditor } from '../PortableTextEditor'
import { SkeletonRow } from '../SkeletonRow'
import type { TabContext } from '../AdminShell'
import type { ArticleDocument, SanityImage, PortableTextContent } from '@/types/sanity'
import { Pencil, Trash2, MoreVertical, Plus, Globe, GlobeLock } from 'lucide-react'

interface InsightsTabProps { ctx: TabContext }

interface ArticleForm {
  title: string; slug: string; coverImage: SanityImage | null
  excerpt: string; body: PortableTextContent; category: string
  tags: string[]; authorName: string; seoTitle: string; seoDescription: string
}

const emptyForm: ArticleForm = {
  title: '', slug: '', coverImage: null, excerpt: '', body: [],
  category: '', tags: [], authorName: '', seoTitle: '', seoDescription: '',
}

export function InsightsTab({ ctx }: InsightsTabProps) {
  const [loading, setLoading] = useState(true)
  const [articles, setArticles] = useState<ArticleDocument[]>([])
  const [filter, setFilter] = useState<'all' | 'draft' | 'published'>('all')
  const [slideOpen, setSlideOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editRev, setEditRev] = useState('')
  const [editPublished, setEditPublished] = useState(false)
  const [form, setForm] = useState<ArticleForm>(emptyForm)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ArticleDocument | null>(null)
  const [unpublishTarget, setUnpublishTarget] = useState<ArticleDocument | null>(null)
  const [mobileMenuId, setMobileMenuId] = useState<string | null>(null)
  const [tagInput, setTagInput] = useState('')
  // Settings
  const [settingsRev, setSettingsRev] = useState('')
  const [pageHeading, setPageHeading] = useState('')
  const [pageSubheading, setPageSubheading] = useState('')
  const [settingsSaving, setSettingsSaving] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    const [artRes, settingsRes] = await Promise.all([
      adminGet<ArticleDocument[]>('/api/admin/articles'),
      adminGet<{ _rev: string; insights?: { pageHeading?: string; pageSubheading?: string } }>('/api/admin/site-settings'),
    ])
    if (artRes.success && artRes.data) setArticles(Array.isArray(artRes.data) ? artRes.data : [])
    if (settingsRes.success && settingsRes.data) {
      setSettingsRev(settingsRes.data._rev)
      setPageHeading(settingsRes.data.insights?.pageHeading ?? '')
      setPageSubheading(settingsRes.data.insights?.pageSubheading ?? '')
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const filtered = articles.filter((a) => {
    if (filter === 'draft') return a.isDraft
    if (filter === 'published') return a.isPublished
    return true
  })

  function openCreate() {
    setEditingId(null); setEditRev(''); setEditPublished(false)
    setForm(emptyForm); setFormErrors({}); setDirty(false); setSlideOpen(true)
  }

  function openEdit(a: ArticleDocument) {
    setEditingId(a._id); setEditRev(a._rev); setEditPublished(a.isPublished)
    setForm({
      title: a.title, slug: a.slug.current, coverImage: a.coverImage ?? null,
      excerpt: a.excerpt, body: a.body ?? [], category: a.category ?? '',
      tags: a.tags ?? [], authorName: a.authorName ?? '',
      seoTitle: a.seoTitle ?? '', seoDescription: a.seoDescription ?? '',
    })
    setFormErrors({}); setDirty(false); setSlideOpen(true)
  }

  async function handleSave() {
    setSaving(true); setFormErrors({})
    const payload = {
      title: form.title, slug: form.slug,
      coverImage: form.coverImage ?? undefined, excerpt: form.excerpt,
      body: form.body, category: form.category || undefined,
      tags: form.tags.length > 0 ? form.tags : undefined,
      authorName: form.authorName || undefined,
      seoTitle: form.seoTitle || undefined, seoDescription: form.seoDescription || undefined,
      ...(editingId ? { _rev: editRev } : {}),
    }
    const res = editingId
      ? await adminPut<ArticleDocument>(`/api/admin/articles/${editingId}`, payload)
      : await adminPost<ArticleDocument>('/api/admin/articles', payload)
    setSaving(false)
    if (res.success && res.data) {
      setSlideOpen(false); setDirty(false); loadData()
      ctx.addNotification({
        type: 'success', message: `Article ${editingId ? 'updated' : 'created'}.`,
        viewOnSiteUrl: res.data.isPublished ? `/insights/${res.data.slug.current}` : undefined,
      })
    } else if (res.error?.fieldErrors) {
      setFormErrors(res.error.fieldErrors)
    } else {
      ctx.addNotification({ type: 'error', message: getErrorMessage(res.error?.code ?? 'SERVER_ERROR') })
    }
  }

  async function handlePublish(a: ArticleDocument) {
    const res = await adminPatch<ArticleDocument>(`/api/admin/articles/${a._id}/publish`, { _rev: a._rev })
    if (res.success) { loadData(); ctx.addNotification({ type: 'success', message: 'Article published.', viewOnSiteUrl: `/insights/${a.slug.current}` }) }
    else ctx.addNotification({ type: 'error', message: getErrorMessage(res.error?.code ?? 'SERVER_ERROR') })
  }

  async function handleUnpublish() {
    if (!unpublishTarget) return
    const res = await adminPatch<ArticleDocument>(`/api/admin/articles/${unpublishTarget._id}/unpublish`, { _rev: unpublishTarget._rev })
    setUnpublishTarget(null)
    if (res.success) { loadData(); ctx.addNotification({ type: 'success', message: 'Article unpublished.' }) }
    else ctx.addNotification({ type: 'error', message: getErrorMessage(res.error?.code ?? 'SERVER_ERROR') })
  }

  async function handleDelete() {
    if (!deleteTarget) return
    const res = await adminDelete<{ deleted: boolean }>(`/api/admin/articles/${deleteTarget._id}`)
    setDeleteTarget(null)
    if (res.success) { loadData(); ctx.addNotification({ type: 'success', message: 'Article deleted.' }) }
    else ctx.addNotification({ type: 'error', message: getErrorMessage(res.error?.code ?? 'SERVER_ERROR') })
  }

  async function saveSettings() {
    setSettingsSaving(true)
    const res = await adminPut<{ _rev: string }>('/api/admin/site-settings', {
      insights: { pageHeading, pageSubheading }, _rev: settingsRev,
    })
    setSettingsSaving(false)
    if (res.success && res.data) { setSettingsRev(res.data._rev); ctx.addNotification({ type: 'success', message: 'Insights page settings saved.' }) }
    else ctx.addNotification({ type: 'error', message: getErrorMessage(res.error?.code ?? 'SERVER_ERROR') })
  }

  function updateForm(patch: Partial<ArticleForm>) { setForm((prev) => ({ ...prev, ...patch })); setDirty(true) }

  function handleTagKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      updateForm({ tags: [...form.tags, tagInput.trim()] })
      setTagInput('')
    }
  }

  if (loading) return <div className="bg-white rounded-lg shadow-sm divide-y">{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}</div>

  return (
    <div className="max-w-5xl space-y-6">
      {/* Settings */}
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-charcoal">Insights Page Settings</h2>
        <div>
          <label htmlFor="ins-heading" className="block text-sm font-medium text-gray-700 mb-1">Page Heading</label>
          <input id="ins-heading" type="text" value={pageHeading} onChange={(e) => setPageHeading(e.target.value)} maxLength={100} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
        </div>
        <div>
          <label htmlFor="ins-sub" className="block text-sm font-medium text-gray-700 mb-1">Page Subheading</label>
          <input id="ins-sub" type="text" value={pageSubheading} onChange={(e) => setPageSubheading(e.target.value)} maxLength={250} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
        </div>
        <button type="button" onClick={saveSettings} disabled={settingsSaving} className="px-6 py-2 text-sm font-medium text-white bg-charcoal hover:bg-gray-800 rounded-lg min-h-[44px] disabled:opacity-50">
          {settingsSaving ? 'Saving...' : 'Save Insights Page Settings'}
        </button>
      </div>

      {/* Filters + New */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(['all', 'draft', 'published'] as const).map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)} className={`px-3 py-1.5 text-sm rounded-lg min-h-[44px] capitalize ${filter === f ? 'bg-charcoal text-white' : 'bg-white text-gray-700 border'}`}>{f}</button>
          ))}
        </div>
        <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-charcoal hover:bg-gray-800 rounded-lg min-h-[44px]">
          <Plus className="h-4 w-4" /> New Article
        </button>
      </div>

      {/* List */}
      <div className="bg-white rounded-lg shadow-sm divide-y">
        {filtered.length === 0 ? (
          <div className="p-8 text-center"><p className="text-gray-500">No articles found.</p></div>
        ) : filtered.map((a) => (
          <div key={a._id} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="font-medium text-charcoal text-sm truncate">{a.title}</span>
              <StatusBadge type={a.isPublished ? 'published' : 'draft'} />
            </div>
            <div className="hidden md:flex gap-1 shrink-0">
              <button type="button" onClick={() => openEdit(a)} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-charcoal" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
              {a.isDraft ? (
                <button type="button" onClick={() => handlePublish(a)} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-green-600" aria-label="Publish"><Globe className="h-4 w-4" /></button>
              ) : (
                <button type="button" onClick={() => setUnpublishTarget(a)} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-orange-600" aria-label="Unpublish"><GlobeLock className="h-4 w-4" /></button>
              )}
              <button type="button" onClick={() => setDeleteTarget(a)} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-red-600" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
            </div>
            <div className="md:hidden relative">
              <button type="button" onClick={() => setMobileMenuId(mobileMenuId === a._id ? null : a._id)} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400"><MoreVertical className="h-4 w-4" /></button>
              {mobileMenuId === a._id && (
                <div className="absolute right-0 top-full z-20 bg-white border rounded-lg shadow-lg py-1 w-36">
                  <button type="button" onClick={() => { openEdit(a); setMobileMenuId(null) }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 min-h-[44px]">Edit</button>
                  {a.isDraft ? (
                    <button type="button" onClick={() => { handlePublish(a); setMobileMenuId(null) }} className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-gray-50 min-h-[44px]">Publish</button>
                  ) : (
                    <button type="button" onClick={() => { setUnpublishTarget(a); setMobileMenuId(null) }} className="w-full text-left px-4 py-2 text-sm text-orange-600 hover:bg-gray-50 min-h-[44px]">Unpublish</button>
                  )}
                  <button type="button" onClick={() => { setDeleteTarget(a); setMobileMenuId(null) }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 min-h-[44px]">Delete</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit SlideOver */}
      <SlideOver isOpen={slideOpen} onClose={() => setSlideOpen(false)} title={editingId ? 'Edit Article' : 'New Article'} isDirty={dirty}>
        <div className="space-y-5">
          {editPublished && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
              🟢 This article is published and visible on the public site. Changes you save will appear immediately.
            </div>
          )}

          <div>
            <label htmlFor="art-title" className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
            <input id="art-title" type="text" value={form.title} onChange={(e) => updateForm({ title: e.target.value })} maxLength={200} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
            <div className="flex justify-between mt-1">{formErrors.title && <span className="text-xs text-red-600">{formErrors.title}</span>}<CharacterCount current={form.title.length} max={200} /></div>
          </div>

          <SlugField value={form.slug} onChange={(v) => updateForm({ slug: v })} fromTitle={form.title} isFirstSave={!editingId} urlPrefix="amgpm.com/insights" />

          <ImageUpload value={form.coverImage} onChange={(v) => updateForm({ coverImage: v })} label="Cover Image" />

          <div>
            <label htmlFor="art-excerpt" className="block text-sm font-medium text-gray-700 mb-1">Excerpt <span className="text-red-500">*</span></label>
            <textarea id="art-excerpt" value={form.excerpt} onChange={(e) => updateForm({ excerpt: e.target.value })} maxLength={300} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base resize-y focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
            <div className="flex justify-end mt-1"><CharacterCount current={form.excerpt.length} max={300} /></div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Body <span className="text-red-500">*</span></label>
            <PortableTextEditor value={form.body} onChange={(v) => updateForm({ body: v })} />
          </div>

          <div>
            <label htmlFor="art-category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <input id="art-category" type="text" value={form.category} onChange={(e) => updateForm({ category: e.target.value })} maxLength={50} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
          </div>

          <div>
            <label htmlFor="art-tags" className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.tags.map((tag, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm">
                  {tag}
                  <button type="button" onClick={() => updateForm({ tags: form.tags.filter((_, j) => j !== i) })} className="text-gray-400 hover:text-red-600">&times;</button>
                </span>
              ))}
            </div>
            <input id="art-tags" type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown} placeholder="Type and press Enter" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
          </div>

          <div>
            <label htmlFor="art-author" className="block text-sm font-medium text-gray-700 mb-1">Author Name</label>
            <input id="art-author" type="text" value={form.authorName} onChange={(e) => updateForm({ authorName: e.target.value })} maxLength={100} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
          </div>

          <details className="border-t pt-4">
            <summary className="text-sm font-medium text-gray-700 cursor-pointer min-h-[44px] flex items-center">SEO</summary>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="art-seo-title" className="block text-sm font-medium text-gray-700 mb-1">SEO Title</label>
                <input id="art-seo-title" type="text" value={form.seoTitle} onChange={(e) => updateForm({ seoTitle: e.target.value })} maxLength={70} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
                <div className="flex justify-end mt-1"><CharacterCount current={form.seoTitle.length} max={70} /></div>
              </div>
              <div>
                <label htmlFor="art-seo-desc" className="block text-sm font-medium text-gray-700 mb-1">SEO Description</label>
                <textarea id="art-seo-desc" value={form.seoDescription} onChange={(e) => updateForm({ seoDescription: e.target.value })} maxLength={160} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base resize-y focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
                <div className="flex justify-end mt-1"><CharacterCount current={form.seoDescription.length} max={160} /></div>
              </div>
            </div>
          </details>

          <div className="sticky bottom-0 bg-white pt-4 border-t">
            <button type="button" onClick={handleSave} disabled={saving} className="w-full sm:w-auto px-6 py-2 text-sm font-medium text-white bg-charcoal hover:bg-gray-800 rounded-lg min-h-[44px] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2">
              {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Article'}
            </button>
          </div>
        </div>
      </SlideOver>

      <ConfirmDialog isOpen={!!unpublishTarget} title={`Unpublish "${unpublishTarget?.title ?? ''}"?`} message="The article will no longer be visible on the public site." confirmLabel="Unpublish" confirmVariant="danger" onConfirm={handleUnpublish} onCancel={() => setUnpublishTarget(null)} />
      <ConfirmDialog isOpen={!!deleteTarget} title={`Delete "${deleteTarget?.title ?? ''}"?`} message="This action cannot be undone." confirmLabel="Delete" confirmVariant="danger" onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  )
}
