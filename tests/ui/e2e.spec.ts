import { test, expect } from '@/fixtures/test'
import { registerUser, getUserProfile } from '@/functions/auth'
import { listBooks, addToCollection, removeFromCollection } from '@/functions/books'
import { generateUserData } from '@/functions/testData'
import { cleanupUserData } from '@/utils/cleanup'
import { loginAndSync } from '@/utils/loginHelper'

test.use({ storageState: { cookies: [], origins: [] } })

test(
  'End to End > User journey > Register add verify remove verify gone',
  {
    annotation: {
      type: 'ID',
      description: 'E2E-001'
    }
  },
  async ({ apiContext, customPage: page }) => {
    const user = generateUserData()

    let userId = ''
    let token = ''

    try {
      // Register
      const createdUser = await registerUser(apiContext, user)
      userId = createdUser.userID
      expect(userId).toBeTruthy()
      expect(createdUser.username).toBe(user.userName)

      // Login and sync auth state
      const authInfo = await loginAndSync(page, user)
      token = authInfo.token
      expect(authInfo.userId).toBe(userId)

      // Add book
      const books = await listBooks(apiContext)
      const targetBook = books[0]
      await addToCollection(page, userId, targetBook.isbn, token)

      // Verify add — API
      const afterAdd = await getUserProfile(page, userId, token)
      expect(afterAdd.books).toHaveLength(1)
      expect(afterAdd.books[0]?.isbn).toBe(targetBook.isbn)

      // Verify add — UI
      await page.goto('/profile')
      await expect(page.nativePage.getByText(targetBook.title)).toBeVisible()

      // Remove book
      await removeFromCollection(page, userId, targetBook.isbn, token)

      // Verify remove — API
      const afterRemove = await getUserProfile(page, userId, token)
      expect(afterRemove.books).toHaveLength(0)

      // Verify remove — UI (guard: confirm profile loaded before checking book is absent)
      await page.goto('/profile')
      await expect(page.nativePage.getByText(user.userName)).toBeVisible()
      await expect(page.nativePage.getByText(targetBook.title)).toBeHidden()
    } finally {
      await cleanupUserData(apiContext, userId, token).catch(() => {})
    }
  }
)
