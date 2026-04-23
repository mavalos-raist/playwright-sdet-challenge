import { faker } from '@faker-js/faker'
import { AddBookPayload } from '@/types/books'
import { UserData } from '@/types/user'

export function uniqueUsername(): string {
  const suffix = `${Date.now()}-${faker.string.alphanumeric(6)}`
  return `test_user_${suffix}`
}

/**
 * Builds a password that satisfies DemoQA password requirements:
 * uppercase, lowercase, number, and special character.
 */
export function uniquePassword(): string {
  return `Aa1!${faker.string.alphanumeric(8)}`
}

export function generateUserData(): UserData {
  return {
    userName: uniqueUsername(),
    password: uniquePassword(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName()
  }
}

export function buildAddBookPayload(userId: string, isbn: string): AddBookPayload {
  return {
    userId,
    collectionOfIsbns: [{ isbn }]
  }
}