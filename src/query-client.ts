import { QueryClient } from '@tanstack/react-query'
import { isFriendlyError } from '@core/http'

const MAX_RETRIES = 2

const isRetryable = (error: unknown) =>
  isFriendlyError(error) && (error.status === 0 || error.status >= 500) && error.code !== 'invalid_response'

const retryDelay = (attempt: number, error: unknown) =>
  (isFriendlyError(error) ? error.retryAfterMs : undefined) ?? Math.min(1000 * 2 ** attempt, 8000)

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (failureCount, error) => failureCount < MAX_RETRIES && isRetryable(error),
        retryDelay,
      },
      mutations: { retry: false },
    },
  })
