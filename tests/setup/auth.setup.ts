import { test as setup, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { BasePage } from '@/pages/basePage'
import { getEnv } from '@/utils/env'

const authFile = path.resolve('storageState/user.json')
const username = getEnv('TEST_USERNAME')
const password = getEnv('TEST_PASSWORD')

setup('authenticate bootstrap user and save storage state', async ({ page }) => {
  const basePage = new BasePage(page)

  fs.mkdirSync(path.dirname(authFile), { recursive: true })

  await page.goto('/login')

  await page.getByPlaceholder('UserName').fill(username)
  await page.getByPlaceholder('Password').fill(password)
  await page.getByRole('button', { name: 'Login' }).click()

  await expect(page).toHaveURL(/.*profile/, { timeout: 15000 })
  const authState = await basePage.getAuthInfo()
  await basePage.syncAuthState({
    ...authState,
    password
  })
  await page.context().storageState({ path: authFile })
})
