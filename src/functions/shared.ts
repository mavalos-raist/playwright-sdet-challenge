import { APIRequestContext } from '@playwright/test'
import { BaseAPI } from '@/api/baseApi'
import { BasePage } from '@/pages/basePage'
import { getEnv } from '@/utils/env'

export type SupportedApiContext = BaseAPI | BasePage | APIRequestContext

export async function resolveApiClient(context: SupportedApiContext): Promise<BaseAPI> {
  if (context instanceof BaseAPI) {
    return context
  }

  if (context instanceof BasePage) {
    const apiContext = await context.getAPI()
    return new BaseAPI(apiContext)
  }

  return new BaseAPI(context)
}

export function buildJsonHeaders(token?: string): Record<string, string> {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }
}

export function getApiBaseUrl(): string {
  return getEnv('API_BASE_URL')
}