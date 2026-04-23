export interface ApiRequestOptions {
  headers?: Record<string, string>
  params?: Record<string, string>
  data?: unknown
}

export interface ApiErrorDetails {
  status: number
  statusText: string
  body: string
}