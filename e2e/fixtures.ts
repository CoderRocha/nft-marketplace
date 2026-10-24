import { test as base, type Page } from '@playwright/test'
import type { FailureInput, ScenarioId } from '@contracts/mocks'

type ApiResult = { status: number; body: unknown }

type ApiCall = {
  method: string
  path: string
  body?: unknown
  token?: string
}

const callApi = (page: Page, call: ApiCall) =>
  page.evaluate(async ({ method, path, body, token }): Promise<ApiResult> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers.Authorization = `Bearer ${token}`
    const response = await fetch(`/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const text = await response.text()
    return { status: response.status, body: text ? JSON.parse(text) : null }
  }, call)

export type MockControl = {
  boot: (scenario?: ScenarioId, path?: string) => Promise<void>
  api: (call: ApiCall) => Promise<ApiResult>
  reset: (scenario?: ScenarioId) => Promise<void>
  scenario: (scenario: ScenarioId) => Promise<void>
  fail: (failure: Partial<FailureInput> & Pick<FailureInput, 'method' | 'path' | 'kind'>) => Promise<void>
}

export const test = base.extend<{ mocks: MockControl }>({
  mocks: async ({ page }, use) => {
    await use({
      boot: async (scenario = 'padrao', path = '/') => {
        await page.goto(`${path}${path.includes('?') ? '&' : '?'}cenario=${scenario}`)
        await page.waitForFunction(() => navigator.serviceWorker.controller !== null)
      },
      api: (call) => callApi(page, call),
      reset: async (scenario = 'padrao') => {
        await callApi(page, { method: 'POST', path: '/__mocks/reset', body: { scenario } })
      },
      scenario: async (scenario) => {
        await callApi(page, { method: 'PUT', path: '/__mocks/scenario', body: { scenario } })
      },
      fail: async (failure) => {
        await callApi(page, { method: 'POST', path: '/__mocks/failures', body: failure })
      },
    })
  },
})
