import type { QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import { PendingFallback } from '@pattern/widget-boundary'
import { routeTree } from '@/routeTree.gen'

const parseSearch = (searchText: string) => {
  const params = new URLSearchParams(searchText)
  const search: Record<string, string | string[]> = {}
  for (const key of new Set(params.keys())) {
    const values = params.getAll(key)
    search[key] = values.length > 1 ? values : (values[0] ?? '')
  }
  return search
}

const stringifySearch = (search: Record<string, unknown>) => {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(search)) {
    if (value === undefined || value === null) continue
    for (const item of Array.isArray(value) ? value : [value]) params.append(key, String(item))
  }
  const text = params.toString()
  return text ? `?${text}` : ''
}

export const createAppRouter = (queryClient: QueryClient) =>
  createRouter({
    routeTree,
    context: { queryClient },
    parseSearch,
    stringifySearch,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    defaultPendingComponent: PendingFallback,
    scrollRestoration: true,
  })

declare module '@tanstack/react-router' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- module augmentation needs interface merging
  interface Register {
    router: ReturnType<typeof createAppRouter>
  }
}
