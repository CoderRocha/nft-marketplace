import type { QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { onUnauthorized } from '@core/http'
import { sessionQuery } from '@core/queries'
import { endSession } from '@core/session'
import type { createAppRouter } from '@/router'

const isPrivateRoute = (routeId: string) => routeId.includes('/_private') || routeId.startsWith('/orders')

export const handleSessionExpiry = (queryClient: QueryClient, router: ReturnType<typeof createAppRouter>) =>
  onUnauthorized(() => {
    if (queryClient.getQueryData(sessionQuery().queryKey) === null) return
    endSession(queryClient)
    const { location, matches } = router.state
    if (matches.some((match) => isPrivateRoute(match.routeId))) {
      void router.navigate({ to: '/login', search: { redirect: location.href, motivo: 'expirada' } })
      return
    }
    toast.info('Sua sessão expirou. Entre novamente para continuar.')
  })
