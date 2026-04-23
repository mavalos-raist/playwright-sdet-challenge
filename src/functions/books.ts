import { APIRequestContext } from '@playwright/test'
import { BasePage } from '@/pages/basePage'
import { BaseAPI } from '@/api/baseApi'
import { AddBookPayload, Book, BooksResponse } from '@/types/books'
import { buildAddBookPayload } from '@/functions/testData'
import { buildJsonHeaders, getApiBaseUrl, resolveApiClient } from '@/functions/shared'

export function listBooks(context: BaseAPI): Promise<Book[]>
export function listBooks(context: BasePage): Promise<Book[]>
export function listBooks(context: APIRequestContext): Promise<Book[]>
export async function listBooks(
  context: BaseAPI | BasePage | APIRequestContext
): Promise<Book[]> {
  const api = await resolveApiClient(context)

  const data = await api.get<BooksResponse>(`${getApiBaseUrl()}/BookStore/v1/Books`, {
    headers: buildJsonHeaders()
  })
  return data.books
}

export function getBook(context: BaseAPI, isbn: string): Promise<Book>
export function getBook(context: BasePage, isbn: string): Promise<Book>
export function getBook(context: APIRequestContext, isbn: string): Promise<Book>
export async function getBook(
  context: BaseAPI | BasePage | APIRequestContext,
  isbn: string
): Promise<Book> {
  const api = await resolveApiClient(context)

  return await api.get<Book>(`${getApiBaseUrl()}/BookStore/v1/Book`, {
    headers: buildJsonHeaders(),
    params: { ISBN: isbn }
  })
}

export async function addToCollection(
  context: BaseAPI | BasePage | APIRequestContext,
  userId: string,
  isbn: string,
  token: string
): Promise<void> {
  const api = await resolveApiClient(context)
  const payload: AddBookPayload = buildAddBookPayload(userId, isbn)

  await api.post<Record<string, never>>(`${getApiBaseUrl()}/BookStore/v1/Books`, {
    headers: buildJsonHeaders(token),
    data: payload
  })
}

export async function removeFromCollection(
  context: BaseAPI | BasePage | APIRequestContext,
  userId: string,
  isbn: string,
  token: string
): Promise<void> {
  const api = await resolveApiClient(context)

  await api.delete<Record<string, never>>(`${getApiBaseUrl()}/BookStore/v1/Book`, {
    headers: buildJsonHeaders(token),
    data: {
      isbn,
      userId
    }
  })
}

export async function clearCollection(
  context: BaseAPI | BasePage | APIRequestContext,
  userId: string,
  token: string
): Promise<void> {
  const api = await resolveApiClient(context)

  await api.delete<Record<string, never>>(`${getApiBaseUrl()}/BookStore/v1/Books`, {
    headers: buildJsonHeaders(token),
    params: {
      UserId: userId
    }
  })
}