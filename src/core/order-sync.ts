import type { QueryClient } from '@tanstack/react-query'
import type { Order } from '@contracts/order'
import { readAttempt, saveAttempt, saveDraft } from '@core/checkout-attempt'
import { keys } from '@core/keys'

export const syncSettledOrder = (queryClient: QueryClient, userId: string, order: Order) => {
  if (order.status === 'pending') return
  if (readAttempt(userId)?.orderId === order.id) saveAttempt(userId, null)
  if (order.status === 'confirmed') saveDraft(userId, null)
  void queryClient.invalidateQueries({ queryKey: keys.cart._def })
  void queryClient.invalidateQueries({ queryKey: keys.quote._def })
  void queryClient.invalidateQueries({ queryKey: keys.nfts._def })
}
