import { http, HttpResponse } from 'msw'
import * as v from 'valibot'
import { failureInputSchema, nftUpdateInputSchema, scenarioInputSchema } from '@contracts/mocks'
import { db, mutate, resetDb } from '@mocks/db'
import { bearerToken } from '@mocks/auth'
import { apiUrl, notFoundProblem, readJson, validationProblem } from '@mocks/network'
import { updateNftEdition } from '@mocks/nft-updates'
import { dropConnections, replayRecentEvents } from '@mocks/realtime'
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

  http.post<{ nftId: string }>(apiUrl('/__mocks/nfts/:nftId/update'), async ({ request, params }) => {
    const input = v.safeParse(nftUpdateInputSchema, await readJson(request))
    if (!input.success) return validationProblem({ nft: ['Alteração inválida.'] })
    const { editionId, ...change } = input.output
    const nft = updateNftEdition(params.nftId, editionId, change)
    return nft ? HttpResponse.json({ id: nft.id, version: nft.version }) : notFoundProblem('NFT ou edição inexistente.')
  }),

  http.post(apiUrl('/__mocks/realtime/drop'), () => {
    dropConnections()
    return new HttpResponse(null, { status: 204 })
  }),

  http.post(apiUrl('/__mocks/realtime/replay'), () => HttpResponse.json({ delivered: replayRecentEvents() })),
]
