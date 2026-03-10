import { getCsrfToken } from './csrf'

export interface ApiResponse<T> {
  success: boolean
  requestId: string
  data: T | null
  total?: number
  initialized?: boolean
  error?: {
    category: string
    code: string
    message: string
    fieldErrors?: Record<string, string>
    retryable?: boolean
    mayHavePersisted?: boolean
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<ApiResponse<T>> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (method !== 'GET') {
      headers['X-CSRF-Token'] = getCsrfToken()
    }

    const res = await fetch(path, {
      method,
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    })

    if (res.status === 401) {
      window.location.href = '/admin/login'
      return {
        success: false,
        requestId: '',
        data: null,
        error: {
          category: 'AUTH',
          code: 'UNAUTHORIZED',
          message: 'Session expired',
        },
      }
    }

    const json = (await res.json()) as ApiResponse<T>
    return json
  } catch {
    return {
      success: false,
      requestId: '',
      data: null,
      error: {
        category: 'NETWORK',
        code: 'NETWORK_ERROR',
        message: 'Could not reach the server',
        retryable: true,
      },
    }
  }
}

export function adminGet<T>(path: string): Promise<ApiResponse<T>> {
  return request<T>('GET', path)
}

export function adminPost<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
  return request<T>('POST', path, body)
}

export function adminPut<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
  return request<T>('PUT', path, body)
}

export function adminPatch<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
  return request<T>('PATCH', path, body)
}

export function adminDelete<T>(path: string): Promise<ApiResponse<T>> {
  return request<T>('DELETE', path)
}
