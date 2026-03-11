'use client'

import { useState } from 'react'

interface ContactFormProps {
  labels: {
    name: string
    email: string
    phone: string
    company: string
    message: string
    submit: string
    success: string
    error: string
  }
}

export function ContactForm({ labels }: ContactFormProps) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('submitting')

    const form = e.currentTarget
    const formData = new URLSearchParams()
    formData.append('form-name', 'contact')
    formData.append('bot-field', '')
    formData.append('name', new FormData(form).get('name') as string)
    formData.append('email', new FormData(form).get('email') as string)
    formData.append('phone', (new FormData(form).get('phone') as string) || '')
    formData.append('company', (new FormData(form).get('company') as string) || '')
    formData.append('message', new FormData(form).get('message') as string)

    try {
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      })

      if (res.ok) {
        setStatus('success')
        form.reset()
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="bg-green-50 border border-green-200 text-green-800 p-6 rounded-lg">
        <p>{labels.success}</p>
      </div>
    )
  }

  return (
    <form
      name="contact"
      data-netlify="true"
      data-netlify-honeypot="bot-field"
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <input type="hidden" name="form-name" value="contact" />
      <input type="hidden" name="bot-field" />

      {status === 'error' && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
          <p>{labels.error}</p>
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-charcoal mb-1">
          {labels.name} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          className="w-full px-4 py-3 bg-white border border-border rounded-lg focus:ring-2 focus:ring-gold focus:border-gold text-base transition-colors"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-charcoal mb-1">
          {labels.email} <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          className="w-full px-4 py-3 bg-white border border-border rounded-lg focus:ring-2 focus:ring-gold focus:border-gold text-base transition-colors"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-charcoal mb-1">
          {labels.phone}
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          className="w-full px-4 py-3 bg-white border border-border rounded-lg focus:ring-2 focus:ring-gold focus:border-gold text-base transition-colors"
        />
      </div>

      <div>
        <label htmlFor="company" className="block text-sm font-medium text-charcoal mb-1">
          {labels.company}
        </label>
        <input
          type="text"
          id="company"
          name="company"
          className="w-full px-4 py-3 bg-white border border-border rounded-lg focus:ring-2 focus:ring-gold focus:border-gold text-base transition-colors"
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-charcoal mb-1">
          {labels.message} <span className="text-red-500">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={4}
          className="w-full px-4 py-3 bg-white border border-border rounded-lg focus:ring-2 focus:ring-gold focus:border-gold text-base resize-y transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full sm:w-auto px-8 py-3 text-xs font-medium uppercase tracking-widest bg-gold hover:bg-transparent text-white hover:text-gold border border-gold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === 'submitting' ? 'Sending...' : labels.submit}
      </button>
    </form>
  )
}
