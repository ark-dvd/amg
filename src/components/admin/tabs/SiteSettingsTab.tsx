'use client'

import { useState, useEffect, useCallback } from 'react'
import { adminGet, adminPut } from '@/lib/admin/api-client'
import { getErrorMessage } from '@/lib/admin/error-messages'
import { ImageUpload } from '../ImageUpload'
import { CharacterCount } from '../CharacterCount'
import { PortableTextEditor } from '../PortableTextEditor'
import { SkeletonForm } from '../SkeletonRow'
import type { TabContext } from '../AdminShell'
import type { SiteSettingsDocument, SanityImage, PortableTextContent } from '@/types/sanity'
import { ChevronDown, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { urlFor } from '@/lib/sanity/image'

interface SiteSettingsTabProps { ctx: TabContext }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(true)
  return (
    <div className="border-b border-gray-100 pb-6 mb-6 last:border-0">
      <button type="button" onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between mb-4 min-h-[44px]">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
        {expanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
      </button>
      {expanded && <div className="space-y-4">{children}</div>}
    </div>
  )
}

export function SiteSettingsTab({ ctx }: SiteSettingsTabProps) {
  const [loading, setLoading] = useState(true)
  const [rev, setRev] = useState('')
  const [saving, setSaving] = useState<string | null>(null)

  // Identity
  const [siteName, setSiteName] = useState('')
  const [tagline, setTagline] = useState('')
  const [logo, setLogo] = useState<SanityImage | null>(null)
  const [favicon, setFavicon] = useState<SanityImage | null>(null)
  // SEO
  const [globalSeoTitle, setGlobalSeoTitle] = useState('')
  const [globalSeoDescription, setGlobalSeoDescription] = useState('')
  const [ogImage, setOgImage] = useState<SanityImage | null>(null)
  // Analytics
  const [gaId, setGaId] = useState('')
  // Social
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [twitterUrl, setTwitterUrl] = useState('')
  const [facebookUrl, setFacebookUrl] = useState('')
  const [instagramUrl, setInstagramUrl] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  // Footer
  const [footerText, setFooterText] = useState('')
  const [termsLabel, setTermsLabel] = useState('')
  const [privacyLabel, setPrivacyLabel] = useState('')
  const [accessibilityLabel, setAccessibilityLabel] = useState('')
  // Policy
  const [termsContent, setTermsContent] = useState<PortableTextContent>([])
  const [privacyContent, setPrivacyContent] = useState<PortableTextContent>([])
  const [accessibilityContent, setAccessibilityContent] = useState<PortableTextContent>([])
  // Empty States
  const [emptyServices, setEmptyServices] = useState('')
  const [emptyPortfolio, setEmptyPortfolio] = useState('')
  const [emptyInsights, setEmptyInsights] = useState('')
  // 404
  const [error404Heading, setError404Heading] = useState('')
  const [error404Message, setError404Message] = useState('')
  const [error404Cta, setError404Cta] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    const res = await adminGet<SiteSettingsDocument>('/api/admin/site-settings')
    if (res.success && res.data) {
      const s = res.data
      setRev(s._rev)
      setSiteName(s.siteName ?? ''); setTagline(s.tagline ?? '')
      setLogo(s.logo ?? null); setFavicon(s.favicon ?? null)
      setGlobalSeoTitle(s.globalSeoTitle ?? ''); setGlobalSeoDescription(s.globalSeoDescription ?? '')
      setOgImage(s.ogImage ?? null); setGaId(s.gaId ?? '')
      setLinkedinUrl(s.linkedinUrl ?? ''); setTwitterUrl(s.twitterUrl ?? '')
      setFacebookUrl(s.facebookUrl ?? ''); setInstagramUrl(s.instagramUrl ?? '')
      setYoutubeUrl(s.youtubeUrl ?? '')
      setFooterText(s.footerText ?? ''); setTermsLabel(s.termsLabel ?? '')
      setPrivacyLabel(s.privacyLabel ?? ''); setAccessibilityLabel(s.accessibilityLabel ?? '')
      setTermsContent(s.termsContent ?? []); setPrivacyContent(s.privacyContent ?? [])
      setAccessibilityContent(s.accessibilityContent ?? [])
      setEmptyServices(s.empty?.servicesMessage ?? '')
      setEmptyPortfolio(s.empty?.portfolioMessage ?? '')
      setEmptyInsights(s.empty?.insightsMessage ?? '')
      setError404Heading(s.error404?.heading ?? ''); setError404Message(s.error404?.message ?? '')
      setError404Cta(s.error404?.ctaLabel ?? '')
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  async function saveSection(section: string, fields: Record<string, unknown>) {
    setSaving(section)
    const res = await adminPut<SiteSettingsDocument>('/api/admin/site-settings', { ...fields, _rev: rev })
    setSaving(null)
    if (res.success && res.data) {
      setRev(res.data._rev)
      ctx.addNotification({ type: 'success', message: `${section} saved.` })
    } else {
      ctx.addNotification({ type: 'error', message: getErrorMessage(res.error?.code ?? 'SERVER_ERROR') })
    }
  }

  function SaveBtn({ section, onClick }: { section: string; onClick: () => void }) {
    return (
      <button type="button" onClick={onClick} disabled={saving === section} className="px-6 py-2 text-sm font-medium text-white bg-charcoal hover:bg-gray-800 rounded-lg min-h-[44px] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2">
        {saving === section ? 'Saving...' : 'Save'}
      </button>
    )
  }

  if (loading) return <div className="bg-white rounded-lg shadow-sm"><SkeletonForm /></div>

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 max-w-4xl">
      <h2 className="text-lg font-semibold text-charcoal mb-6">Site Settings</h2>

      <Section title="Identity">
        <div>
          <label htmlFor="ss-name" className="block text-sm font-medium text-gray-700 mb-1">Site Name <span className="text-red-500">*</span></label>
          <input id="ss-name" type="text" value={siteName} onChange={(e) => setSiteName(e.target.value)} maxLength={80} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
          <div className="flex justify-end mt-1"><CharacterCount current={siteName.length} max={80} /></div>
        </div>
        <div>
          <label htmlFor="ss-tagline" className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
          <input id="ss-tagline" type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} maxLength={160} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
          <div className="flex justify-end mt-1"><CharacterCount current={tagline.length} max={160} /></div>
        </div>
        <ImageUpload value={logo} onChange={setLogo} label="Logo" />
        <ImageUpload value={favicon} onChange={setFavicon} label="Favicon" />
        <SaveBtn section="Identity" onClick={() => saveSection('Identity', { siteName, tagline: tagline || undefined, logo: logo ?? undefined, favicon: favicon ?? undefined })} />
      </Section>

      <Section title="SEO">
        <div>
          <label htmlFor="ss-seo-title" className="block text-sm font-medium text-gray-700 mb-1">Global SEO Title</label>
          <input id="ss-seo-title" type="text" value={globalSeoTitle} onChange={(e) => setGlobalSeoTitle(e.target.value)} maxLength={70} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
          <div className="flex justify-end mt-1"><CharacterCount current={globalSeoTitle.length} max={70} /></div>
        </div>
        <div>
          <label htmlFor="ss-seo-desc" className="block text-sm font-medium text-gray-700 mb-1">Global SEO Description</label>
          <textarea id="ss-seo-desc" value={globalSeoDescription} onChange={(e) => setGlobalSeoDescription(e.target.value)} maxLength={160} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base resize-y focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
          <div className="flex justify-end mt-1"><CharacterCount current={globalSeoDescription.length} max={160} /></div>
        </div>
        <ImageUpload value={ogImage} onChange={setOgImage} label="OG Image" />
        {ogImage && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <p className="text-xs text-gray-500 mb-2">OG Card Preview</p>
            <div className="flex gap-3">
              <div className="relative w-32 h-20 rounded overflow-hidden shrink-0">
                <Image src={urlFor(ogImage).width(256).height(160).url()} alt="OG Preview" fill className="object-cover" sizes="128px" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-charcoal truncate">{globalSeoTitle || siteName}</p>
                <p className="text-xs text-gray-500 line-clamp-2">{globalSeoDescription}</p>
              </div>
            </div>
          </div>
        )}
        <SaveBtn section="SEO" onClick={() => saveSection('SEO', { globalSeoTitle: globalSeoTitle || undefined, globalSeoDescription: globalSeoDescription || undefined, ogImage: ogImage ?? undefined })} />
      </Section>

      <Section title="Analytics">
        <div>
          <label htmlFor="ss-ga" className="block text-sm font-medium text-gray-700 mb-1">Google Analytics ID</label>
          <input id="ss-ga" type="text" value={gaId} onChange={(e) => setGaId(e.target.value)} placeholder="G-XXXXXXXXXX" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
        </div>
        <SaveBtn section="Analytics" onClick={() => saveSection('Analytics', { gaId: gaId || undefined })} />
      </Section>

      <Section title="Social Links">
        {[
          { id: 'ss-linkedin', label: 'LinkedIn', value: linkedinUrl, set: setLinkedinUrl },
          { id: 'ss-twitter', label: 'Twitter', value: twitterUrl, set: setTwitterUrl },
          { id: 'ss-facebook', label: 'Facebook', value: facebookUrl, set: setFacebookUrl },
          { id: 'ss-instagram', label: 'Instagram', value: instagramUrl, set: setInstagramUrl },
          { id: 'ss-youtube', label: 'YouTube', value: youtubeUrl, set: setYoutubeUrl },
        ].map((s) => (
          <div key={s.id}>
            <label htmlFor={s.id} className="block text-sm font-medium text-gray-700 mb-1">{s.label}</label>
            <input id={s.id} type="url" value={s.value} onChange={(e) => s.set(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
          </div>
        ))}
        <SaveBtn section="Social" onClick={() => saveSection('Social', { linkedinUrl: linkedinUrl || undefined, twitterUrl: twitterUrl || undefined, facebookUrl: facebookUrl || undefined, instagramUrl: instagramUrl || undefined, youtubeUrl: youtubeUrl || undefined })} />
      </Section>

      <Section title="Footer">
        <div>
          <label htmlFor="ss-footer" className="block text-sm font-medium text-gray-700 mb-1">Footer Text</label>
          <textarea id="ss-footer" value={footerText} onChange={(e) => setFooterText(e.target.value)} maxLength={300} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base resize-y focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
        </div>
        {[
          { id: 'ss-terms-label', label: 'Terms Label', value: termsLabel, set: setTermsLabel },
          { id: 'ss-privacy-label', label: 'Privacy Label', value: privacyLabel, set: setPrivacyLabel },
          { id: 'ss-a11y-label', label: 'Accessibility Label', value: accessibilityLabel, set: setAccessibilityLabel },
        ].map((f) => (
          <div key={f.id}>
            <label htmlFor={f.id} className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
            <input id={f.id} type="text" value={f.value} onChange={(e) => f.set(e.target.value)} maxLength={50} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
          </div>
        ))}
        <SaveBtn section="Footer" onClick={() => saveSection('Footer', { footerText: footerText || undefined, termsLabel: termsLabel || undefined, privacyLabel: privacyLabel || undefined, accessibilityLabel: accessibilityLabel || undefined })} />
      </Section>

      <Section title="Policy Pages">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Terms of Use</label>
          <PortableTextEditor value={termsContent} onChange={setTermsContent} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Privacy Policy</label>
          <PortableTextEditor value={privacyContent} onChange={setPrivacyContent} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Accessibility</label>
          <PortableTextEditor value={accessibilityContent} onChange={setAccessibilityContent} />
        </div>
        <SaveBtn section="Policy" onClick={() => saveSection('Policy', { termsContent, privacyContent, accessibilityContent })} />
      </Section>

      <Section title="Empty States">
        {[
          { id: 'ss-empty-services', label: 'Services Empty', value: emptyServices, set: setEmptyServices },
          { id: 'ss-empty-portfolio', label: 'Portfolio Empty', value: emptyPortfolio, set: setEmptyPortfolio },
          { id: 'ss-empty-insights', label: 'Insights Empty', value: emptyInsights, set: setEmptyInsights },
        ].map((f) => (
          <div key={f.id}>
            <label htmlFor={f.id} className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
            <input id={f.id} type="text" value={f.value} onChange={(e) => f.set(e.target.value)} maxLength={200} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
          </div>
        ))}
        <SaveBtn section="Empty" onClick={() => saveSection('Empty', { empty: { servicesMessage: emptyServices || undefined, portfolioMessage: emptyPortfolio || undefined, insightsMessage: emptyInsights || undefined } })} />
      </Section>

      <Section title="Error Pages">
        <div>
          <label htmlFor="ss-404-heading" className="block text-sm font-medium text-gray-700 mb-1">404 Heading</label>
          <input id="ss-404-heading" type="text" value={error404Heading} onChange={(e) => setError404Heading(e.target.value)} maxLength={80} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
        </div>
        <div>
          <label htmlFor="ss-404-message" className="block text-sm font-medium text-gray-700 mb-1">404 Message</label>
          <input id="ss-404-message" type="text" value={error404Message} onChange={(e) => setError404Message(e.target.value)} maxLength={200} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
        </div>
        <div>
          <label htmlFor="ss-404-cta" className="block text-sm font-medium text-gray-700 mb-1">404 CTA Label</label>
          <input id="ss-404-cta" type="text" value={error404Cta} onChange={(e) => setError404Cta(e.target.value)} maxLength={50} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2" />
        </div>
        <SaveBtn section="Error" onClick={() => saveSection('Error', { error404: { heading: error404Heading || undefined, message: error404Message || undefined, ctaLabel: error404Cta || undefined } })} />
      </Section>
    </div>
  )
}
