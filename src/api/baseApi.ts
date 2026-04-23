import {
  APIRequestContext,
  APIResponse,
  expect
} from '@playwright/test'

import { ApiRequestOptions } from '@/types/api'

export class BaseAPI {
  constructor(private readonly requestContext: APIRequestContext) {}

  get context(): APIRequestContext {
    return this.requestContext
  }

  async get<T>(
    url: string,
    options?: ApiRequestOptions
  ): Promise<T> {
    const response = await this.requestContext.get(url, {
      headers: options?.headers,
      params: options?.params
    })

    await this.ensureSuccess(response)

    return (await response.json()) as T
  }

  async post<T>(
    url: string,
    options?: ApiRequestOptions
  ): Promise<T> {
    const response = await this.requestContext.post(url, {
      headers: options?.headers,
      params: options?.params,
      data: options?.data
    })

    await this.ensureSuccess(response)

    return (await response.json()) as T
  }

  async delete<T>(
    url: string,
    options?: ApiRequestOptions
  ): Promise<T> {
    const response = await this.requestContext.delete(url, {
      headers: options?.headers,
      params: options?.params,
      data: options?.data
    })

    await this.ensureSuccess(response)

    if (response.status() === 204) {
      return {} as T
    }

    return (await response.json()) as T
  }

  private async ensureSuccess(
    response: APIResponse
  ): Promise<void> {
    expect(
      response.ok(),
      `API request failed with status ${response.status()}`
    ).toBeTruthy()
  }
}