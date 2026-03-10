import { NextResponse } from 'next/server'

interface SuccessEnvelope<T> {
  success: true
  data: T
  requestId: string
}

interface ErrorEnvelope {
  success: false
  error: {
    code: string
    message: string
  }
  requestId: string
}

export function successResponse<T>(data: T, requestId: string): NextResponse<SuccessEnvelope<T>> {
  return NextResponse.json({ success: true, data, requestId } as SuccessEnvelope<T>)
}

export function errorResponse(
  code: string,
  message: string,
  requestId: string,
  status: number
): NextResponse<ErrorEnvelope> {
  return NextResponse.json(
    { success: false, error: { code, message }, requestId } as ErrorEnvelope,
    { status }
  )
}
