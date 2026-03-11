const { createClient } = require('@sanity/client');
const { readFileSync } = require('fs');
const { resolve } = require('path');

// Load .env.local manually (no dotenv dependency)
const envPath = resolve(__dirname, '..', '.env.local');
for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  if (!process.env[key]) process.env[key] = val;
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});

const now = new Date().toISOString();
const results = [];

function pt(key, text) {
  return {
    _type: 'block',
    _key: key,
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: `s-${key}`, text, marks: [] }],
  };
}

async function seed(label, doc) {
  try {
    const res = await client.createOrReplace(doc);
    console.log(`✅ ${label} → ${res._id}`);
    results.push({ label, ok: true });
  } catch (e) {
    console.error(`❌ ${label} → ${e.message}`);
    results.push({ label, ok: false, error: e.message });
  }
}

async function main() {
  console.log(`Project: ${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID} / ${process.env.NEXT_PUBLIC_SANITY_DATASET}\n`);

  // 1. Site Settings
  await seed('Site Settings', {
    _id: 'singleton.siteSettings',
    _type: 'siteSettings',
    siteName: 'AMG',
    tagline: 'Boutique Project Management. Delivered with Precision.',
    contactEmail: 'contact@amgpm.com',
    contactPhone: '+1 (512) 000-0000',
    contactAddress: 'Austin, Texas',
    globalSeoTitle: 'AMG | Project Management & Owner Representation',
    globalSeoDescription: 'AMG delivers expert project management, owner representation, and construction oversight for commercial and residential projects in Austin and beyond.',
    linkedinUrl: 'https://linkedin.com',
    footerText: '© 2026 AMG. All rights reserved.',
    nav: {
      aboutLabel: 'About',
      servicesLabel: 'Services',
      portfolioLabel: 'Portfolio',
      insightsLabel: 'Insights',
      contactLabel: 'Contact',
      ctaLabel: 'Get in Touch',
    },
    home: {
      servicesHeading: 'What We Do',
      servicesSubheading: 'Full-spectrum project management from concept to completion.',
      portfolioHeading: 'Selected Projects',
      portfolioSubheading: 'A track record built on complexity, trust, and results.',
      testimonialsHeading: 'What Clients Say',
      insightsHeading: 'Insights',
      ctaHeading: 'Ready to Move Forward?',
      ctaSubheading: "Let's discuss your project and how AMG can deliver it.",
      ctaButtonLabel: 'Start a Conversation',
    },
    services: {
      pageHeading: 'Our Services',
      pageSubheading: 'Professional engineering solutions across all project phases.',
    },
    portfolio: {
      pageHeading: 'Portfolio',
      pageSubheading: 'Complex projects. Delivered on time, on budget, on standard.',
    },
    insights: {
      pageHeading: 'Insights',
      pageSubheading: 'Perspectives on project management, construction, and the built environment.',
    },
    contact: {
      pageHeading: 'Get in Touch',
      pageSubheading: 'Our team is ready to assist with any question or project inquiry.',
      formNameLabel: 'Full Name',
      formEmailLabel: 'Email Address',
      formPhoneLabel: 'Phone',
      formCompanyLabel: 'Company',
      formMessageLabel: 'Tell us about your project',
      formSubmitLabel: 'Send Message',
      formSuccessMessage: "Thank you. We'll be in touch within 24\u201348 hours.",
      formErrorMessage: 'Something went wrong. Please try again or email us directly.',
    },
    empty: {
      servicesMessage: 'Our services are currently being updated. Please check back soon.',
      portfolioMessage: 'Portfolio projects are coming soon.',
      insightsMessage: 'Articles and insights are coming soon.',
    },
    error404: {
      heading: 'Page Not Found',
      message: "The page you're looking for doesn't exist or has been moved.",
      ctaLabel: 'Back to Home',
    },
    updatedAt: now,
  });

  // 2. About
  await seed('About', {
    _id: 'singleton.about',
    _type: 'about',
    pageTitle: 'About AMG',
    intro: 'AMG is a boutique project management firm based in Austin, Texas. We deliver complex commercial and residential projects with precision, transparency, and an unwavering commitment to our clients.',
    body: [
      pt('a1', 'Founded by Aron Miller, AMG brings an international perspective shaped by years of managing large-scale infrastructure, commercial, and high-end residential developments across multiple markets.'),
      pt('a2', "Our approach is straightforward: we act as the owner's trusted representative at every phase \u2014 from pre-design through construction closeout \u2014 ensuring that scope, schedule, and budget are protected at all times."),
      pt('a3', 'We work on a limited number of projects at any given time. This is by design. Our clients receive our full attention, not a fraction of it.'),
    ],
    teamSectionTitle: 'Leadership',
    updatedAt: now,
  });

  // 3. Hero
  await seed('Hero', {
    _id: 'singleton.hero',
    _type: 'hero',
    mediaType: 'image',
    headline: 'Project Management at the Highest Standard',
    subheadline: 'AMG delivers complex projects with precision, transparency, and a relentless focus on client outcomes.',
    ctaLabel: 'Explore Our Work',
    ctaUrl: '/portfolio',
    overlayOpacity: 50,
    updatedAt: now,
  });

  // 4. Services
  const services = [
    { id: 'service-1', title: 'Design Management', slug: 'design-management', short: 'Coordinating and managing all design phases from requirements through construction documents.', text: 'We coordinate all design stakeholders \u2014 architects, consultants, and engineers \u2014 ensuring full integration across disciplines. From initial brief through permit-ready documents, we manage scope, quality, and timeline on behalf of the owner.' },
    { id: 'service-2', title: 'Requirements & Program Development', slug: 'requirements-programming', short: 'Defining project needs, scope, and objectives through structured documentation.', text: 'We prepare detailed requirements documents and project programs that establish a clear framework for all project phases. These documents serve as the authoritative reference for design teams, contractors, and stakeholders throughout the project lifecycle.' },
    { id: 'service-3', title: 'Construction Management & Oversight', slug: 'construction-management', short: 'On-site oversight ensuring compliance with standards, schedule, and budget.', text: "Our team provides continuous on-site supervision, verifying that work is executed to specification and that quality standards are maintained at every stage. We identify and resolve field issues before they escalate, protecting the owner's investment." },
    { id: 'service-4', title: "Owner's Representation", slug: 'owners-representation', short: "Acting as the owner's advocate across all contractors, vendors, and authorities.", text: "We represent the owner's interests in all dealings with contractors, subcontractors, vendors, and regulatory bodies. Our role is to ensure the project meets established standards, and to provide clear, timely reporting on progress, issues, and decisions." },
    { id: 'service-5', title: 'PMO Services', slug: 'pmo-services', short: 'Establishing a central project management function with standardized processes.', text: 'We set up and operate a Project Management Office tailored to the complexity and scale of your program. This includes standardization of reporting, risk tracking, schedule management, and budget controls \u2014 providing ownership with full visibility across all workstreams.' },
    { id: 'service-6', title: 'Quality Management & Assurance', slug: 'quality-management', short: 'Systematic quality control across all project phases.', text: 'We implement quality management methodologies with continuous monitoring at every project stage. Our process ensures compliance with client requirements and applicable standards, and identifies improvement opportunities before they become defects.' },
    { id: 'service-7', title: 'Document Control & Knowledge Management', slug: 'document-control', short: 'Managing project information to ensure accessibility and continuity.', text: 'We document, manage, and distribute all project-critical information to ensure that every stakeholder has access to current, accurate data. Lessons learned are captured and applied to future projects, driving continuous improvement across the organization.' },
    { id: 'service-8', title: 'Permitting & Regulatory Management', slug: 'permitting', short: 'Navigating entitlements, zoning, and permit processes on behalf of the owner.', text: 'We manage the full permitting and entitlement process, coordinating with planning authorities and regulatory bodies to secure approvals on schedule. Our team ensures all submissions meet current requirements and that the process is transparent and predictable for the client.' },
  ];

  for (let i = 0; i < services.length; i++) {
    const s = services[i];
    await seed(`Service: ${s.title}`, {
      _id: s.id,
      _type: 'service',
      title: s.title,
      slug: { _type: 'slug', current: s.slug },
      shortDescription: s.short,
      body: [pt(`svc${i}`, s.text)],
      isActive: true,
      order: i,
      updatedAt: now,
    });
  }

  // 5. Projects
  const projects = [
    { id: 'project-1', title: 'Riverside Mixed-Use Development', slug: 'riverside-mixed-use', short: "A 12-story mixed-use tower combining 180 residential units with ground-floor retail in Austin's East Riverside corridor.", text: "AMG served as Owner's Representative for this landmark mixed-use development from pre-design through certificate of occupancy. The project involved coordination of 14 design consultants, a CM-at-risk delivery model, and a compressed 28-month construction schedule." },
    { id: 'project-2', title: 'Highland Estate Residence', slug: 'highland-estate', short: 'A 7,200 sq ft custom residence in the Texas Hill Country, designed and built to the highest residential standard.', text: "AMG provided full owner's representation for this high-end custom home, managing a team of architect, interior designer, landscape architect, and general contractor from design development through final punch list." },
  ];

  for (let i = 0; i < projects.length; i++) {
    const p = projects[i];
    await seed(`Project: ${p.title}`, {
      _id: p.id,
      _type: 'project',
      title: p.title,
      slug: { _type: 'slug', current: p.slug },
      shortDescription: p.short,
      body: [pt(`prj${i}`, p.text)],
      isActive: true,
      isArchived: false,
      order: i,
      updatedAt: now,
    });
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  const ok = results.filter(r => r.ok).length;
  const fail = results.filter(r => !r.ok).length;
  console.log(`DONE: ${ok} succeeded, ${fail} failed out of ${results.length}`);
  if (fail > 0) {
    console.log('\nFailed:');
    results.filter(r => !r.ok).forEach(r => console.log(`  - ${r.label}: ${r.error}`));
  }
  console.log('='.repeat(50));
}

main();
