import { test, expect } from '@/fixtures/test'

import { registerUser, getUserProfile } from '@/functions/auth'
import { listBooks, addToCollection, removeFromCollection, clearCollection } from '@/functions/books'
import { buildAddBookPayload, generateUserData } from '@/functions/testData'
import { buildJsonHeaders, getApiBaseUrl } from '@/functions/shared'
import { cleanupUserData } from '@/utils/cleanup'
import { loginAndSync } from '@/utils/loginHelper'

test.use({ storageState: { cookies: [], origins: [] } })

test(
  'Books > Collection > Add book and verify in profile',
  {
    annotation: {
      type: 'ID',
      description: 'COLL-001'
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

      const authInfo = await loginAndSync(page, user)
      token = authInfo.token
      expect(authInfo.userId).toBe(userId)

      const books = await listBooks(apiContext)
      const targetBook = books[0]

      // Act
      await addToCollection(page, userId, targetBook.isbn, token)

      // Assert API
      const profile = await getUserProfile(page, userId, token)

      expect(Array.isArray(profile.books)).toBeTruthy()
      expect(profile.books).toHaveLength(1)
      expect(profile.books[0]?.isbn).toBe(targetBook.isbn)

      // Assert UI
      await page.goto('/profile')
      await expect(page.nativePage.getByText(targetBook.title)).toBeVisible()
      await expect(page.getByText(user.userName)).toBeVisible()
    } finally {
      await cleanupUserData(apiContext, userId, token).catch(() => {})
    }
  }
)

test(
  'Books > Collection > Remove book and verify it is gone',
  {
    annotation: {
      type: 'ID',
      description: 'COLL-002'
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

      const authInfo = await loginAndSync(page, user)
      token = authInfo.token
      expect(authInfo.userId).toBe(userId)

      const books = await listBooks(apiContext)
      const targetBook = books[0]

      await addToCollection(page, userId, targetBook.isbn, token)

      const beforeProfile = await getUserProfile(page, userId, token)
      expect(beforeProfile.books).toHaveLength(1)
      expect(beforeProfile.books[0]?.isbn).toBe(targetBook.isbn)

      // Act
      await removeFromCollection(page, userId, targetBook.isbn, token)

      // Assert API
      const afterProfile = await getUserProfile(page, userId, token)
      expect(afterProfile.books).toHaveLength(0)

      // Assert UI
      await page.goto('/profile')
      await expect(page.nativePage.getByText(targetBook.title)).toBeHidden()
    } finally {
      await cleanupUserData(apiContext, userId, token).catch(() => {})
    }
  }
)

test(
  'Books > Collection > Clear collection and verify empty state',
  {
    annotation: {
      type: 'ID',
      description: 'COLL-003'
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

      const authInfo = await loginAndSync(page, user)
      token = authInfo.token
      expect(authInfo.userId).toBe(userId)

      const books = await listBooks(apiContext)
      const book1 = books[0]
      const book2 = books[1]

      await addToCollection(page, userId, book1.isbn, token)
      await addToCollection(page, userId, book2.isbn, token)

      const beforeProfile = await getUserProfile(page, userId, token)
      expect(beforeProfile.books).toHaveLength(2)

      // Act
      await clearCollection(page, userId, token)

      // Assert API
      const afterProfile = await getUserProfile(page, userId, token)
      expect(afterProfile.books).toHaveLength(0)

      // Assert UI
      await page.goto('/profile')
      await expect(page.nativePage.getByText(book1.title)).toBeHidden()
      await expect(page.nativePage.getByText(book2.title)).toBeHidden()
    } finally {
      await cleanupUserData(apiContext, userId, token).catch(() => {})
    }
  }
)

test(
  'Books > Collection > Reject duplicate book add',
  {
    annotation: {
      type: 'ID',
      description: 'COLL-004'
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

      const authInfo = await loginAndSync(page, user)
      token = authInfo.token
      expect(authInfo.userId).toBe(userId)

      const books = await listBooks(apiContext)
      const targetBook = books[0]

      await addToCollection(page, userId, targetBook.isbn, token)

      // Act: attempt duplicate via raw APIRequestContext (bypasses BaseAPI auto-assert)
      const duplicateResponse = await apiContext.context.post(
        `${getApiBaseUrl()}/BookStore/v1/Books`,
        {
          headers: buildJsonHeaders(token),
          data: buildAddBookPayload(userId, targetBook.isbn)
        }
      )

      // Assert: DemoQA returns 400 for duplicate ISBN (code 1210 — already in collection)
      expect(duplicateResponse.status()).toBe(400)
      const body = await duplicateResponse.json() as { code: string; message: string }
      expect(body.code).toBe('1210')

      // Assert no duplicate in collection
      const profile = await getUserProfile(page, userId, token)
      expect(profile.books).toHaveLength(1)
      expect(profile.books[0]?.isbn).toBe(targetBook.isbn)
    } finally {
      await cleanupUserData(apiContext, userId, token).catch(() => {})
    }
  }
)
