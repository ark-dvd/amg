let cachedToken: string | null = null

export function getCsrfToken(): string {
  if (cachedToken) return cachedToken
  const match = document.cookie.match(/(?:^|;\s*)csrf-token=([^;]+)/)
  const token = match?.[1] ? decodeURIComponent(match[1]) : ''
  if (token) cachedToken = token
  return token
}

export async function ensureCsrfToken(): Promise<string> {
  const existing = getCsrfToken()
  if (existing) return existing

  const res = await fetch('/api/admin/csrf')
  if (res.ok) {
    const data = await res.json() as { csrfToken: string }
    cachedToken = data.csrfToken
    return data.csrfToken
  }
  return ''
}

export function clearCsrfCache(): void {
  cachedToken = null
}
