'use client'

import { useState, useEffect, useCallback } from 'react'
import { adminGet, adminPut, adminPatch, type ApiResponse } from '@/lib/admin/api-client'
import { getErrorMessage } from '@/lib/admin/error-messages'
import { ImageUpload } from '../ImageUpload'
import { VideoUpload } from '../VideoUpload'
import { CharacterCount } from '../CharacterCount'
import { ToggleSwitch } from '../ToggleSwitch'
import { SkeletonForm } from '../SkeletonRow'
import type { TabContext } from '../AdminShell'
import type { HeroDocument, AboutDocument, SiteSettingsDocument, ProjectDocument, TestimonialDocument, SanityFileAsset } from '@/types/sanity'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface HomepageTabProps {
  ctx: TabContext
}

function Section({
  title,
  defaultExpanded = true,
  children,
}: {
  title: string
  defaultExpanded?: boolean
  children: React.ReactNode
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  return (
    <div className="bg-white rounded-lg shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-6 py-4 text-left min-h-[44px]"
      >
        <h2 className="text-lg font-semibold text-charcoal">{title}</h2>
        {expanded ? <ChevronDown className="h-5 w-5 text-gray-400" /> : <ChevronRight className="h-5 w-5 text-gray-400" />}
      </button>
      {expanded && <div className="px-6 pb-6">{children}</div>}
    </div>
  )
}

function SaveButton({ saving, onClick, label = 'Save' }: { saving: boolean; onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving}
      className="px-6 py-2 text-sm font-medium text-white bg-charcoal hover:bg-gray-800 rounded-lg min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2"
    >
      {saving ? 'Saving...' : label}
    </button>
  )
}

