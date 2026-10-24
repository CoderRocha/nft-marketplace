import { queryOptions } from '@tanstack/react-query'
import { fetchMockState } from '@core/api/mocks'
import { keys } from '@core/keys'

export const mockStateQuery = () =>
  queryOptions({
    queryKey: keys.mocks.state.queryKey,
    queryFn: ({ signal }) => fetchMockState(signal),
    staleTime: 0,
  })
