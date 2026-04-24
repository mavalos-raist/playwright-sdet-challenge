import { test, expect } from '@/fixtures/test'
import { listBooks, getBook } from '@/functions/books'

test.use({ storageState: { cookies: [], origins: [] } })

test(
  'Books > Catalog > List all books and verify dataset',
  {
    annotation: {
      type: 'ID',
      description: 'BOOK-001'
    }
  },
  async ({ apiContext }) => {
    // Arrange / Act
    const books = await listBooks(apiContext)

    // Assert
    expect(Array.isArray(books)).toBeTruthy()
    expect(books.length).toBeGreaterThan(0)

    const firstBook = books[0]

    expect(firstBook.isbn).toBeTruthy()
    expect(firstBook.title).toBeTruthy()
    expect(firstBook.author).toBeTruthy()

    const detailedBook = await getBook(apiContext, firstBook.isbn)

    expect(detailedBook.isbn).toBe(firstBook.isbn)
    expect(detailedBook.title).toBe(firstBook.title)
  }
)

test(
  'Books > Catalog > Search and open detail view',
  {
    annotation: {
      type: 'ID',
      description: 'BOOK-002'
    }
  },
  async ({ apiContext, customPage: page }) => {
    // Arrange
    const books = await listBooks(apiContext)
    const targetBook = books[0]

    await page.goto('/books')

    // Act
    await page.getByPlaceholder('Type to search').fill(targetBook.title)

    // Assert search results
    await expect(page.nativePage.getByText(targetBook.title)).toBeVisible()
    await expect(page.nativePage.getByText(targetBook.author)).toBeVisible()

    // Act: open detail
    await page.nativePage.getByRole('link', { name: targetBook.title }).click()

    // Assert detail view
    await expect(page.nativePage).toHaveURL(/.*book/)
    await expect(page.nativePage.getByText(targetBook.title)).toBeVisible()
    await expect(page.nativePage.getByText(targetBook.author)).toBeVisible()
    await expect(page.nativePage.getByText(targetBook.isbn)).toBeVisible()
  }
)