const { createClient } = require('@sanity/client')
const { readFileSync } = require('fs')
const { resolve } = require('path')

// Load .env.local manually (no dotenv dependency)
const envPath = resolve(__dirname, '..', '.env.local')
for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eq = trimmed.indexOf('=')
  if (eq === -1) continue
  const key = trimmed.slice(0, eq).trim()
  const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
  if (!process.env[key]) process.env[key] = val
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

function block(text, style = 'normal') {
  return {
    _type: 'block',
    _key: Math.random().toString(36).slice(2),
    style,
    markDefs: [],
    children: [{ _type: 'span', _key: Math.random().toString(36).slice(2), text, marks: [] }],
  }
}

function h2(text) { return block(text, 'h2') }
function h3(text) { return block(text, 'h3') }
function p(text) { return block(text, 'normal') }

const termsContent = [
  h2('Terms of Use'),
  p('Effective Date: January 1, 2025 | Last Updated: March 1, 2025'),
  p('These Terms of Use (\u201cTerms\u201d) govern your access to and use of the website operated by Aron Miller Group LLC (\u201cAMG,\u201d \u201cwe,\u201d \u201cour,\u201d or \u201cus\u201d), located at amgpm.com (the \u201cSite\u201d). By accessing or using the Site, you agree to be bound by these Terms. If you do not agree, please do not use the Site.'),

  h2('1. Use of the Site'),
  p('You may use the Site for lawful purposes only. You agree not to: (a) use the Site in any manner that violates applicable local, state, federal, or international law or regulation; (b) transmit any unsolicited or unauthorized advertising or promotional material; (c) attempt to gain unauthorized access to any portion of the Site or any systems or networks connected to the Site; or (d) interfere with or disrupt the integrity or performance of the Site.'),

  h2('2. Intellectual Property'),
  p('All content on the Site \u2014 including text, graphics, logos, images, and software \u2014 is the property of AMG or its content suppliers and is protected by applicable intellectual property laws. You may not reproduce, distribute, modify, or create derivative works without our prior written consent.'),

  h2('3. No Professional Advice'),
  p('The content on this Site is provided for general informational purposes only. It does not constitute professional advice of any kind \u2014 legal, financial, engineering, or otherwise. You should consult qualified professionals before making decisions based on information you find on this Site.'),

  h2('4. Contact Form and Communications'),
  p('Submitting the contact form on this Site does not create a client relationship or any professional engagement with AMG. We will respond to inquiries at our discretion. No confidentiality should be assumed from information submitted through the Site.'),

  h2('5. Disclaimer of Warranties'),
  p('The Site is provided on an \u201cas is\u201d and \u201cas available\u201d basis without warranties of any kind, either express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement. AMG does not warrant that the Site will be uninterrupted, error-free, or free of viruses or other harmful components.'),

  h2('6. Limitation of Liability'),
  p('To the fullest extent permitted by applicable law, AMG and its officers, directors, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of or inability to use the Site, even if advised of the possibility of such damages. Our total liability to you for any claim arising out of or relating to these Terms or your use of the Site shall not exceed one hundred dollars ($100).'),

  h2('7. Third-Party Links'),
  p('The Site may contain links to third-party websites. These links are provided for convenience only. AMG has no control over the content of those sites and accepts no responsibility for them or for any loss or damage that may arise from your use of them.'),

  h2('8. Governing Law'),
  p('These Terms are governed by and construed in accordance with the laws of the State of Texas, without regard to its conflict of law provisions. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the state and federal courts located in Travis County, Texas.'),

  h2('9. Changes to These Terms'),
  p('We reserve the right to modify these Terms at any time. Changes will be posted on this page with an updated effective date. Your continued use of the Site after any changes constitutes your acceptance of the new Terms.'),

  h2('10. Contact'),
  p('Questions about these Terms? Contact us at: Aron Miller Group LLC, Austin, Texas. Email: info@amgpm.com'),
]

