'use client'

import { useState, useEffect, useCallback } from 'react'
import { adminGet, adminPost, adminPut, adminPatch, adminDelete } from '@/lib/admin/api-client'
import { getErrorMessage } from '@/lib/admin/error-messages'
import { StatusBadge } from '../StatusBadge'
import { ToggleSwitch } from '../ToggleSwitch'
import { SlideOver } from '../SlideOver'
import { ConfirmDialog } from '../ConfirmDialog'
import { PermanentDeleteDialog } from '../PermanentDeleteDialog'
import { ImageUpload } from '../ImageUpload'
import { CharacterCount } from '../CharacterCount'
import { SlugField } from '../SlugField'
import { PortableTextEditor } from '../PortableTextEditor'
import { SkeletonRow } from '../SkeletonRow'
import { ReorderableList } from '../ReorderableList'
import type { TabContext } from '../AdminShell'
import type { ProjectDocument, TestimonialDocument, SanityImage, PortableTextContent } from '@/types/sanity'
import { Pencil, Archive, RotateCcw, Trash2, MoreVertical, Plus } from 'lucide-react'

interface PortfolioTabProps { ctx: TabContext }

interface ProjectForm {
  title: string; slug: string; clientName: string; coverImage: SanityImage | null
  shortDescription: string; projectType: string; technologies: string[]
  body: PortableTextContent; completedAt: string; isActive: boolean
  featuredOnHomepage: boolean; order: number; seoTitle: string; seoDescription: string
}

const emptyProjectForm: ProjectForm = {
  title: '', slug: '', clientName: '', coverImage: null,
  shortDescription: '', projectType: '', technologies: [],
  body: [], completedAt: '', isActive: false, featuredOnHomepage: false,
  order: 0, seoTitle: '', seoDescription: '',
}

