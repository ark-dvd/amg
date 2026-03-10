'use client'

import { useState, useEffect, useCallback } from 'react'
import { adminGet, adminPost, adminPut, adminPatch, adminDelete } from '@/lib/admin/api-client'
import { getErrorMessage } from '@/lib/admin/error-messages'
import { StatusBadge } from '../StatusBadge'
import { ToggleSwitch } from '../ToggleSwitch'
import { SlideOver } from '../SlideOver'
import { ConfirmDialog } from '../ConfirmDialog'
import { ImageUpload } from '../ImageUpload'
import { CharacterCount } from '../CharacterCount'
import { SlugField } from '../SlugField'
import { PortableTextEditor } from '../PortableTextEditor'
import { SkeletonRow } from '../SkeletonRow'
import { ReorderableList } from '../ReorderableList'
import type { TabContext } from '../AdminShell'
import type { ServiceDocument, SanityImage, PortableTextContent } from '@/types/sanity'
import { Pencil, Trash2, MoreVertical, Plus } from 'lucide-react'

interface ServicesTabProps {
  ctx: TabContext
}

interface ServiceForm {
  title: string
  slug: string
  coverImage: SanityImage | null
  shortDescription: string
  body: PortableTextContent
  icon: string
  isActive: boolean
  order: number
  seoTitle: string
  seoDescription: string
}

const emptyForm: ServiceForm = {
  title: '', slug: '', coverImage: null, shortDescription: '',
  body: [], icon: '', isActive: false, order: 0,
  seoTitle: '', seoDescription: '',
}

