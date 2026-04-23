import { APIRequestContext, Page, request } from '@playwright/test'
import { AuthState, UserData } from '@/types/user'
import { getEnv } from '@/utils/env'

type RawAuthState = {
  nestedUserInfo?: string | null
  userId?: string | null
  userID?: string | null
  userName?: string | null
  username?: string | null
  token?: string | null
  password?: string | null
  expires?: string | null
  isLoggedIn?: boolean | string | null
  cookieUserId?: string | null
  cookieUserName?: string | null
  cookieToken?: string | null
  cookieExpires?: string | null
}

function pickString(...values: Array<string | null | undefined>): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value
    }
  }

  return undefined
}

function pickBoolean(...values: Array<boolean | string | null | undefined>): boolean | undefined {
  for (const value of values) {
    if (typeof value === 'boolean') {
      return value
    }

    if (value === 'true') {
      return true
    }

    if (value === 'false') {
      return false
    }
  }

  return undefined
}

function normalizeAuthState(rawAuthState: RawAuthState): AuthState {
  let parsedUserInfo: RawAuthState = {}

  if (rawAuthState.nestedUserInfo) {
    try {
      const parsed = JSON.parse(rawAuthState.nestedUserInfo) as unknown

      if (parsed && typeof parsed === 'object') {
        parsedUserInfo = parsed as RawAuthState
      }
    } catch {
      throw new Error('Invalid userInfo payload found in localStorage')
    }
  }

  const userId = pickString(
    parsedUserInfo.userId,
    parsedUserInfo.userID,
    rawAuthState.userId,
    rawAuthState.userID,
    rawAuthState.cookieUserId
  )
  const userName = pickString(
    parsedUserInfo.userName,
    parsedUserInfo.username,
    rawAuthState.userName,
    rawAuthState.username,
    rawAuthState.cookieUserName
  )
  const token = pickString(parsedUserInfo.token, rawAuthState.token, rawAuthState.cookieToken)

  if (!userId || !userName || !token) {
    throw new Error('No authenticated user info found in localStorage or cookies')
  }

  return {
    userId,
    userName,
    token,
    password: pickString(parsedUserInfo.password, rawAuthState.password),
    expires: pickString(parsedUserInfo.expires, rawAuthState.expires, rawAuthState.cookieExpires),
    isLoggedIn: pickBoolean(parsedUserInfo.isLoggedIn, rawAuthState.isLoggedIn) ?? true
  }
}

export class BasePage {
  constructor(private readonly page: Page) {}

  get nativePage(): Page {
    return this.page
  }

  async getAPI(): Promise<APIRequestContext> {
    const authState = await this.readAuthState()

    return request.newContext({
      baseURL: getEnv('API_BASE_URL'),
      extraHTTPHeaders: {
        Authorization: `Bearer ${authState.token}`,
        Accept: 'application/json'
      }
    })
  }

  async getUserId(): Promise<string> {
    const authState = await this.readAuthState()
    return authState.userId
  }

  async getAuthInfo(): Promise<AuthState> {
    return await this.readAuthState()
  }

  async syncAuthState(authState: AuthState): Promise<AuthState> {
    const normalizedAuthState = normalizeAuthState(authState)

    await this.page.evaluate((nextAuthState) => {
      window.localStorage.setItem('userInfo', JSON.stringify(nextAuthState))
      window.localStorage.setItem('token', nextAuthState.token)
      window.localStorage.setItem('userID', nextAuthState.userId)
      window.localStorage.setItem('userName', nextAuthState.userName)

      if (nextAuthState.expires) {
        window.localStorage.setItem('expires', nextAuthState.expires)
      } else {
        window.localStorage.removeItem('expires')
      }
    }, normalizedAuthState)

    return normalizedAuthState
  }

  async getUserData(): Promise<UserData> {
    const authState = await this.readAuthState()

    if (!authState.password) {
      throw new Error('Authenticated password is unavailable. Sync auth state with password first.')
    }

    return {
      userName: authState.userName,
      password: authState.password
    }
  }

  private async readAuthState(): Promise<AuthState> {
    const authSnapshot = await this.page.evaluate(() => {
      // DemoQA stores auth as cookies after UI login, not localStorage
      const parseCookie = (name: string): string | undefined => {
        const match = document.cookie.match(new RegExp(`(?:^|;)\\s*${name}=([^;]*)`))
        return match ? decodeURIComponent(match[1]) : undefined
      }

      return {
        nestedUserInfo: window.localStorage.getItem('userInfo'),
        token: window.localStorage.getItem('token'),
        userId: window.localStorage.getItem('userID'),
        userName: window.localStorage.getItem('userName'),
        expires: window.localStorage.getItem('expires'),
        cookieToken: parseCookie('token'),
        cookieUserId: parseCookie('userID'),
        cookieUserName: parseCookie('userName'),
        cookieExpires: parseCookie('expires')
      }
    })

    return normalizeAuthState(authSnapshot)
  }
}