export function PortfolioTab({ ctx }: PortfolioTabProps) {
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<ProjectDocument[]>([])
  const [archived, setArchived] = useState<ProjectDocument[]>([])
  const [view, setView] = useState<'active' | 'archived'>('active')
  const [slideOpen, setSlideOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editRev, setEditRev] = useState('')
  const [form, setForm] = useState<ProjectForm>(emptyProjectForm)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [archiveTarget, setArchiveTarget] = useState<ProjectDocument | null>(null)
  const [restoreTarget, setRestoreTarget] = useState<ProjectDocument | null>(null)
  const [permDeleteTarget, setPermDeleteTarget] = useState<ProjectDocument | null>(null)
  const [testimonials, setTestimonials] = useState<TestimonialDocument[]>([])
  const [mobileMenuId, setMobileMenuId] = useState<string | null>(null)
  const [techInput, setTechInput] = useState('')
  // Settings
  const [settingsRev, setSettingsRev] = useState('')
  const [pageHeading, setPageHeading] = useState('')
  const [pageSubheading, setPageSubheading] = useState('')
  const [testimonialsHeading, setTestimonialsHeading] = useState('')
  const [settingsSaving, setSettingsSaving] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    const [projRes, archivedRes, settingsRes] = await Promise.all([
      adminGet<ProjectDocument[]>('/api/admin/projects'),
      adminGet<ProjectDocument[]>('/api/admin/projects?archived=true'),
      adminGet<{ _rev: string; portfolio?: { pageHeading?: string; pageSubheading?: string; testimonialsHeading?: string } }>('/api/admin/site-settings'),
    ])
    if (projRes.success && projRes.data) setProjects(Array.isArray(projRes.data) ? projRes.data : [])
    if (archivedRes.success && archivedRes.data) setArchived(Array.isArray(archivedRes.data) ? archivedRes.data : [])
    if (settingsRes.success && settingsRes.data) {
      const s = settingsRes.data
      setSettingsRev(s._rev)
      setPageHeading(s.portfolio?.pageHeading ?? '')
      setPageSubheading(s.portfolio?.pageSubheading ?? '')
      setTestimonialsHeading(s.portfolio?.testimonialsHeading ?? '')
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  function openCreate() {
    setEditingId(null); setEditRev(''); setForm({ ...emptyProjectForm, order: projects.length })
    setFormErrors({}); setDirty(false); setTestimonials([]); setSlideOpen(true)
  }

  async function openEdit(p: ProjectDocument) {
    setEditingId(p._id); setEditRev(p._rev)
    setForm({
      title: p.title, slug: p.slug.current, clientName: p.clientName ?? '',
      coverImage: p.coverImage, shortDescription: p.shortDescription,
      projectType: p.projectType ?? '', technologies: p.technologies ?? [],
      body: p.body ?? [], completedAt: p.completedAt ?? '',
      isActive: p.isActive, featuredOnHomepage: p.featuredOnHomepage ?? false,
      order: p.order, seoTitle: p.seoTitle ?? '', seoDescription: p.seoDescription ?? '',
    })
    setFormErrors({}); setDirty(false); setSlideOpen(true)
    const tRes = await adminGet<TestimonialDocument[]>(`/api/admin/testimonials?projectId=${p._id}`)
    if (tRes.success && tRes.data) setTestimonials(Array.isArray(tRes.data) ? tRes.data : [])
  }

  async function handleSave() {
    setSaving(true); setFormErrors({})
    const payload = {
      title: form.title, slug: form.slug, clientName: form.clientName || undefined,
      coverImage: form.coverImage ?? undefined, shortDescription: form.shortDescription,
      projectType: form.projectType || undefined, technologies: form.technologies,
      body: form.body, completedAt: form.completedAt || undefined,
      isActive: form.isActive, featuredOnHomepage: form.featuredOnHomepage,
      order: form.order, seoTitle: form.seoTitle || undefined,
      seoDescription: form.seoDescription || undefined,
      ...(editingId ? { _rev: editRev } : {}),
    }
    const res = editingId
      ? await adminPut<ProjectDocument>(`/api/admin/projects/${editingId}`, payload)
      : await adminPost<ProjectDocument>('/api/admin/projects', payload)
    setSaving(false)
    if (res.success && res.data) {
      setSlideOpen(false); setDirty(false); loadData()
      ctx.addNotification({
        type: 'success', message: `Project ${editingId ? 'updated' : 'created'}.`,
        viewOnSiteUrl: res.data.isActive ? `/portfolio/${res.data.slug.current}` : undefined,
      })
    } else if (res.error?.fieldErrors) {
      setFormErrors(res.error.fieldErrors)
      ctx.addNotification({ type: 'error', message: getErrorMessage('VALIDATION_FAILED') })
    } else {
      ctx.addNotification({ type: 'error', message: getErrorMessage(res.error?.code ?? 'SERVER_ERROR') })
    }
  }

  async function handleArchive() {
    if (!archiveTarget) return
    const res = await adminPatch<ProjectDocument>(`/api/admin/projects/${archiveTarget._id}/archive`, { _rev: archiveTarget._rev })
    setArchiveTarget(null)
    if (res.success) { loadData(); ctx.addNotification({ type: 'success', message: 'Project archived.' }) }
    else ctx.addNotification({ type: 'error', message: getErrorMessage(res.error?.code ?? 'SERVER_ERROR') })
  }

  async function handleRestore() {
    if (!restoreTarget) return
    const res = await adminPatch<ProjectDocument>(`/api/admin/projects/${restoreTarget._id}/restore`, { _rev: restoreTarget._rev })
    setRestoreTarget(null)
    if (res.success) {
      loadData()
      ctx.addNotification({ type: 'success', message: 'Project restored. It is currently inactive — activate it from the project editor to make it public.' })
    } else ctx.addNotification({ type: 'error', message: getErrorMessage(res.error?.code ?? 'SERVER_ERROR') })
  }

  async function handlePermDelete() {
    if (!permDeleteTarget) return
    const res = await adminDelete<{ deleted: boolean }>(`/api/admin/projects/${permDeleteTarget._id}`)
    setPermDeleteTarget(null)
    if (res.success) { loadData(); ctx.addNotification({ type: 'success', message: 'Project permanently deleted.' }) }
    else ctx.addNotification({ type: 'error', message: getErrorMessage(res.error?.code ?? 'SERVER_ERROR') })
  }

  async function handleReorder(newOrder: Array<{ id: string; order: number }>) {
    const res = await adminPatch<unknown>('/api/admin/projects/reorder', { items: newOrder })
    if (!res.success) { ctx.addNotification({ type: 'error', message: 'Reorder failed. The previous order has been restored.' }); loadData() }
  }

  async function saveSettings() {
    setSettingsSaving(true)
    const res = await adminPut<{ _rev: string }>('/api/admin/site-settings', {
      portfolio: { pageHeading, pageSubheading, testimonialsHeading },
      _rev: settingsRev,
    })
    setSettingsSaving(false)
    if (res.success && res.data) { setSettingsRev(res.data._rev); ctx.addNotification({ type: 'success', message: 'Portfolio page settings saved.' }) }
    else ctx.addNotification({ type: 'error', message: getErrorMessage(res.error?.code ?? 'SERVER_ERROR') })
  }

  function updateForm(patch: Partial<ProjectForm>) { setForm((prev) => ({ ...prev, ...patch })); setDirty(true) }

  function handleTechKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && techInput.trim()) {
      e.preventDefault()
      updateForm({ technologies: [...form.technologies, techInput.trim()] })
      setTechInput('')
    }
  }

  function removeTech(index: number) {
    updateForm({ technologies: form.technologies.filter((_, i) => i !== index) })
  }

  const getTestimonialCount = (projectId: string) => {
    return testimonials.filter((t) => t.projectRef._ref === projectId).length
  }

  if (loading) return <div className="bg-white rounded-lg shadow-sm divide-y">{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}</div>

  return (
    <div className="max-w-5xl space-y-6">
      {/* Page settings */}
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-charcoal">Portfolio Page Settings</h2>
        <div>
          <label htmlFor="port-heading" className="block text-sm font-medium text-gray-700 mb-1">Page Heading</label>
          <input id="port-heading" type="text" value={pageHeading} onChange={(e) => setPageHeading(e.target.value)} maxLength={100} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
        </div>
        <div>
          <label htmlFor="port-sub" className="block text-sm font-medium text-gray-700 mb-1">Page Subheading</label>
          <input id="port-sub" type="text" value={pageSubheading} onChange={(e) => setPageSubheading(e.target.value)} maxLength={250} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
        </div>
        <div>
          <label htmlFor="port-test-heading" className="block text-sm font-medium text-gray-700 mb-1">Testimonials Heading</label>
          <input id="port-test-heading" type="text" value={testimonialsHeading} onChange={(e) => setTestimonialsHeading(e.target.value)} maxLength={80} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
        </div>
        <button type="button" onClick={saveSettings} disabled={settingsSaving} className="px-6 py-2 text-sm font-medium text-white bg-charcoal hover:bg-gray-800 rounded-lg min-h-[44px] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2">
          {settingsSaving ? 'Saving...' : 'Save Portfolio Page Settings'}
        </button>
      </div>

      {/* View toggle */}
      <div className="flex gap-2">
        <button type="button" onClick={() => setView('active')} className={`px-4 py-2 text-sm rounded-lg min-h-[44px] ${view === 'active' ? 'bg-charcoal text-white' : 'bg-white text-gray-700 border'}`}>Projects</button>
        <button type="button" onClick={() => setView('archived')} className={`px-4 py-2 text-sm rounded-lg min-h-[44px] ${view === 'archived' ? 'bg-charcoal text-white' : 'bg-white text-gray-700 border'}`}>Archived ({archived.length})</button>
      </div>

      {view === 'active' ? (
        <div>
          <div className="flex justify-end mb-4">
            <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-charcoal hover:bg-gray-800 rounded-lg min-h-[44px]">
              <Plus className="h-4 w-4" /> New Project
            </button>
          </div>
          {projects.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center"><p className="text-gray-500">No projects yet.</p></div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm">
              <ReorderableList
                items={projects.map((p) => ({ ...p, id: p._id }))}
                onReorder={handleReorder}
                renderItem={(item) => {
                  const p = item as ProjectDocument & { id: string }
                  return (
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-medium text-charcoal text-sm truncate">{p.title}</span>
                        <StatusBadge type={p.isActive ? 'active' : 'inactive'} />
                      </div>
                      <div className="hidden md:flex gap-1 shrink-0">
                        <button type="button" onClick={() => openEdit(p)} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-charcoal" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                        <button type="button" onClick={() => setArchiveTarget(p)} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-orange-600" aria-label="Archive"><Archive className="h-4 w-4" /></button>
                      </div>
                      <div className="md:hidden relative">
                        <button type="button" onClick={() => setMobileMenuId(mobileMenuId === p._id ? null : p._id)} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400"><MoreVertical className="h-4 w-4" /></button>
                        {mobileMenuId === p._id && (
                          <div className="absolute right-0 top-full z-20 bg-white border rounded-lg shadow-lg py-1 w-36">
                            <button type="button" onClick={() => { openEdit(p); setMobileMenuId(null) }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 min-h-[44px]">Edit</button>
                            <button type="button" onClick={() => { setArchiveTarget(p); setMobileMenuId(null) }} className="w-full text-left px-4 py-2 text-sm text-orange-600 hover:bg-gray-50 min-h-[44px]">Archive</button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                }}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm divide-y">
          {archived.length === 0 ? (
            <div className="p-8 text-center"><p className="text-gray-500">No archived projects.</p></div>
          ) : archived.map((p) => (
            <div key={p._id} className="flex items-center justify-between px-4 py-3">
              <div>
                <span className="font-medium text-charcoal text-sm">{p.title}</span>
                <span className="text-xs text-gray-400 ml-2">{p.archivedAt ? new Date(p.archivedAt).toLocaleDateString() : ''}</span>
              </div>
              <div className="flex gap-1">
                <button type="button" onClick={() => setRestoreTarget(p)} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-green-600" aria-label="Restore"><RotateCcw className="h-4 w-4" /></button>
                <button type="button" onClick={() => setPermDeleteTarget(p)} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-red-600" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit SlideOver */}
      <SlideOver isOpen={slideOpen} onClose={() => setSlideOpen(false)} title={editingId ? 'Edit Project' : 'New Project'} isDirty={dirty}>
        <div className="space-y-5">
          <div>
            <label htmlFor="proj-title" className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
            <input id="proj-title" type="text" value={form.title} onChange={(e) => updateForm({ title: e.target.value })} maxLength={100} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
            <div className="flex justify-between mt-1">{formErrors.title && <span className="text-xs text-red-600">{formErrors.title}</span>}<CharacterCount current={form.title.length} max={100} /></div>
          </div>
          <div>
            <label htmlFor="proj-client" className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
            <input id="proj-client" type="text" value={form.clientName} onChange={(e) => updateForm({ clientName: e.target.value })} maxLength={100} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
          </div>
          <ImageUpload value={form.coverImage} onChange={(v) => updateForm({ coverImage: v })} label="Cover Image" required />
          <div>
            <label htmlFor="proj-desc" className="block text-sm font-medium text-gray-700 mb-1">Short Description <span className="text-red-500">*</span></label>
            <textarea id="proj-desc" value={form.shortDescription} onChange={(e) => updateForm({ shortDescription: e.target.value })} maxLength={200} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base resize-y focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
            <div className="flex justify-end mt-1"><CharacterCount current={form.shortDescription.length} max={200} /></div>
          </div>
          <SlugField value={form.slug} onChange={(v) => updateForm({ slug: v })} fromTitle={form.title} isFirstSave={!editingId} urlPrefix="amgpm.com/portfolio" />
          <div>
            <label htmlFor="proj-type" className="block text-sm font-medium text-gray-700 mb-1">Project Type</label>
            <input id="proj-type" type="text" value={form.projectType} onChange={(e) => updateForm({ projectType: e.target.value })} maxLength={50} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
          </div>
          <div>
            <label htmlFor="proj-tech" className="block text-sm font-medium text-gray-700 mb-1">Technologies</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.technologies.map((tech, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm">
                  {tech}
                  <button type="button" onClick={() => removeTech(i)} className="text-gray-400 hover:text-red-600 min-w-[20px]" aria-label={`Remove ${tech}`}>&times;</button>
                </span>
              ))}
            </div>
            <input id="proj-tech" type="text" value={techInput} onChange={(e) => setTechInput(e.target.value)} onKeyDown={handleTechKeyDown} placeholder="Type and press Enter" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Body <span className="text-red-500">*</span></label>
            <PortableTextEditor value={form.body} onChange={(v) => updateForm({ body: v })} />
          </div>
          <div>
            <label htmlFor="proj-date" className="block text-sm font-medium text-gray-700 mb-1">Completed At</label>
            <input id="proj-date" type="date" value={form.completedAt} onChange={(e) => updateForm({ completedAt: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
          </div>
          <ToggleSwitch checked={form.isActive} onChange={(v) => updateForm({ isActive: v })} label="Active" />
          <ToggleSwitch checked={form.featuredOnHomepage} onChange={(v) => updateForm({ featuredOnHomepage: v })} label="Featured on Homepage" />
          <div>
            <label htmlFor="proj-order" className="block text-sm font-medium text-gray-700 mb-1">Order</label>
            <input id="proj-order" type="number" min={0} value={form.order} onChange={(e) => updateForm({ order: parseInt(e.target.value) || 0 })} className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
          </div>

          {/* Testimonials section */}
          {editingId && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Testimonials ({testimonials.length})</h3>
              {testimonials.map((t) => (
                <div key={t._id} className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-charcoal">{t.authorName}</p>
                    <p className="text-xs text-gray-500 truncate">{t.quote}</p>
                  </div>
                  <ToggleSwitch
                    checked={t.featuredOnPortfolio}
                    onChange={async (v) => {
                      setTestimonials((prev) => prev.map((x) => x._id === t._id ? { ...x, featuredOnPortfolio: v } : x))
                      const res = await adminPatch<TestimonialDocument>(`/api/admin/testimonials/${t._id}/featured`, { featuredOnPortfolio: v, _rev: t._rev })
                      if (!res.success) setTestimonials((prev) => prev.map((x) => x._id === t._id ? { ...x, featuredOnPortfolio: !v } : x))
                    }}
                    label="Featured"
                  />
                </div>
              ))}
            </div>
          )}

          <details className="border-t pt-4">
            <summary className="text-sm font-medium text-gray-700 cursor-pointer min-h-[44px] flex items-center">SEO</summary>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="proj-seo-title" className="block text-sm font-medium text-gray-700 mb-1">SEO Title</label>
                <input id="proj-seo-title" type="text" value={form.seoTitle} onChange={(e) => updateForm({ seoTitle: e.target.value })} maxLength={70} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
                <div className="flex justify-end mt-1"><CharacterCount current={form.seoTitle.length} max={70} /></div>
              </div>
              <div>
                <label htmlFor="proj-seo-desc" className="block text-sm font-medium text-gray-700 mb-1">SEO Description</label>
                <textarea id="proj-seo-desc" value={form.seoDescription} onChange={(e) => updateForm({ seoDescription: e.target.value })} maxLength={160} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base resize-y focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
                <div className="flex justify-end mt-1"><CharacterCount current={form.seoDescription.length} max={160} /></div>
              </div>
            </div>
          </details>

          <div className="sticky bottom-0 bg-white pt-4 border-t">
            <button type="button" onClick={handleSave} disabled={saving} className="w-full sm:w-auto px-6 py-2 text-sm font-medium text-white bg-charcoal hover:bg-gray-800 rounded-lg min-h-[44px] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2">
              {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </div>
      </SlideOver>

      <ConfirmDialog isOpen={!!archiveTarget} title={`Archive "${archiveTarget?.title ?? ''}"?`} message="The project and its testimonials will be hidden. You can restore from the Archived Projects view." confirmLabel="Archive" confirmVariant="danger" onConfirm={handleArchive} onCancel={() => setArchiveTarget(null)} />
      <ConfirmDialog isOpen={!!restoreTarget} title={`Restore "${restoreTarget?.title ?? ''}"?`} message="The project and testimonials will be restored to inactive state." confirmLabel="Restore" onConfirm={handleRestore} onCancel={() => setRestoreTarget(null)} />
      <PermanentDeleteDialog isOpen={!!permDeleteTarget} projectTitle={permDeleteTarget?.title ?? ''} testimonialCount={permDeleteTarget ? getTestimonialCount(permDeleteTarget._id) : 0} onConfirm={handlePermDelete} onCancel={() => setPermDeleteTarget(null)} />
    </div>
  )
}
