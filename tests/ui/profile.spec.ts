import { test, expect } from '@/fixtures/test'
import { generateUserData } from '@/functions/testData'
import { registerUser } from '@/functions/auth'
import { cleanupUserData } from '@/utils/cleanup'
import { loginAndSync } from '@/utils/loginHelper'

test.use({ storageState: { cookies: [], origins: [] } })

test(
  'Profile > User data > Show correct username after login',
  {
    annotation: {
      type: 'ID',
      description: 'PROF-001'
    }
  },
  async ({ apiContext, customPage: page }) => {
    const user = generateUserData()

    let userId = ''
    let token = ''

    try {
      // Arrange
      const createdUser = await registerUser(apiContext, user)
      userId = createdUser.userID

      // Act
      const authInfo = await loginAndSync(page, user)
      token = authInfo.token

      // Assert
      expect(authInfo.userId).toBe(userId)
      expect(authInfo.isLoggedIn).toBe(true)

      await expect(page.nativePage.getByText(user.userName)).toBeVisible()

      const currentUserId = await page.getUserId()
      expect(currentUserId).toBe(userId)

      const currentUserData = await page.getUserData()
      expect(currentUserData.userName).toBe(user.userName)
    } finally {
      await cleanupUserData(apiContext, userId, token).catch(() => {})
    }
  }
)
