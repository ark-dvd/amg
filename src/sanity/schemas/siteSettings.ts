import { defineArrayMember, defineField, defineType } from 'sanity'

const portableTextField = (name: string, title: string) =>
  defineField({
    name,
    title,
    type: 'array',
    of: [
      defineArrayMember({
        type: 'block',
        styles: [
          { title: 'Normal', value: 'normal' },
          { title: 'H2', value: 'h2' },
          { title: 'H3', value: 'h3' },
          { title: 'H4', value: 'h4' },
          { title: 'Quote', value: 'blockquote' },
        ],
        lists: [
          { title: 'Bullet', value: 'bullet' },
          { title: 'Numbered', value: 'number' },
        ],
        marks: {
          decorators: [
            { title: 'Bold', value: 'strong' },
            { title: 'Italic', value: 'em' },
            { title: 'Underline', value: 'underline' },
          ],
          annotations: [
            {
              name: 'link',
              type: 'object',
              title: 'Link',
              fields: [
                defineField({
                  name: 'href',
                  type: 'url',
                  title: 'URL',
                  validation: (rule) =>
                    rule.uri({ allowRelative: true, scheme: ['http', 'https', 'mailto'] }),
                }),
              ],
            },
          ],
        },
      }),
    ],
  })

const urlField = (name: string, title: string) =>
  defineField({
    name,
    title,
    type: 'url',
    validation: (rule) =>
      rule.uri({
        scheme: ['http', 'https'],
      }),
  })

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  groups: [
    { name: 'identity', title: 'Identity' },
    { name: 'contact', title: 'Contact' },
    { name: 'seo', title: 'SEO' },
    { name: 'analytics', title: 'Analytics' },
    { name: 'social', title: 'Social Links' },
    { name: 'footer', title: 'Footer' },
    { name: 'policyPages', title: 'Policy Pages' },
    { name: 'navigation', title: 'Navigation Labels' },
    { name: 'homepage', title: 'Homepage Labels' },
    { name: 'servicesPage', title: 'Services Page' },
    { name: 'portfolioPage', title: 'Portfolio Page' },
    { name: 'insightsPage', title: 'Insights Page' },
    { name: 'contactPage', title: 'Contact Page' },
    { name: 'emptyStates', title: 'Empty States' },
    { name: 'errorPage', title: '404 & Error Page' },
    { name: 'system', title: 'System' },
  ],
  fields: [
    // ─── Section A: Identity ────────────────────────────────────
    defineField({
      name: 'siteName',
      title: 'Site Name',
      type: 'string',
      group: 'identity',
      validation: (rule) => rule.required().max(100),
    }),
    defineField({
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      group: 'identity',
      validation: (rule) => rule.max(150),
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      group: 'identity',
    }),
    defineField({
      name: 'favicon',
      title: 'Favicon',
      type: 'image',
      group: 'identity',
    }),

    // ─── Section B: Contact ─────────────────────────────────────
    defineField({
      name: 'contactEmail',
      title: 'Contact Email',
      type: 'string',
      group: 'contact',
      validation: (rule) =>
        rule.custom((value) => {
          if (!value) return true
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            return 'Must be a valid email address'
          }
          return true
        }),
    }),
    defineField({
      name: 'contactPhone',
      title: 'Contact Phone',
      type: 'string',
      group: 'contact',
      validation: (rule) => rule.max(30),
    }),
    defineField({
      name: 'contactAddress',
      title: 'Contact Address',
      type: 'text',
      group: 'contact',
      validation: (rule) => rule.max(300),
    }),

    // ─── Section C: SEO (Global) ────────────────────────────────
    defineField({
      name: 'globalSeoTitle',
      title: 'Global SEO Title',
      type: 'string',
      group: 'seo',
      validation: (rule) => rule.max(70),
    }),
    defineField({
      name: 'globalSeoDescription',
      title: 'Global SEO Description',
      type: 'string',
      group: 'seo',
      validation: (rule) => rule.max(160),
    }),
    defineField({
      name: 'ogImage',
      title: 'OG Image',
      type: 'image',
      group: 'seo',
      description: 'Default social share image',
    }),

    // ─── Section D: Analytics ───────────────────────────────────
    defineField({
      name: 'gaId',
      title: 'Google Analytics ID',
      type: 'string',
      group: 'analytics',
      validation: (rule) =>
        rule.custom((value) => {
          if (!value) return true
          if (!/^G-[A-Z0-9]+$/.test(value)) {
            return 'Must match format G-XXXXXXX'
          }
          return true
        }),
    }),

    // ─── Section E: Social Links ────────────────────────────────
    { ...urlField('linkedinUrl', 'LinkedIn URL'), group: 'social' },
    { ...urlField('twitterUrl', 'Twitter/X URL'), group: 'social' },
    { ...urlField('facebookUrl', 'Facebook URL'), group: 'social' },
    { ...urlField('instagramUrl', 'Instagram URL'), group: 'social' },
    { ...urlField('youtubeUrl', 'YouTube URL'), group: 'social' },

    // ─── Section F: Footer ──────────────────────────────────────
    defineField({
      name: 'footerText',
      title: 'Footer Text',
      type: 'string',
      group: 'footer',
      description: 'Copyright/tagline',
      validation: (rule) => rule.max(200),
    }),
    defineField({
      name: 'termsLabel',
      title: 'Terms Page Link Label',
      type: 'string',
      group: 'footer',
      description: 'Footer link label for /terms. Default fallback: "Terms of Use"',
      validation: (rule) => rule.max(50),
    }),
    defineField({
      name: 'privacyLabel',
      title: 'Privacy Page Link Label',
      type: 'string',
      group: 'footer',
      description: 'Default fallback: "Privacy Policy"',
      validation: (rule) => rule.max(50),
    }),
    defineField({
      name: 'accessibilityLabel',
      title: 'Accessibility Page Link Label',
      type: 'string',
      group: 'footer',
      description: 'Default fallback: "Accessibility"',
      validation: (rule) => rule.max(50),
    }),

    // ─── Section G: Policy Pages Content ────────────────────────
    { ...portableTextField('termsContent', 'Terms of Use Content'), group: 'policyPages' },
    { ...portableTextField('privacyContent', 'Privacy Policy Content'), group: 'policyPages' },
    {
      ...portableTextField('accessibilityContent', 'Accessibility Statement Content'),
      group: 'policyPages',
    },

    // ─── Section H: Navigation Labels ───────────────────────────
    defineField({
      name: 'nav',
      title: 'Navigation Labels',
      type: 'object',
      group: 'navigation',
      fields: [
        defineField({
          name: 'aboutLabel',
          title: 'About Nav Label',
          type: 'string',
          description: 'Default fallback: "About"',
          validation: (rule) => rule.max(40),
        }),
        defineField({
          name: 'servicesLabel',
          title: 'Services Nav Label',
          type: 'string',
          description: 'Default fallback: "Services"',
          validation: (rule) => rule.max(40),
        }),
        defineField({
          name: 'portfolioLabel',
          title: 'Portfolio Nav Label',
          type: 'string',
          description: 'Default fallback: "Portfolio"',
          validation: (rule) => rule.max(40),
        }),
        defineField({
          name: 'insightsLabel',
          title: 'Insights Nav Label',
          type: 'string',
          description: 'Default fallback: "Insights"',
          validation: (rule) => rule.max(40),
        }),
        defineField({
          name: 'contactLabel',
          title: 'Contact Nav Label',
          type: 'string',
          description: 'Default fallback: "Contact"',
          validation: (rule) => rule.max(40),
        }),
        defineField({
          name: 'ctaLabel',
          title: 'Nav CTA Button Label',
          type: 'string',
          description: 'Default fallback: "Get in Touch"',
          validation: (rule) => rule.max(40),
        }),
      ],
    }),

    // ─── Section I: Homepage Section Labels ─────────────────────
    defineField({
      name: 'home',
      title: 'Homepage Labels',
      type: 'object',
      group: 'homepage',
      fields: [
        defineField({
          name: 'aboutHeading',
          title: 'About Section Heading',
          type: 'string',
          description: 'If empty, section does not render heading',
        }),
        defineField({
          name: 'servicesHeading',
          title: 'Services Section Heading',
          type: 'string',
          validation: (rule) => rule.max(80),
        }),
        defineField({
          name: 'servicesSubheading',
          title: 'Services Section Subheading',
          type: 'string',
          validation: (rule) => rule.max(200),
        }),
        defineField({
          name: 'portfolioHeading',
          title: 'Portfolio Section Heading',
          type: 'string',
          validation: (rule) => rule.max(80),
        }),
        defineField({
          name: 'portfolioSubheading',
          title: 'Portfolio Section Subheading',
          type: 'string',
          validation: (rule) => rule.max(200),
        }),
        defineField({
          name: 'testimonialsHeading',
          title: 'Testimonials Section Heading',
          type: 'string',
          validation: (rule) => rule.max(80),
        }),
        defineField({
          name: 'insightsHeading',
          title: 'Insights Section Heading',
          type: 'string',
          validation: (rule) => rule.max(80),
        }),
        defineField({
          name: 'ctaHeading',
          title: 'CTA Section Heading',
          type: 'string',
          validation: (rule) => rule.max(120),
        }),
        defineField({
          name: 'ctaSubheading',
          title: 'CTA Section Subheading',
          type: 'string',
          validation: (rule) => rule.max(250),
        }),
        defineField({
          name: 'ctaButtonLabel',
          title: 'CTA Section Button Label',
          type: 'string',
          description: 'Default fallback: "Contact Us"',
          validation: (rule) => rule.max(50),
        }),
      ],
    }),

    // ─── Section J: Services Page Labels ────────────────────────
    defineField({
      name: 'services',
      title: 'Services Page Labels',
      type: 'object',
      group: 'servicesPage',
      fields: [
        defineField({
          name: 'pageHeading',
          title: 'Services Page Heading',
          type: 'string',
          validation: (rule) => rule.max(80),
        }),
        defineField({
          name: 'pageSubheading',
          title: 'Services Page Subheading',
          type: 'string',
          validation: (rule) => rule.max(200),
        }),
      ],
    }),

    // ─── Section K: Portfolio Page Labels ───────────────────────
    defineField({
      name: 'portfolio',
      title: 'Portfolio Page Labels',
      type: 'object',
      group: 'portfolioPage',
      fields: [
        defineField({
          name: 'pageHeading',
          title: 'Portfolio Page Heading',
          type: 'string',
        }),
        defineField({
          name: 'pageSubheading',
          title: 'Portfolio Page Subheading',
          type: 'string',
          validation: (rule) => rule.max(200),
        }),
        defineField({
          name: 'testimonialsHeading',
          title: 'Portfolio Testimonials Heading',
          type: 'string',
        }),
      ],
    }),

    // ─── Section L: Insights Page Labels ────────────────────────
    defineField({
      name: 'insights',
      title: 'Insights Page Labels',
      type: 'object',
      group: 'insightsPage',
      fields: [
        defineField({
          name: 'pageHeading',
          title: 'Insights Page Heading',
          type: 'string',
          validation: (rule) => rule.max(80),
        }),
        defineField({
          name: 'pageSubheading',
          title: 'Insights Page Subheading',
          type: 'string',
          validation: (rule) => rule.max(200),
        }),
      ],
    }),

    // ─── Section M: Contact Page Labels ─────────────────────────
    defineField({
      name: 'contact',
      title: 'Contact Page Labels',
      type: 'object',
      group: 'contactPage',
      fields: [
        defineField({
          name: 'pageHeading',
          title: 'Contact Page Heading',
          type: 'string',
          validation: (rule) => rule.max(80),
        }),
        defineField({
          name: 'pageSubheading',
          title: 'Contact Page Subheading',
          type: 'string',
          validation: (rule) => rule.max(200),
        }),
        defineField({
          name: 'formNameLabel',
          title: 'Form Name Label',
          type: 'string',
          description: 'Default fallback: "Your Name"',
          validation: (rule) => rule.max(60),
        }),
        defineField({
          name: 'formEmailLabel',
          title: 'Form Email Label',
          type: 'string',
          description: 'Default fallback: "Email Address"',
          validation: (rule) => rule.max(60),
        }),
        defineField({
          name: 'formPhoneLabel',
          title: 'Form Phone Label',
          type: 'string',
          description: 'Default fallback: "Phone (optional)"',
          validation: (rule) => rule.max(60),
        }),
        defineField({
          name: 'formCompanyLabel',
          title: 'Form Company Label',
          type: 'string',
          description: 'Default fallback: "Company (optional)"',
          validation: (rule) => rule.max(60),
        }),
        defineField({
          name: 'formMessageLabel',
          title: 'Form Message Label',
          type: 'string',
          description: 'Default fallback: "Message"',
          validation: (rule) => rule.max(60),
        }),
        defineField({
          name: 'formSubmitLabel',
          title: 'Form Submit Label',
          type: 'string',
          description: 'Default fallback: "Send Message"',
          validation: (rule) => rule.max(50),
        }),
        defineField({
          name: 'formSuccessMessage',
          title: 'Form Success Message',
          type: 'string',
          description: 'Shown after successful submission. If empty, does not render.',
          validation: (rule) => rule.max(300),
        }),
        defineField({
          name: 'formErrorMessage',
          title: 'Form Error Message',
          type: 'string',
          description: 'Default fallback: "Something went wrong. Please try again."',
          validation: (rule) => rule.max(300),
        }),
      ],
    }),

    // ─── Section N: Empty State Messages ────────────────────────
    defineField({
      name: 'empty',
      title: 'Empty State Messages',
      type: 'object',
      group: 'emptyStates',
      fields: [
        defineField({
          name: 'servicesMessage',
          title: 'Services Empty State',
          type: 'string',
          validation: (rule) => rule.max(200),
        }),
        defineField({
          name: 'portfolioMessage',
          title: 'Portfolio Empty State',
          type: 'string',
          validation: (rule) => rule.max(200),
        }),
        defineField({
          name: 'insightsMessage',
          title: 'Insights Empty State',
          type: 'string',
          validation: (rule) => rule.max(200),
        }),
      ],
    }),

    // ─── Section O: 404 & Error Page ────────────────────────────
    defineField({
      name: 'error404',
      title: '404 & Error Page',
      type: 'object',
      group: 'errorPage',
      fields: [
        defineField({
          name: 'heading',
          title: '404 Heading',
          type: 'string',
          description: 'Default fallback: "Page Not Found"',
          validation: (rule) => rule.max(80),
        }),
        defineField({
          name: 'message',
          title: '404 Message',
          type: 'string',
          description:
            'Default fallback: "The page you\'re looking for doesn\'t exist."',
          validation: (rule) => rule.max(300),
        }),
        defineField({
          name: 'ctaLabel',
          title: '404 CTA Label',
          type: 'string',
          description: 'Default fallback: "Go Home"',
          validation: (rule) => rule.max(50),
        }),
      ],
    }),

    // ─── Section P: System ──────────────────────────────────────
    defineField({
      name: 'updatedAt',
      title: 'Updated At',
      type: 'datetime',
      group: 'system',
      readOnly: true,
      description: 'Set by API on every mutation',
    }),
  ],
  preview: {
    select: { title: 'siteName' },
  },
})
