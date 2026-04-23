import { test, expect } from '@/fixtures/test'
import { generateUserData } from '@/functions/testData'
import { registerUser, generateToken, getUserProfile } from '@/functions/auth'
import { cleanupUserData } from '@/utils/cleanup'
import { loginAndSync } from '@/utils/loginHelper'

test.use({ storageState: { cookies: [], origins: [] } })

test(
  'Authentication > Login > Reject invalid credentials',
  {
    annotation: {
      type: 'ID',
      description: 'AUTH-001'
    }
  },
  async ({ customPage: page }) => {
    // Arrange
    const invalidUsername = 'invalid_user'
    const invalidPassword = 'InvalidPassword123!'

    await page.goto('/login')

    // Act
    await page.getByPlaceholder('UserName').fill(invalidUsername)
    await page.getByPlaceholder('Password').fill(invalidPassword)
    await page.getByRole('button', { name: 'Login' }).click()

    // Assert
    await expect(page.nativePage).toHaveURL(/.*login/)
    await expect(page.nativePage.locator('#name')).toContainText(/invalid|fail|unauthorized/i)

    const authSnapshot = await page.nativePage.evaluate(() => {
      return {
        token: window.localStorage.getItem('token'),
        userInfo: window.localStorage.getItem('userInfo'),
        userName: window.localStorage.getItem('userName')
      }
    })

    expect(authSnapshot.token).toBeFalsy()
    expect(authSnapshot.userInfo).toBeFalsy()
    expect(authSnapshot.userName).toBeFalsy()
  }
)

test(
  'Authentication > Register > Create unique user successfully',
  {
    annotation: {
      type: 'ID',
      description: 'AUTH-002'
    }
  },
  async ({ apiContext, customPage: page }) => {
    const user = generateUserData()

    let userId = ''
    let token = ''

    try {
      // Act: register via API
      const createdUser = await registerUser(apiContext, user)
      userId = createdUser.userID

      // Assert registration response
      expect(userId).toBeTruthy()
      expect(createdUser.username).toBe(user.userName)
      expect(createdUser.books).toHaveLength(0)

      // Prove account is usable: UI login activates DemoQA account for token generation
      const authInfo = await loginAndSync(page, user)
      token = authInfo.token
      expect(authInfo.userId).toBe(userId)

      // Verify fresh account profile has no books
      const tokenResponse = await generateToken(apiContext, {
        userName: user.userName,
        password: user.password
      })
      const profile = await getUserProfile(apiContext, userId, tokenResponse.token)
      expect(profile.books).toHaveLength(0)
    } finally {
      await cleanupUserData(apiContext, userId, token).catch(() => {})
    }
  }
)
