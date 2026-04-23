import { APIRequestContext } from '@playwright/test'
import { BasePage } from '@/pages/basePage'
import { BaseAPI } from '@/api/baseApi'
import {
  CreatedUserResponse,
  Credentials,
  TokenResponse,
  UserData,
  UserProfile
} from '@/types/user'
import { buildJsonHeaders, getApiBaseUrl, resolveApiClient } from '@/functions/shared'

export function registerUser(context: BaseAPI, userData: UserData): Promise<CreatedUserResponse>
export function registerUser(context: BasePage, userData: UserData): Promise<CreatedUserResponse>
export function registerUser(
  context: APIRequestContext,
  userData: UserData
): Promise<CreatedUserResponse>
export async function registerUser(
  context: BaseAPI | BasePage | APIRequestContext,
  userData: UserData
): Promise<CreatedUserResponse> {
  const api = await resolveApiClient(context)

  return await api.post<CreatedUserResponse>(`${getApiBaseUrl()}/Account/v1/User`, {
    headers: buildJsonHeaders(),
    data: {
      userName: userData.userName,
      password: userData.password
    }
  })
}

export function generateToken(context: BaseAPI, credentials: Credentials): Promise<TokenResponse>
export function generateToken(context: BasePage, credentials: Credentials): Promise<TokenResponse>
export function generateToken(
  context: APIRequestContext,
  credentials: Credentials
): Promise<TokenResponse>
export async function generateToken(
  context: BaseAPI | BasePage | APIRequestContext,
  credentials: Credentials
): Promise<TokenResponse> {
  const api = await resolveApiClient(context)

  return await api.post<TokenResponse>(`${getApiBaseUrl()}/Account/v1/GenerateToken`, {
    headers: buildJsonHeaders(),
    data: credentials
  })
  
}

export function getUserProfile(context: BaseAPI, userId: string, token: string): Promise<UserProfile>
export function getUserProfile(context: BasePage, userId: string, token: string): Promise<UserProfile>
export function getUserProfile(
  context: APIRequestContext,
  userId: string,
  token: string
): Promise<UserProfile>
export async function getUserProfile(
  context: BaseAPI | BasePage | APIRequestContext,
  userId: string,
  token: string
): Promise<UserProfile> {
  const api = await resolveApiClient(context)

  return api.get<UserProfile>(`${getApiBaseUrl()}/Account/v1/User/${userId}`, {
    headers: buildJsonHeaders(token)
  })
}

export async function deleteUser(
  context: BaseAPI | BasePage | APIRequestContext,
  token: string,
  userId: string
): Promise<void> {
  const api = await resolveApiClient(context)

  await api.delete<Record<string, never>>(`${getApiBaseUrl()}/Account/v1/User/${userId}`, {
    headers: buildJsonHeaders(token)
  })
}