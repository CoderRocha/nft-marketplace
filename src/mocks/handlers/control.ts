import { http, HttpResponse } from 'msw'
import * as v from 'valibot'
import { failureInputSchema, scenarioInputSchema } from '@contracts/mocks'
import { db, mutate, resetDb } from '@mocks/db'
import { bearerToken } from '@mocks/auth'
import { apiUrl, readJson, validationProblem } from '@mocks/network'
import { applyScenario } from '@mocks/scenarios'

const resetInputSchema = v.object({ scenario: v.optional(scenarioInputSchema.entries.scenario, 'padrao') })

const stateResponse = () => HttpResponse.json({ scenario: db().scenario })

export const controlHandlers = [
  http.get(apiUrl('/__mocks/state'), stateResponse),

  http.put(apiUrl('/__mocks/scenario'), async ({ request }) => {
    const input = v.safeParse(scenarioInputSchema, await readJson(request))
    if (!input.success) return validationProblem({ scenario: ['Cenário desconhecido.'] })
    applyScenario(input.output.scenario)
    return stateResponse()
  }),

  http.post(apiUrl('/__mocks/reset'), async ({ request }) => {
    const input = v.safeParse(resetInputSchema, (await readJson(request)) ?? {})
    if (!input.success) return validationProblem({ scenario: ['Cenário desconhecido.'] })
    resetDb()
    applyScenario(input.output.scenario)
    return stateResponse()
  }),

  http.post(apiUrl('/__mocks/failures'), async ({ request }) => {
    const input = v.safeParse(failureInputSchema, await readJson(request))
    if (!input.success) return validationProblem({ failure: ['Regra de falha inválida.'] })
    const { times, ...rule } = input.output
    mutate((current) => {
      current.failures.push({ ...rule, remaining: times })
    })
    return new HttpResponse(null, { status: 204 })
  }),

  http.post(apiUrl('/__mocks/session/expire'), ({ request }) => {
    const token = bearerToken(request)
    const expiredAt = new Date(Date.now() - 1000).toISOString()
    mutate((current) => {
      for (const session of current.sessions) if (!token || session.token === token) session.expiresAt = expiredAt
    })
    return new HttpResponse(null, { status: 204 })
  }),
]
