import { createFileRoute, redirect, stripSearchParams } from '@tanstack/react-router'
import { readAttempt } from '@core/checkout-attempt'
import { orderQuery, sessionQuery } from '@core/queries'
import { useSession } from '@core/session'
import { CheckoutPage } from '@features/checkout/checkout-page'
import { checkoutSearchSchema } from '@features/checkout/schemas'

const CheckoutRoute = () => {
  const session = useSession()
  const { etapa } = Route.useSearch()
  const navigate = Route.useNavigate()
  return (
    session && (
      <CheckoutPage
        key={session.user.id}
        userId={session.user.id}
        step={etapa}
        onStepChange={(step) => {
          void navigate({ search: { etapa: step } })
        }}
      />
    )
  )
}

export const Route = createFileRoute('/_shop/_private/checkout')({
  validateSearch: checkoutSearchSchema,
  search: { middlewares: [stripSearchParams({ etapa: 'dados' })] },
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.query(sessionQuery())
    const orderId = session && readAttempt(session.user.id)?.orderId
    if (!session || !orderId) return
    const order = await context.queryClient.query(orderQuery(session.user.id, orderId)).catch(() => null)
    if (order?.status === 'pending') throw redirect({ to: '/orders/$orderId', params: { orderId } })
  },
  head: () => ({ meta: [{ title: 'Pagamento - Kurio' }] }),
  component: CheckoutRoute,
})
