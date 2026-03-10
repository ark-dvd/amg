import { logMutation } from '@/lib/logger'

export interface MutationOptions<T> {
  requestId: string
  route: string
  method: string
  entityType: string
  entityId: string
  preWriteRev: string | null
  writeOperation: () => Promise<void>
  readBack: () => Promise<T | null>
  verifyReadBack: (doc: T) => boolean
}

export interface MutationSuccess<T> {
  success: true
  data: T
}

export interface MutationFailure {
  success: false
  code: string
  message: string
  mayHavePersisted: boolean
}

export type MutationResult<T> = MutationSuccess<T> | MutationFailure

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function executeMutation<T>(
  opts: MutationOptions<T>
): Promise<MutationResult<T>> {
  const startTime = Date.now()
  let writeAcknowledged = false

  try {
    await opts.writeOperation()
    writeAcknowledged = true
  } catch (err) {
    const durationMs = Date.now() - startTime
    const isTimeout =
      err instanceof Error && (err.message.includes('timeout') || err.message.includes('ETIMEDOUT'))
    const code = isTimeout ? 'WRITE_TIMEOUT' : 'WRITE_FAILED'

    logMutation({
      level: 'error',
      type: 'mutation',
      requestId: opts.requestId,
      route: opts.route,
      method: opts.method,
      entityType: opts.entityType,
      entityId: opts.entityId,
      outcome: 'FAILURE',
      errorCode: code,
      durationMs,
      timestamp: new Date().toISOString(),
    })

    return {
      success: false,
      code,
      message: isTimeout
        ? 'The write operation timed out'
        : 'The write operation failed',
      mayHavePersisted: false,
    }
  }

  // READ_BACK_VERIFY phase — 2-second ceiling
  const readBackStart = Date.now()
  const readBackCeiling = 2000

  let doc = await opts.readBack()

  if (!doc && Date.now() - readBackStart < readBackCeiling) {
    await sleep(200)
    doc = await opts.readBack()
  }

  const durationMs = Date.now() - startTime

  if (!doc) {
    logMutation({
      level: 'error',
      type: 'mutation',
      requestId: opts.requestId,
      route: opts.route,
      method: opts.method,
      entityType: opts.entityType,
      entityId: opts.entityId,
      outcome: 'FAILURE',
      errorCode: 'READBACK_FAILED',
      durationMs,
      timestamp: new Date().toISOString(),
    })

    return {
      success: false,
      code: 'READBACK_FAILED',
      message: 'Your changes may have been saved. Please reload before retrying.',
      mayHavePersisted: true,
    }
  }

  if (!opts.verifyReadBack(doc)) {
    logMutation({
      level: 'error',
      type: 'mutation',
      requestId: opts.requestId,
      route: opts.route,
      method: opts.method,
      entityType: opts.entityType,
      entityId: opts.entityId,
      outcome: 'FAILURE',
      errorCode: 'READBACK_FAILED',
      durationMs,
      timestamp: new Date().toISOString(),
    })

    return {
      success: false,
      code: 'READBACK_FAILED',
      message: 'Your changes may have been saved. Please reload before retrying.',
      mayHavePersisted: writeAcknowledged,
    }
  }

  logMutation({
    level: 'info',
    type: 'mutation',
    requestId: opts.requestId,
    route: opts.route,
    method: opts.method,
    entityType: opts.entityType,
    entityId: opts.entityId,
    outcome: 'SUCCESS',
    durationMs,
    timestamp: new Date().toISOString(),
  })

  return { success: true, data: doc }
}
