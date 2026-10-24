import type { QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import { PendingFallback } from '@pattern/widget-boundary'
import { routeTree } from '@/routeTree.gen'

export const createAppRouter = (queryClient: QueryClient) =>
  createRouter({
    routeTree,
    context: { queryClient },
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
