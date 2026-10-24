import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchOrder } from '@core/api/orders'
import { readAttempt, saveAttempt, saveDraft } from '@core/checkout-attempt'
import { keys } from '@core/keys'
import { orderQuery } from '@core/queries'

export const useOrder = (userId: string, orderId: string) => {
  const queryClient = useQueryClient()
  return useQuery({
    ...orderQuery(userId, orderId),
    queryFn: async ({ signal }) => {
      const order = await fetchOrder(orderId, signal)
      if (order.status !== 'pending') {
        if (readAttempt(userId)?.orderId === order.id) saveAttempt(userId, null)
        if (order.status === 'confirmed') saveDraft(userId, null)
        void queryClient.invalidateQueries({ queryKey: keys.cart._def })
        void queryClient.invalidateQueries({ queryKey: keys.quote._def })
        void queryClient.invalidateQueries({ queryKey: keys.nfts._def })
      }
      return order
    },
  })
}
