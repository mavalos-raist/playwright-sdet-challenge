import { APIRequestContext, Page, request } from '@playwright/test'
import { StoredUserInfo, UserData } from '@/types/user'
import { getEnv } from '@/utils/env'

export class BasePage {
  constructor(private readonly page: Page) {}

  get nativePage(): Page {
    return this.page
  }

  async getAPI(): Promise<APIRequestContext> {
    const userInfo = await this.readUserInfo()

    return request.newContext({
      baseURL: getEnv('API_BASE_URL'),
      extraHTTPHeaders: {
        Authorization: `Bearer ${userInfo.token}`,
        Accept: 'application/json'
      }
    })
  }

  async getUserId(): Promise<string> {
    const userInfo = await this.readUserInfo()
    return userInfo.userId
  }

  async getAuthInfo(): Promise<StoredUserInfo> {
    return await this.readUserInfo()
  }

  async getUserData(): Promise<UserData> {
    const userInfo = await this.readUserInfo()

    return {
      userName: userInfo.username,
      password: getEnv('TEST_PASSWORD')
    }
  }

  private async readUserInfo(): Promise<StoredUserInfo> {
    const storedUserInfo = await this.page.evaluate(() => {
      const nestedUserInfo = window.localStorage.getItem('userInfo')

      if (nestedUserInfo) {
        return JSON.parse(nestedUserInfo)
      }

      const lsToken = window.localStorage.getItem('token')
      const lsUserId = window.localStorage.getItem('userID')
      const lsUsername = window.localStorage.getItem('userName')
      const lsExpires = window.localStorage.getItem('expires')

      if (lsToken && lsUserId && lsUsername) {
        return { token: lsToken, userId: lsUserId, username: lsUsername, expires: lsExpires }
      }

      // DemoQA stores auth as cookies after UI login, not localStorage
      const parseCookie = (name: string): string | undefined => {
        const match = document.cookie.match(new RegExp(`(?:^|;)\\s*${name}=([^;]*)`))
        return match ? decodeURIComponent(match[1]) : undefined
      }

      const token = parseCookie('token')
      const userId = parseCookie('userID')
      const username = parseCookie('userName')
      const expires = parseCookie('expires')

      if (!token || !userId || !username) {
        return null
      }

      return { token, userId, username, expires }
    })

    if (!storedUserInfo) {
      throw new Error('No authenticated user info found in localStorage or cookies')
    }

    return storedUserInfo as StoredUserInfo
  }
}
