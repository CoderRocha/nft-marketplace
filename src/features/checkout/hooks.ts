import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import type { CollectorInput, CreateOrderInput, WalletConnection, WalletSource } from '@contracts/order'
import type { Quote } from '@contracts/quote'
import { connectWallet, createOrder, disconnectWallet } from '@core/api/orders'
import { attemptFor, saveAttempt } from '@core/checkout-attempt'
import { isFriendlyError } from '@core/http'
import { orderQuery } from '@core/queries'

const MAX_ORDER_ATTEMPTS = 3

export type CheckoutReview = {
  quote: Quote
  previousQuote: Quote | null
  collector: CollectorInput
  walletSource: WalletSource
  connection: WalletConnection
}

const isRecoverable = (error: unknown) =>
  isFriendlyError(error) && (error.code === 'timeout' || error.code === 'network_error' || error.status >= 500)

export const useWalletConnection = () => {
  const [connection, setConnection] = useState<WalletConnection | null>(null)
  const connect = useMutation({ mutationFn: connectWallet, onSuccess: setConnection })
  const disconnect = useMutation({
    mutationFn: disconnectWallet,
    onSettled: () => {
      setConnection(null)
    },
  })
  return { connection, connect, disconnect }
}

export const usePlaceOrder = (userId: string) => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [verifying, setVerifying] = useState(false)
  const placeOrder = useMutation({
    mutationFn: async (review: CheckoutReview) => {
      const payload: CreateOrderInput = {
        quoteId: review.quote.id,
        quoteVersion: review.quote.version,
        connectionId: review.connection.id,
        walletSource: review.walletSource,
        collector: review.collector,
      }
      const attempt = attemptFor(userId, payload)
      for (let attemptNumber = 1; ; attemptNumber += 1) {
        try {
          return { order: await createOrder(payload, attempt.key), attempt }
        } catch (error) {
          if (attemptNumber >= MAX_ORDER_ATTEMPTS || !isRecoverable(error)) throw error
          setVerifying(true)
        }
      }
    },
    onSettled: () => {
      setVerifying(false)
    },
    onSuccess: ({ order, attempt }) => {
      saveAttempt(userId, { ...attempt, orderId: order.id })
      queryClient.setQueryData(orderQuery(userId, order.id).queryKey, order)
      void navigate({ to: '/orders/$orderId', params: { orderId: order.id } })
    },
  })
  return { placeOrder, verifying }
}
