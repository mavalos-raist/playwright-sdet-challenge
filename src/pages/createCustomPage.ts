import { Page } from '@playwright/test'
import { BasePage } from '@/pages/basePage'

export type CustomPage = BasePage & Page

export function createCustomPage(page: Page): CustomPage {
  const basePage = new BasePage(page)

  return new Proxy(basePage, {
    get(target, prop, receiver) {
      if (prop in target) {
        return Reflect.get(target, prop, receiver)
      }

      const value = page[prop as keyof Page]

      if (typeof value === 'function') {
        return value.bind(page)
      }

      return value
    }
  }) as CustomPage
}