export function HomepageTab({ ctx }: HomepageTabProps) {
  const [loading, setLoading] = useState(true)
  const [hero, setHero] = useState<HeroDocument | null>(null)
  const [heroRev, setHeroRev] = useState('')
  const [heroInitialized, setHeroInitialized] = useState(true)
  const [about, setAbout] = useState<AboutDocument | null>(null)
  const [settings, setSettings] = useState<SiteSettingsDocument | null>(null)
  const [settingsRev, setSettingsRev] = useState('')
  const [projects, setProjects] = useState<ProjectDocument[]>([])
  const [testimonials, setTestimonials] = useState<TestimonialDocument[]>([])

  // Hero form state
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image')
  const [heroImage, setHeroImage] = useState<HeroDocument['image']>(undefined)
  const [videoAsset, setVideoAsset] = useState<SanityFileAsset | null>(null)
  const [videoPoster, setVideoPoster] = useState<HeroDocument['videoPoster']>(undefined)
  const [headline, setHeadline] = useState('')
  const [subheadline, setSubheadline] = useState('')
  const [ctaLabel, setCtaLabel] = useState('')
  const [ctaUrl, setCtaUrl] = useState('')
  const [overlayOpacity, setOverlayOpacity] = useState(40)
  const [heroSaving, setHeroSaving] = useState(false)
  const [heroConflict, setHeroConflict] = useState(false)

  // Settings section states
  const [servicesHeading, setServicesHeading] = useState('')
  const [servicesSubheading, setServicesSubheading] = useState('')
  const [portfolioHeading, setPortfolioHeading] = useState('')
  const [portfolioSubheading, setPortfolioSubheading] = useState('')
  const [testimonialsHeading, setTestimonialsHeading] = useState('')
  const [insightsHeading, setInsightsHeading] = useState('')
  const [ctaSectionHeading, setCtaSectionHeading] = useState('')
  const [ctaSectionSubheading, setCtaSectionSubheading] = useState('')
  const [ctaSectionButtonLabel, setCtaSectionButtonLabel] = useState('')
  const [sectionSaving, setSectionSaving] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    const [heroRes, aboutRes, settingsRes, projectsRes, testimonialsRes] = await Promise.all([
      adminGet<HeroDocument>('/api/admin/hero'),
      adminGet<AboutDocument>('/api/admin/about'),
      adminGet<SiteSettingsDocument>('/api/admin/site-settings'),
      adminGet<ProjectDocument[]>('/api/admin/projects'),
      adminGet<TestimonialDocument[]>('/api/admin/testimonials'),
    ])

    if (heroRes.success && heroRes.data) {
      const h = heroRes.data
      setHero(h)
      setHeroRev(h._rev)
      setMediaType(h.mediaType)
      setHeroImage(h.image)
      setVideoAsset(h.videoAsset ?? null)
      setVideoPoster(h.videoPoster)
      setHeadline(h.headline)
      setSubheadline(h.subheadline ?? '')
      setCtaLabel(h.ctaLabel)
      setCtaUrl(h.ctaUrl)
      setOverlayOpacity(h.overlayOpacity ?? 40)
      setHeroInitialized(true)
    } else if (heroRes.initialized === false) {
      setHeroInitialized(false)
    }

    if (aboutRes.success && aboutRes.data) setAbout(aboutRes.data)
    if (settingsRes.success && settingsRes.data) {
      const s = settingsRes.data
      setSettings(s)
      setSettingsRev(s._rev)
      setServicesHeading(s.home?.servicesHeading ?? '')
      setServicesSubheading(s.home?.servicesSubheading ?? '')
      setPortfolioHeading(s.home?.portfolioHeading ?? '')
      setPortfolioSubheading(s.home?.portfolioSubheading ?? '')
      setTestimonialsHeading(s.home?.testimonialsHeading ?? '')
      setInsightsHeading(s.home?.insightsHeading ?? '')
      setCtaSectionHeading(s.home?.ctaHeading ?? '')
      setCtaSectionSubheading(s.home?.ctaSubheading ?? '')
      setCtaSectionButtonLabel(s.home?.ctaButtonLabel ?? '')
    }
    if (projectsRes.success && projectsRes.data) {
      setProjects(Array.isArray(projectsRes.data) ? projectsRes.data : [])
    }
    if (testimonialsRes.success && testimonialsRes.data) {
      setTestimonials(Array.isArray(testimonialsRes.data) ? testimonialsRes.data : [])
    }

    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  async function saveHero() {
    setHeroSaving(true)
    setHeroConflict(false)
    const body = {
      mediaType,
      ...(mediaType === 'image' ? { image: heroImage } : { videoAsset: videoAsset ?? undefined, videoPoster }),
      headline,
      subheadline: subheadline || undefined,
      ctaLabel,
      ctaUrl,
      overlayOpacity,
      _rev: heroRev,
    }
    const res = await adminPut<HeroDocument>('/api/admin/hero', body)
    setHeroSaving(false)
    if (res.success && res.data) {
      setHeroRev(res.data._rev)
      ctx.addNotification({ type: 'success', message: 'Hero section saved.' })
    } else if (res.error?.code === 'CONFLICT') {
      setHeroConflict(true)
    } else {
      ctx.addNotification({ type: 'error', message: getErrorMessage(res.error?.code ?? 'SERVER_ERROR'), retryable: res.error?.retryable })
    }
  }

  async function saveSettingsSection(section: string, fields: Record<string, unknown>) {
    setSectionSaving(section)
    const body = { ...fields, _rev: settingsRev }
    const res = await adminPut<SiteSettingsDocument>('/api/admin/site-settings', body)
    setSectionSaving(null)
    if (res.success && res.data) {
      setSettingsRev(res.data._rev)
      ctx.addNotification({ type: 'success', message: `${section} saved.` })
    } else if (res.error?.code === 'CONFLICT') {
      ctx.addNotification({ type: 'warning', message: getErrorMessage('CONFLICT') })
    } else {
      ctx.addNotification({ type: 'error', message: getErrorMessage(res.error?.code ?? 'SERVER_ERROR') })
    }
  }

  async function toggleProjectFeatured(project: ProjectDocument) {
    const newVal = !project.featuredOnHomepage
    setProjects((prev) => prev.map((p) => p._id === project._id ? { ...p, featuredOnHomepage: newVal } : p))
    const res = await adminPut<ProjectDocument>(`/api/admin/projects/${project._id}`, {
      ...project,
      slug: project.slug.current,
      featuredOnHomepage: newVal,
      _rev: project._rev,
    })
    if (!res.success) {
      setProjects((prev) => prev.map((p) => p._id === project._id ? { ...p, featuredOnHomepage: !newVal } : p))
      ctx.addNotification({ type: 'error', message: getErrorMessage(res.error?.code ?? 'SERVER_ERROR') })
    }
  }

  async function toggleTestimonialFeatured(t: TestimonialDocument) {
    const newVal = !t.featuredOnPortfolio
    setTestimonials((prev) => prev.map((x) => x._id === t._id ? { ...x, featuredOnPortfolio: newVal } : x))
    const res = await adminPatch<TestimonialDocument>(`/api/admin/testimonials/${t._id}/featured`, {
      featuredOnPortfolio: newVal,
      _rev: t._rev,
    })
    if (!res.success) {
      setTestimonials((prev) => prev.map((x) => x._id === t._id ? { ...x, featuredOnPortfolio: !newVal } : x))
      ctx.addNotification({ type: 'error', message: getErrorMessage(res.error?.code ?? 'SERVER_ERROR') })
    }
  }

  if (loading) {
    return <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-white rounded-lg shadow-sm"><SkeletonForm /></div>)}</div>
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Hero */}
      <Section title="Hero">
        {!heroInitialized ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">This section has not been set up yet.</p>
            <SaveButton saving={heroSaving} onClick={saveHero} label="Initialize Hero" />
          </div>
        ) : (
          <div className="space-y-4">
            {heroConflict && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800" role="alert">
                ⚠️ This content was modified in another session. <button type="button" onClick={loadData} className="underline font-medium">Reload Content</button>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Media Type</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 min-h-[44px] cursor-pointer">
                  <input type="radio" name="mediaType" value="image" checked={mediaType === 'image'} onChange={() => setMediaType('image')} className="accent-gold" />
                  <span className="text-sm">Image</span>
                </label>
                <label className="flex items-center gap-2 min-h-[44px] cursor-pointer">
                  <input type="radio" name="mediaType" value="video" checked={mediaType === 'video'} onChange={() => setMediaType('video')} className="accent-gold" />
                  <span className="text-sm">Video</span>
                </label>
              </div>
            </div>

            {mediaType === 'image' ? (
              <ImageUpload value={heroImage ?? null} onChange={(v) => setHeroImage(v ?? undefined)} label="Hero Image" />
            ) : (
              <div className="space-y-4">
                <VideoUpload value={videoAsset} onChange={(v) => setVideoAsset(v)} label="Video File" />
                <ImageUpload value={videoPoster ?? null} onChange={(v) => setVideoPoster(v ?? undefined)} label="Video Poster Image" />
              </div>
            )}

            <div>
              <label htmlFor="hero-headline" className="block text-sm font-medium text-gray-700 mb-1">Headline <span className="text-red-500">*</span></label>
              <input id="hero-headline" type="text" value={headline} onChange={(e) => setHeadline(e.target.value)} maxLength={100} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
              <div className="flex justify-end mt-1"><CharacterCount current={headline.length} max={100} /></div>
            </div>

            <div>
              <label htmlFor="hero-subheadline" className="block text-sm font-medium text-gray-700 mb-1">Subheadline</label>
              <input id="hero-subheadline" type="text" value={subheadline} onChange={(e) => setSubheadline(e.target.value)} maxLength={250} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
              <div className="flex justify-end mt-1"><CharacterCount current={subheadline.length} max={250} /></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="hero-cta-label" className="block text-sm font-medium text-gray-700 mb-1">CTA Label <span className="text-red-500">*</span></label>
                <input id="hero-cta-label" type="text" value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} maxLength={50} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
                <div className="flex justify-end mt-1"><CharacterCount current={ctaLabel.length} max={50} /></div>
              </div>
              <div>
                <label htmlFor="hero-cta-url" className="block text-sm font-medium text-gray-700 mb-1">CTA URL <span className="text-red-500">*</span></label>
                <input id="hero-cta-url" type="url" value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
              </div>
            </div>

            <div>
              <label htmlFor="hero-overlay" className="block text-sm font-medium text-gray-700 mb-1">Overlay Opacity: {overlayOpacity}%</label>
              <input id="hero-overlay" type="range" min={0} max={100} value={overlayOpacity} onChange={(e) => setOverlayOpacity(Number(e.target.value))} className="w-full accent-gold" />
            </div>

            <SaveButton saving={heroSaving} onClick={saveHero} />
          </div>
        )}
      </Section>

      {/* About Preview */}
      <Section title="About Preview">
        {about ? (
          <div>
            <h3 className="font-medium text-charcoal mb-1">{about.pageTitle}</h3>
            <p className="text-sm text-gray-600 mb-4 line-clamp-3">{about.intro}</p>
            <p className="text-xs text-gray-400">Full About page content is edited in the About tab.</p>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">About page has not been set up yet.</p>
        )}
      </Section>

      {/* Services Section */}
      <Section title="Services Section">
        <div className="space-y-4">
          <div>
            <label htmlFor="hp-services-heading" className="block text-sm font-medium text-gray-700 mb-1">Heading</label>
            <input id="hp-services-heading" type="text" value={servicesHeading} onChange={(e) => setServicesHeading(e.target.value)} maxLength={80} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
            <div className="flex justify-end mt-1"><CharacterCount current={servicesHeading.length} max={80} /></div>
          </div>
          <div>
            <label htmlFor="hp-services-sub" className="block text-sm font-medium text-gray-700 mb-1">Subheading</label>
            <input id="hp-services-sub" type="text" value={servicesSubheading} onChange={(e) => setServicesSubheading(e.target.value)} maxLength={200} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
            <div className="flex justify-end mt-1"><CharacterCount current={servicesSubheading.length} max={200} /></div>
          </div>
          <p className="text-xs text-gray-400">Individual services are managed in the Services tab.</p>
          <SaveButton saving={sectionSaving === 'Services'} onClick={() => saveSettingsSection('Services', { home: { ...settings?.home, servicesHeading, servicesSubheading } })} />
        </div>
      </Section>

      {/* Portfolio Section */}
      <Section title="Portfolio Section">
        <div className="space-y-4">
          <div>
            <label htmlFor="hp-port-heading" className="block text-sm font-medium text-gray-700 mb-1">Heading</label>
            <input id="hp-port-heading" type="text" value={portfolioHeading} onChange={(e) => setPortfolioHeading(e.target.value)} maxLength={80} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
          </div>
          <div>
            <label htmlFor="hp-port-sub" className="block text-sm font-medium text-gray-700 mb-1">Subheading</label>
            <input id="hp-port-sub" type="text" value={portfolioSubheading} onChange={(e) => setPortfolioSubheading(e.target.value)} maxLength={200} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
          </div>
          <SaveButton saving={sectionSaving === 'Portfolio'} onClick={() => saveSettingsSection('Portfolio', { home: { ...settings?.home, portfolioHeading, portfolioSubheading } })} />

          <div className="mt-6 border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Featured on Homepage</h3>
            <div className="space-y-2">
              {projects.filter((p) => !p.isArchived).map((project) => (
                <div key={project._id} className="flex items-center justify-between py-2">
                  <span className="text-sm text-charcoal">{project.title}</span>
                  <ToggleSwitch checked={project.featuredOnHomepage ?? false} onChange={() => toggleProjectFeatured(project)} label="Featured" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Testimonials Section */}
      <Section title="Testimonials Section">
        <div className="space-y-4">
          <div>
            <label htmlFor="hp-test-heading" className="block text-sm font-medium text-gray-700 mb-1">Heading</label>
            <input id="hp-test-heading" type="text" value={testimonialsHeading} onChange={(e) => setTestimonialsHeading(e.target.value)} maxLength={80} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
          </div>
          <SaveButton saving={sectionSaving === 'Testimonials'} onClick={() => saveSettingsSection('Testimonials', { home: { ...settings?.home, testimonialsHeading } })} />

          <div className="mt-4 space-y-3">
            {testimonials.filter((t) => t.featuredOnPortfolio && !t.isArchived).map((t) => (
              <div key={t._id} className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <p className="text-sm font-medium text-charcoal">{t.authorName}</p>
                  <p className="text-xs text-gray-500 line-clamp-1">{t.quote}</p>
                </div>
                <ToggleSwitch checked={t.featuredOnPortfolio} onChange={() => toggleTestimonialFeatured(t)} label="Featured" />
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Insights Section */}
      <Section title="Insights Section">
        <div className="space-y-4">
          <div>
            <label htmlFor="hp-insights-heading" className="block text-sm font-medium text-gray-700 mb-1">Heading</label>
            <input id="hp-insights-heading" type="text" value={insightsHeading} onChange={(e) => setInsightsHeading(e.target.value)} maxLength={80} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
          </div>
          <p className="text-xs text-gray-400">Articles are managed in the Insights tab.</p>
          <SaveButton saving={sectionSaving === 'Insights'} onClick={() => saveSettingsSection('Insights', { home: { ...settings?.home, insightsHeading } })} />
        </div>
      </Section>

      {/* CTA Section */}
      <Section title="CTA Section">
        <div className="space-y-4">
          <div>
            <label htmlFor="hp-cta-heading" className="block text-sm font-medium text-gray-700 mb-1">Heading</label>
            <input id="hp-cta-heading" type="text" value={ctaSectionHeading} onChange={(e) => setCtaSectionHeading(e.target.value)} maxLength={100} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
          </div>
          <div>
            <label htmlFor="hp-cta-sub" className="block text-sm font-medium text-gray-700 mb-1">Subheading</label>
            <input id="hp-cta-sub" type="text" value={ctaSectionSubheading} onChange={(e) => setCtaSectionSubheading(e.target.value)} maxLength={200} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
          </div>
          <div>
            <label htmlFor="hp-cta-btn" className="block text-sm font-medium text-gray-700 mb-1">Button Label</label>
            <input id="hp-cta-btn" type="text" value={ctaSectionButtonLabel} onChange={(e) => setCtaSectionButtonLabel(e.target.value)} maxLength={50} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
          </div>
          <SaveButton saving={sectionSaving === 'CTA'} onClick={() => saveSettingsSection('CTA', { home: { ...settings?.home, ctaHeading: ctaSectionHeading, ctaSubheading: ctaSectionSubheading, ctaButtonLabel: ctaSectionButtonLabel } })} />
        </div>
      </Section>
    </div>
  )
}
