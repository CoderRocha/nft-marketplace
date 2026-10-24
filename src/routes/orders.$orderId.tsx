import { createFileRoute } from '@tanstack/react-router'
import { requireSession, useSession } from '@core/session'
import { OrderStatusCard } from '@features/orders/order-status-card'
import { ReceiptLayout } from '@layouts/receipt-layout'

const OrderRoute = () => {
  const session = useSession()
  const { orderId } = Route.useParams()
  return <ReceiptLayout>{session && <OrderStatusCard key={orderId} userId={session.user.id} orderId={orderId} />}</ReceiptLayout>
}

export const Route = createFileRoute('/orders/$orderId')({
  beforeLoad: async ({ context, location }) => {
    await requireSession(context.queryClient, location.href)
  },
  head: () => ({ meta: [{ title: 'Pedido - Kurio' }] }),
  component: OrderRoute,
})
