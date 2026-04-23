import { test as base, request } from '@playwright/test'
import { BaseAPI } from '@/api/baseApi'
import { createCustomPage, CustomPage } from '@/pages/createCustomPage'
import { getEnv } from '@/utils/env'

type CustomFixtures = {
  customPage: CustomPage
  apiContext: BaseAPI
}

export const test = base.extend<CustomFixtures>({
  customPage: async ({ page }, use) => {
    const customPage = createCustomPage(page)
    await use(customPage)
  },

  apiContext: async ({}, use) => {
    const apiRequestContext = await request.newContext({
      baseURL: getEnv('API_BASE_URL'),
      extraHTTPHeaders: {
        Accept: 'application/json'
      }
    })

    const apiContext = new BaseAPI(apiRequestContext)
    await use(apiContext)
    await apiRequestContext.dispose()
  }
})

export { expect } from '@playwright/test'