import { test as base, type Page } from '@playwright/test'
import type { FailureInput, ScenarioId } from '@contracts/mocks'

type ApiResult = { status: number; body: unknown }

type ApiCall = {
  method: string
  path: string
  body?: unknown
  token?: string
}

export const USERS = {
  ana: { email: 'ana@kurio.dev', password: 'Senha@123', displayName: 'Ana Souza' },
  bruno: { email: 'bruno@kurio.dev', password: 'Senha@123', displayName: 'Bruno Lima' },
} as const

export type DemoUser = keyof typeof USERS

const SESSION_TOKEN_KEY = 'kurio:session-token'

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

const readToken = (page: Page) => page.evaluate((key) => localStorage.getItem(key) ?? undefined, SESSION_TOKEN_KEY)

export type MockControl = {
  boot: (scenario?: ScenarioId, path?: string) => Promise<void>
  api: (call: ApiCall) => Promise<ApiResult>
  reset: (scenario?: ScenarioId) => Promise<void>
  scenario: (scenario: ScenarioId) => Promise<void>
  fail: (failure: Partial<FailureInput> & Pick<FailureInput, 'method' | 'path' | 'kind'>) => Promise<void>
  loginAs: (user: DemoUser, path?: string) => Promise<void>
  expireSession: () => Promise<void>
  token: () => Promise<string | undefined>
  updateNft: (nftId: string, change: { editionId: string; price?: string; available?: number }) => Promise<void>
  dropRealtime: () => Promise<void>
  replayRealtime: () => Promise<void>
}

export const test = base.extend<{ mocks: MockControl }>({
  mocks: async ({ page }, use) => {
    await use({
      boot: async (scenario = 'padrao', path = '/') => {
        await page.goto(`${path}${path.includes('?') ? '&' : '?'}cenario=${scenario}`)
        await page.locator('html[data-mocks="ready"]').waitFor({ state: 'attached' })
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
      loginAs: async (user, path = '/') => {
        const { email, password } = USERS[user]
        const result = await callApi(page, { method: 'POST', path: '/auth/login', body: { email, password } })
        const body = result.body
        if (typeof body !== 'object' || body === null || !('token' in body) || typeof body.token !== 'string') {
          throw new Error(`Login de teste falhou: ${result.status}`)
        }
        await page.evaluate(([key, token]) => {
          localStorage.setItem(key, token)
        }, [SESSION_TOKEN_KEY, body.token] as const)
        await page.goto(path)
        await page.locator('html[data-mocks="ready"]').waitFor({ state: 'attached' })
      },
      expireSession: async () => {
        await callApi(page, { method: 'POST', path: '/__mocks/session/expire', token: await readToken(page) })
      },
      token: () => readToken(page),
      updateNft: async (nftId, change) => {
        await callApi(page, { method: 'POST', path: `/__mocks/nfts/${nftId}/update`, body: change })
      },
      dropRealtime: async () => {
        await callApi(page, { method: 'POST', path: '/__mocks/realtime/drop' })
      },
      replayRealtime: async () => {
        await callApi(page, { method: 'POST', path: '/__mocks/realtime/replay' })
      },
    })
  },
})
