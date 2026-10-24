import * as v from 'valibot'
import {
  IDEMPOTENCY_HEADER,
  orderListSchema,
  orderSchema,
  walletConnectionSchema,
  type CreateOrderInput,
  type OrderStatus,
  type WalletConnectionInput,
} from '@contracts/order'
import { request } from '@core/http'

export const createOrder = (body: CreateOrderInput, idempotencyKey: string) =>
  request('POST', '/orders', { schema: orderSchema, body, headers: { [IDEMPOTENCY_HEADER]: idempotencyKey } })

export const fetchOrder = (orderId: string, signal?: AbortSignal) =>
  request('GET', `/orders/${encodeURIComponent(orderId)}`, { schema: orderSchema, signal })

export const fetchOrders = (status: OrderStatus, signal?: AbortSignal) =>
  request('GET', '/orders', { schema: orderListSchema, params: { status }, signal })

export const connectWallet = (body: WalletConnectionInput) =>
  request('POST', '/wallet-connections', { schema: walletConnectionSchema, body })

export const disconnectWallet = (connectionId: string) =>
  request('DELETE', `/wallet-connections/${encodeURIComponent(connectionId)}`, { schema: v.unknown() })
