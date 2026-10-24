import type { ScenarioId } from '@contracts/mocks'
import { mutate, type FailureRule } from '@mocks/db'
import { createRandom } from '@mocks/random'

const FAILURES_BEFORE_RECOVERY = 3

const CATALOG_READS = ['/nfts', '/nfts/highlights', '/nfts/:id', '/nfts/:id/related']

const FAILURE_KIND: Partial<Record<ScenarioId, FailureRule['kind']>> = {
  offline: 'offline',
  'erro-500': 500,
  'erro-503': 503,
}

const scenarioFailures = (scenario: ScenarioId): FailureRule[] => {
  const kind = FAILURE_KIND[scenario]
  if (kind === undefined) return []
  return CATALOG_READS.map((path) => ({ method: 'get', path, kind, remaining: FAILURES_BEFORE_RECOVERY }))
}

const outOfOrderLatency = (url: URL) => Math.max(200, 2400 - (url.searchParams.get('q') ?? '').length * 400)

export const latencyFor = (scenario: ScenarioId, method: string, path: string, url: URL, call: number) => {
  if (scenario === 'lento') return 2500
  if (scenario === 'latencia-variavel') return 200 + Math.floor(createRandom(9000 + call)() * 2000)
  if (scenario === 'fora-de-ordem' && method === 'get' && path === '/nfts') return outOfOrderLatency(url)
  return 150
}

const SHORT_SESSION_MS = 45_000

const DEFAULT_SESSION_MS = 2 * 60 * 60 * 1000

export const sessionDurationMs = (scenario: ScenarioId) =>
  scenario === 'sessao-expirada' ? SHORT_SESSION_MS : DEFAULT_SESSION_MS

export const applyScenario = (scenario: ScenarioId) => {
  mutate((current) => {
    current.scenario = scenario
    current.callCount = 0
    current.failures = scenarioFailures(scenario)
  })
}
