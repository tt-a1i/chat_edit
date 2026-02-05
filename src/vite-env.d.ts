/// <reference types="vite/client" />

import type { MessageApi } from 'naive-ui'

declare global {
  interface Window {
    $message: MessageApi
    reportErrorToService?: (data: { message: string, error?: unknown, context?: Record<string, unknown> }) => void
  }
}
