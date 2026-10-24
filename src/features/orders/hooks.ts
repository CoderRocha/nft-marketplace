import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchOrder } from '@core/api/orders'
import { syncSettledOrder } from '@core/order-sync'
import { orderQuery } from '@core/queries'

export const useOrder = (userId: string, orderId: string) => {
  const queryClient = useQueryClient()
  return useQuery({
    ...orderQuery(userId, orderId),
    queryFn: async ({ signal }) => {
      const order = await fetchOrder(orderId, signal)
      syncSettledOrder(queryClient, userId, order)
      return order
    },
  })
}
