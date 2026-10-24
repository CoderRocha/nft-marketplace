import { MOCKS_ENABLED } from '@core/constants'

const startMocks = async () => {
  const { worker } = await import('@mocks/browser')
  await worker.start({ onUnhandledFrame: 'bypass', quiet: !import.meta.env.DEV })
}

export const mocksReady: Promise<void> = MOCKS_ENABLED ? startMocks() : Promise.resolve()
