import { mockStateSchema, type ScenarioId } from '@contracts/mocks'
import { request } from '@core/http'

export const fetchMockState = (signal?: AbortSignal) => request('GET', '/__mocks/state', { schema: mockStateSchema, signal })

export const applyMockScenario = (scenario: ScenarioId) =>
  request('PUT', '/__mocks/scenario', { schema: mockStateSchema, body: { scenario } })

export const resetMocks = (scenario: ScenarioId) => request('POST', '/__mocks/reset', { schema: mockStateSchema, body: { scenario } })
