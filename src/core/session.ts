import { useQuery, type QueryClient } from '@tanstack/react-query'
import { redirect } from '@tanstack/react-router'
import type { AuthResult, Session } from '@contracts/auth'
import { setGuestCartId, setSessionToken } from '@core/credentials'
import { keys } from '@core/keys'
import { sessionQuery } from '@core/queries'

const PRIVATE_KEYS = [keys.me._def, keys.cart._def, keys.quote._def]

const clearPrivateData = (queryClient: QueryClient) => {
  for (const queryKey of PRIVATE_KEYS) {
    void queryClient.cancelQueries({ queryKey })
    queryClient.removeQueries({ queryKey })
  }
}

export const startSession = (queryClient: QueryClient, result: AuthResult) => {
  clearPrivateData(queryClient)
  setSessionToken(result.token)
  setGuestCartId(null)
  const session: Session = { user: result.user, expiresAt: result.expiresAt }
  queryClient.setQueryData(sessionQuery().queryKey, session)
}

export const endSession = (queryClient: QueryClient) => {
  setSessionToken(null)
  clearPrivateData(queryClient)
  queryClient.setQueryData(sessionQuery().queryKey, null)
}

export const updateSessionUser = (queryClient: QueryClient, user: Partial<Session['user']>) => {
  queryClient.setQueryData(sessionQuery().queryKey, (current) =>
    current ? { ...current, user: { ...current.user, ...user } } : current,
  )
}

export const requireSession = async (queryClient: QueryClient, href: string) => {
  const session = await queryClient.query(sessionQuery())
  if (!session) throw redirect({ to: '/login', search: { redirect: href } })
  return session
}

export const useSession = () => useQuery(sessionQuery()).data ?? null

export const useCartOwner = () => {
  const session = useSession()
  return session ? `user:${session.user.id}` : 'guest'
}
