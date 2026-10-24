import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { sessionQuery } from '@core/queries'
import { AuthScreen } from '@features/auth/auth-screen'
import { authSearchSchema } from '@features/auth/schemas'

const LoginRoute = () => {
  const search = Route.useSearch()
  const navigate = useNavigate()
  return (
    <AuthScreen
      mode="login"
      search={search}
      onAuthenticated={() => void navigate({ href: search.redirect ?? '/', replace: true })}
      onClose={() => void navigate({ to: '/' })}
    />
  )
}

export const Route = createFileRoute('/_shop/login')({
  validateSearch: authSearchSchema,
  beforeLoad: async ({ context, search }) => {
    if (await context.queryClient.query(sessionQuery())) throw redirect({ href: search.redirect ?? '/' })
  },
  head: () => ({ meta: [{ title: 'Entrar - Kurio' }] }),
  component: LoginRoute,
})
