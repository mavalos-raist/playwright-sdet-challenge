import { expect } from '@playwright/test'
import { BasePage } from '@/pages/basePage'
import { AuthState, UserData } from '@/types/user'

/**
 * Logs an ephemeral user in via the DemoQA UI and syncs the resulting auth
 * state into localStorage so page.getAPI() and the profile page both work.
 *
 * DemoQA stores auth as cookies after login. syncAuthState() mirrors those
 * values into localStorage in the format DemoQA's React app expects, enabling
 * full-page reloads of /profile to render correctly.
 */
export async function loginAndSync(page: BasePage, user: UserData): Promise<AuthState> {
  await page.nativePage.goto('/login')
  await page.nativePage.getByPlaceholder('UserName').fill(user.userName)
  await page.nativePage.getByPlaceholder('Password').fill(user.password)
  await page.nativePage.getByRole('button', { name: 'Login' }).click()

  await expect(page.nativePage).toHaveURL(/.*profile/, { timeout: 15000 })

  const authInfo = await page.getAuthInfo()
  expect(authInfo.token, 'UI login must produce an auth token').toBeTruthy()

  return page.syncAuthState({ ...authInfo, password: user.password })
}