export function ServicesTab({ ctx }: ServicesTabProps) {
  const [loading, setLoading] = useState(true)
  const [services, setServices] = useState<ServiceDocument[]>([])
  const [slideOpen, setSlideOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editRev, setEditRev] = useState('')
  const [form, setForm] = useState<ServiceForm>(emptyForm)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ServiceDocument | null>(null)
  const [dirty, setDirty] = useState(false)
  const [mobileMenuId, setMobileMenuId] = useState<string | null>(null)

  const loadServices = useCallback(async () => {
    setLoading(true)
    const res = await adminGet<ServiceDocument[]>('/api/admin/services')
    if (res.success && res.data) {
      setServices(Array.isArray(res.data) ? res.data : [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadServices() }, [loadServices])

  function openCreate() {
    setEditingId(null)
    setEditRev('')
    setForm({ ...emptyForm, order: services.length })
    setFormErrors({})
    setDirty(false)
    setSlideOpen(true)
  }

  function openEdit(s: ServiceDocument) {
    setEditingId(s._id)
    setEditRev(s._rev)
    setForm({
      title: s.title, slug: s.slug.current,
      coverImage: s.coverImage ?? null, shortDescription: s.shortDescription,
      body: s.body ?? [], icon: s.icon ?? '', isActive: s.isActive,
      order: s.order, seoTitle: s.seoTitle ?? '', seoDescription: s.seoDescription ?? '',
    })
    setFormErrors({})
    setDirty(false)
    setSlideOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    setFormErrors({})
    const payload = {
      title: form.title, slug: form.slug,
      shortDescription: form.shortDescription, body: form.body,
      coverImage: form.coverImage ?? undefined, icon: form.icon || undefined,
      isActive: form.isActive, order: form.order,
      seoTitle: form.seoTitle || undefined, seoDescription: form.seoDescription || undefined,
      ...(editingId ? { _rev: editRev } : {}),
    }

    const res = editingId
      ? await adminPut<ServiceDocument>(`/api/admin/services/${editingId}`, payload)
      : await adminPost<ServiceDocument>('/api/admin/services', payload)

    setSaving(false)
    if (res.success && res.data) {
      setSlideOpen(false)
      setDirty(false)
      loadServices()
      const slug = res.data.slug.current
      ctx.addNotification({
        type: 'success',
        message: `Service ${editingId ? 'updated' : 'created'}.`,
        viewOnSiteUrl: res.data.isActive ? `/services/${slug}` : undefined,
      })
    } else if (res.error?.fieldErrors) {
      setFormErrors(res.error.fieldErrors)
      ctx.addNotification({ type: 'error', message: getErrorMessage('VALIDATION_FAILED') })
    } else {
      ctx.addNotification({ type: 'error', message: getErrorMessage(res.error?.code ?? 'SERVER_ERROR'), retryable: res.error?.retryable })
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    const res = await adminDelete<{ deleted: boolean }>(`/api/admin/services/${deleteTarget._id}`)
    setDeleteTarget(null)
    if (res.success) {
      loadServices()
      ctx.addNotification({ type: 'success', message: 'Service deleted.' })
    } else {
      ctx.addNotification({ type: 'error', message: getErrorMessage(res.error?.code ?? 'SERVER_ERROR') })
    }
  }

  async function toggleActive(s: ServiceDocument) {
    const newVal = !s.isActive
    setServices((prev) => prev.map((x) => x._id === s._id ? { ...x, isActive: newVal } : x))
    const res = await adminPut<ServiceDocument>(`/api/admin/services/${s._id}`, {
      ...s, slug: s.slug.current, isActive: newVal, _rev: s._rev,
    })
    if (!res.success) {
      setServices((prev) => prev.map((x) => x._id === s._id ? { ...x, isActive: !newVal } : x))
      ctx.addNotification({ type: 'error', message: getErrorMessage(res.error?.code ?? 'SERVER_ERROR') })
    }
  }

  async function handleReorder(newOrder: Array<{ id: string; order: number }>) {
    const res = await adminPatch<unknown>('/api/admin/services/reorder', { items: newOrder })
    if (!res.success) {
      ctx.addNotification({ type: 'error', message: 'Reorder failed. The previous order has been restored.' })
      loadServices()
    }
  }

  function updateForm(patch: Partial<ServiceForm>) {
    setForm((prev) => ({ ...prev, ...patch }))
    setDirty(true)
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-charcoal">Services</h2>
        <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-charcoal hover:bg-gray-800 rounded-lg min-h-[44px] focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2">
          <Plus className="h-4 w-4" /> New Service
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow-sm divide-y">{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}</div>
      ) : services.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-500 mb-4">No services yet.</p>
          <button type="button" onClick={openCreate} className="text-gold hover:text-gold/80 font-medium">New Service</button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm">
          {/* Header */}
          <div className="hidden md:grid grid-cols-[1fr_100px_60px_120px_80px] gap-4 px-4 py-2 text-xs font-medium text-gray-500 uppercase border-b">
            <span>Title</span><span>Status</span><span>Order</span><span>Updated</span><span>Actions</span>
          </div>
          <ReorderableList
            items={services.map((s) => ({ ...s, id: s._id }))}
            onReorder={handleReorder}
            onReorderError={() => ctx.addNotification({ type: 'error', message: 'Reorder failed. The previous order has been restored.' })}
            renderItem={(item, actions) => {
              const s = item as ServiceDocument & { id: string }
              return (
                <div className="grid grid-cols-1 md:grid-cols-[1fr_100px_60px_120px_80px] gap-2 md:gap-4 items-center px-4 py-3">
                  <span className="font-medium text-charcoal text-sm truncate">{s.title}</span>
                  <StatusBadge type={s.isActive ? 'active' : 'inactive'} />
                  <span className="text-xs text-gray-500 hidden md:block">{s.order}</span>
                  <span className="text-xs text-gray-500 hidden md:block">{new Date(s.updatedAt).toLocaleDateString()}</span>
                  {/* Desktop actions */}
                  <div className="hidden md:flex gap-1">
                    <button type="button" onClick={() => openEdit(s)} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-charcoal" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                    <button type="button" onClick={() => setDeleteTarget(s)} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-red-600" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  {/* Mobile actions */}
                  <div className="md:hidden relative">
                    <button type="button" onClick={() => setMobileMenuId(mobileMenuId === s._id ? null : s._id)} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400" aria-label="Actions"><MoreVertical className="h-4 w-4" /></button>
                    {mobileMenuId === s._id && (
                      <div className="absolute right-0 top-full z-20 bg-white border rounded-lg shadow-lg py-1 w-36">
                        <button type="button" onClick={() => { openEdit(s); setMobileMenuId(null) }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 min-h-[44px]">Edit</button>
                        <button type="button" onClick={() => { setDeleteTarget(s); setMobileMenuId(null) }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 min-h-[44px]">Delete</button>
                      </div>
                    )}
                  </div>
                </div>
              )
            }}
          />
        </div>
      )}

      {/* Create/Edit SlideOver */}
      <SlideOver isOpen={slideOpen} onClose={() => setSlideOpen(false)} title={editingId ? 'Edit Service' : 'New Service'} isDirty={dirty}>
        <div className="space-y-5">
          <div>
            <label htmlFor="svc-title" className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
            <input id="svc-title" type="text" value={form.title} onChange={(e) => updateForm({ title: e.target.value })} maxLength={100} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
            <div className="flex justify-between mt-1">
              {formErrors.title && <span className="text-xs text-red-600">{formErrors.title}</span>}
              <CharacterCount current={form.title.length} max={100} />
            </div>
          </div>

          <SlugField value={form.slug} onChange={(v) => updateForm({ slug: v })} fromTitle={form.title} isFirstSave={!editingId} urlPrefix="amgpm.com/services" maxLength={80} />

          <ImageUpload value={form.coverImage} onChange={(v) => updateForm({ coverImage: v })} label="Cover Image" />

          <div>
            <label htmlFor="svc-desc" className="block text-sm font-medium text-gray-700 mb-1">Short Description <span className="text-red-500">*</span></label>
            <textarea id="svc-desc" value={form.shortDescription} onChange={(e) => updateForm({ shortDescription: e.target.value })} maxLength={200} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base resize-y focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
            <div className="flex justify-between mt-1">
              {formErrors.shortDescription && <span className="text-xs text-red-600">{formErrors.shortDescription}</span>}
              <CharacterCount current={form.shortDescription.length} max={200} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Body <span className="text-red-500">*</span></label>
            <PortableTextEditor value={form.body} onChange={(v) => updateForm({ body: v })} />
          </div>

          <div>
            <label htmlFor="svc-icon" className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
            <input id="svc-icon" type="text" value={form.icon} onChange={(e) => updateForm({ icon: e.target.value })} maxLength={50} placeholder="e.g. building-2" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
          </div>

          <ToggleSwitch checked={form.isActive} onChange={(v) => updateForm({ isActive: v })} label="Active" />

          <div>
            <label htmlFor="svc-order" className="block text-sm font-medium text-gray-700 mb-1">Order</label>
            <input id="svc-order" type="number" min={0} value={form.order} onChange={(e) => updateForm({ order: parseInt(e.target.value) || 0 })} className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
          </div>

          {/* SEO section */}
          <details className="border-t pt-4">
            <summary className="text-sm font-medium text-gray-700 cursor-pointer min-h-[44px] flex items-center">SEO</summary>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="svc-seo-title" className="block text-sm font-medium text-gray-700 mb-1">SEO Title</label>
                <input id="svc-seo-title" type="text" value={form.seoTitle} onChange={(e) => updateForm({ seoTitle: e.target.value })} maxLength={70} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
                <div className="flex justify-end mt-1"><CharacterCount current={form.seoTitle.length} max={70} /></div>
              </div>
              <div>
                <label htmlFor="svc-seo-desc" className="block text-sm font-medium text-gray-700 mb-1">SEO Description</label>
                <textarea id="svc-seo-desc" value={form.seoDescription} onChange={(e) => updateForm({ seoDescription: e.target.value })} maxLength={160} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base resize-y focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
                <div className="flex justify-end mt-1"><CharacterCount current={form.seoDescription.length} max={160} /></div>
              </div>
            </div>
          </details>

          <div className="sticky bottom-0 bg-white pt-4 border-t">
            <button type="button" onClick={handleSave} disabled={saving} className="w-full sm:w-auto px-6 py-2 text-sm font-medium text-white bg-charcoal hover:bg-gray-800 rounded-lg min-h-[44px] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2">
              {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Service'}
            </button>
          </div>
        </div>
      </SlideOver>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title={`Delete "${deleteTarget?.title ?? ''}"?`}
        message="This action cannot be undone."
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
