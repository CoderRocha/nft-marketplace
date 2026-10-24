import { MOCKS_ENABLED } from '@core/constants'

const startMocks = async () => {
  const { worker, applyScenarioFromUrl } = await import('@mocks/browser')
  applyScenarioFromUrl(window.location.search)
  await worker.start({ onUnhandledFrame: 'bypass', quiet: !import.meta.env.DEV })
  document.documentElement.dataset.mocks = 'ready'
}

export const mocksReady: Promise<void> = MOCKS_ENABLED ? startMocks() : Promise.resolve()
