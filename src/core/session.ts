import { useQuery, type QueryClient } from '@tanstack/react-query'
import { redirect } from '@tanstack/react-router'
import type { AuthResult, Session } from '@contracts/auth'
import { setSessionToken } from '@core/credentials'
import { keys } from '@core/keys'
import { sessionQuery } from '@core/queries'

const clearPrivateData = (queryClient: QueryClient) => {
  void queryClient.cancelQueries({ queryKey: keys.me._def })
  queryClient.removeQueries({ queryKey: keys.me._def })
}

export const startSession = (queryClient: QueryClient, result: AuthResult) => {
  clearPrivateData(queryClient)
  setSessionToken(result.token)
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