const privacyContent = [
  h2('Privacy Policy'),
  p('Effective Date: January 1, 2025 | Last Updated: March 1, 2025'),
  p('Aron Miller Group LLC (\u201cAMG,\u201d \u201cwe,\u201d \u201cour,\u201d or \u201cus\u201d) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard information when you visit amgpm.com (the \u201cSite\u201d).'),

  h2('1. Information We Collect'),
  h3('Information You Provide'),
  p('When you submit the contact form on our Site, we collect: your name, email address, phone number (optional), company name (optional), and message content. This information is used solely to respond to your inquiry.'),

  h3('Automatically Collected Information'),
  p('When you visit the Site, we may automatically collect certain technical information, including your IP address, browser type, operating system, referring URLs, and pages visited. This information is collected through analytics tools (including Google Analytics) and is used to understand how visitors use the Site and to improve our content.'),

  h2('2. How We Use Your Information'),
  p('We use the information we collect to: respond to inquiries submitted through the contact form; analyze and improve Site performance and content; comply with legal obligations.'),
  p('We do not sell, rent, or share your personal information with third parties for marketing purposes.'),

  h2('3. Contact Form Submissions'),
  p('Information submitted through the contact form is transmitted to AMG via email notification. We do not store contact form submissions in a database. Messages are retained only as long as necessary to respond to your inquiry.'),

  h2('4. Google Analytics'),
  p('We use Google Analytics to collect aggregated, anonymized information about Site usage. Google Analytics uses cookies to collect this information. You can opt out of Google Analytics tracking by installing the Google Analytics Opt-out Browser Add-on, available at tools.google.com/dlpage/gaoptout.'),

  h2('5. Cookies'),
  p('The Site uses minimal cookies. Functional cookies may be set to support Site operation. Analytics cookies are set by Google Analytics as described above. No advertising or tracking cookies are used by AMG directly.'),

  h2('6. Data Security'),
  p('We implement reasonable technical and organizational measures to protect information submitted through the Site. However, no transmission of data over the internet is guaranteed to be completely secure. We cannot guarantee the security of information you transmit to us.'),

  h2('7. Children\'s Privacy'),
  p('The Site is not directed to children under the age of 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us and we will delete it.'),

  h2('8. Texas Privacy Rights'),
  p('If you are a Texas resident, you may have certain rights under the Texas Data Privacy and Security Act (TDPSA), including the right to access, correct, delete, or obtain a copy of your personal data. To exercise these rights, contact us using the information below.'),

  h2('9. Changes to This Policy'),
  p('We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated effective date. Your continued use of the Site after any changes constitutes your acceptance of the revised policy.'),

  h2('10. Contact'),
  p('Questions about this Privacy Policy or your personal information? Contact us at: Aron Miller Group LLC, Austin, Texas. Email: info@amgpm.com'),
]

const accessibilityContent = [
  h2('Accessibility Statement'),
  p('Last Updated: March 1, 2025'),
  p('Aron Miller Group LLC (\u201cAMG\u201d) is committed to ensuring that amgpm.com is accessible to people with disabilities. We strive to meet the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards.'),

  h2('Our Commitment'),
  p('We believe that accessibility is a continuous process, not a checklist. We are actively working to improve the accessibility of our Site and to provide an equivalent experience for all users regardless of ability.'),

  h2('Measures We Have Taken'),
  p('To support accessibility on this Site, we have implemented the following: semantic HTML structure throughout all public pages; sufficient color contrast ratios on text and interactive elements; keyboard navigability for all interactive components; descriptive alt text on all meaningful images; clear and consistent navigation structure; responsive design that works across screen sizes and zoom levels; form fields with visible labels and clear error messages.'),

  h2('Known Limitations'),
  p('While we work toward full WCAG 2.1 Level AA compliance, there may be areas of the Site that do not yet fully meet these standards. We are actively working to identify and address these gaps.'),

  h2('Third-Party Content'),
  p('Some content or functionality on the Site may be provided by third-party services (including embedded maps, analytics, or video players). We cannot control the accessibility of third-party content, but we select partners who share our commitment to accessibility where possible.'),

  h2('Feedback and Contact'),
  p('We welcome feedback on the accessibility of this Site. If you experience barriers accessing any content or functionality, or if you need information in an alternative format, please contact us:'),
  p('Aron Miller Group LLC | Austin, Texas | Email: info@amgpm.com'),
  p('We will work to respond to accessibility feedback within 5 business days and to resolve reported issues within a reasonable timeframe.'),

  h2('Formal Complaints'),
  p('If you are not satisfied with our response to your accessibility concern, you may contact the U.S. Department of Justice\'s ADA Information Line at 1-800-514-0301 (voice) or 1-800-514-0383 (TTY).'),
]

async function restore() {
  await client
    .patch('singleton.siteSettings')
    .set({
      termsContent,
      privacyContent,
      accessibilityContent,
    })
    .commit()

  console.log('Done — legal content restored to singleton.siteSettings')
}

restore().catch(console.error)
