const ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: 'Your session has expired. Please sign in again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  CSRF_INVALID: 'Your session may have expired. Please refresh the page.',
  NOT_FOUND: 'This item could not be found. It may have been deleted.',
  NOT_INITIALIZED: 'This section has not been set up yet.',
  CONFLICT: 'This content was modified in another session. Please reload to see the latest version.',
  ARCHIVE_REQUIRED: 'This project must be archived before it can be permanently deleted.',
  VALIDATION_FAILED: 'Please check the highlighted fields and try again.',
  SLUG_CONFLICT: 'This URL slug is already in use. Please choose a different one.',
  WRITE_FAILED: 'The changes could not be saved. Please try again.',
  WRITE_TIMEOUT: 'The save operation timed out. Please try again.',
  READBACK_FAILED: 'Your changes may have been saved. Please reload to verify before retrying.',
  SERVER_ERROR: 'An unexpected error occurred. Please try again.',
  RATE_LIMITED: 'Too many requests. Please wait a moment and try again.',
  NETWORK_ERROR: 'Could not reach the server. Please check your connection.',
}

export function getErrorMessage(code: string): string {
  return ERROR_MESSAGES[code] ?? ERROR_MESSAGES.SERVER_ERROR ?? 'An unexpected error occurred.'
}
