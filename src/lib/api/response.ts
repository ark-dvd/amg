import { NextResponse } from 'next/server'

interface SuccessEnvelope<T> {
  success: true
  requestId: string
  data: T
}

interface ListEnvelope<T> {
  success: true
  requestId: string
  data: T[]
  total: number
}

interface UninitializedEnvelope {
  success: true
  requestId: string
  data: null
  initialized: false
}

interface ErrorDetail {
  category: string
  code: string
  message: string
  fieldErrors?: Record<string, string>
  retryable: boolean
  mayHavePersisted: boolean
}

interface ErrorEnvelope {
  success: false
  requestId: string
  error: ErrorDetail
}

export function successResponse<T>(data: T, requestId: string): NextResponse<SuccessEnvelope<T>> {
  return NextResponse.json({ success: true as const, requestId, data })
}

export function listResponse<T>(
  data: T[],
  total: number,
  requestId: string
): NextResponse<ListEnvelope<T>> {
  return NextResponse.json({ success: true as const, requestId, data, total })
}

export function uninitializedResponse(requestId: string): NextResponse<UninitializedEnvelope> {
  return NextResponse.json({
    success: true as const,
    requestId,
    data: null,
    initialized: false as const,
  })
}

export function errorResponse(
  category: string,
  code: string,
  message: string,
  requestId: string,
  status: number,
  options?: {
    fieldErrors?: Record<string, string>
    retryable?: boolean
    mayHavePersisted?: boolean
  }
): NextResponse<ErrorEnvelope> {
  return NextResponse.json(
    {
      success: false as const,
      requestId,
      error: {
        category,
        code,
        message,
        ...(options?.fieldErrors ? { fieldErrors: options.fieldErrors } : {}),
        retryable: options?.retryable ?? false,
        mayHavePersisted: options?.mayHavePersisted ?? false,
      },
    },
    { status }
  )
}
