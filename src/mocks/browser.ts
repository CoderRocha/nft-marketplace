import { setupWorker } from 'msw/browser'
import * as v from 'valibot'
import { SCENARIO_IDS } from '@contracts/mocks'
import { handlers } from '@mocks/handlers'
import { applyScenario } from '@mocks/scenarios'

export const worker = setupWorker(...handlers)

export const applyScenarioFromUrl = (search: string) => {
  const requested = v.safeParse(v.picklist(SCENARIO_IDS), new URLSearchParams(search).get('cenario'))
  if (requested.success) applyScenario(requested.output)
}
