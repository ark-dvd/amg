export interface MutationLogEntry {
  level: 'info' | 'warn' | 'error'
  type: 'mutation'
  requestId: string
  route: string
  method: string
  entityType: string
  entityId: string
  outcome: 'SUCCESS' | 'FAILURE'
  errorCode?: string
  durationMs: number
  timestamp: string
}

export interface SecurityLogEntry {
  level: 'info' | 'warn' | 'error'
  type: 'security'
  requestId: string
  event: string
  route: string
  ip: string
  timestamp: string
}

export function logMutation(entry: MutationLogEntry): void {
  console.log(JSON.stringify(entry))
}

export function logSecurityEvent(entry: SecurityLogEntry): void {
  console.log(JSON.stringify(entry))
}
