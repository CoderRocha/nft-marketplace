import * as v from 'valibot'
import { editionSchema, nftSummarySchema } from '@contracts/nft'
import { orderSchema } from '@contracts/order'

export const REALTIME_EVENTS = ['nft.updated', 'order.updated'] as const

export type RealtimeEventType = (typeof REALTIME_EVENTS)[number]

const envelope = {
  eventId: v.string(),
  version: v.number(),
  userId: v.nullable(v.string()),
  occurredAt: v.string(),
}

export const nftUpdatedEventSchema = v.object({
  ...envelope,
  type: v.literal('nft.updated'),
  resource: v.object({ type: v.literal('nft'), id: v.string() }),
  data: v.object({ nft: nftSummarySchema, editions: v.array(editionSchema) }),
})

export type NftUpdatedEvent = v.InferOutput<typeof nftUpdatedEventSchema>

export const orderUpdatedEventSchema = v.object({
  ...envelope,
  type: v.literal('order.updated'),
  resource: v.object({ type: v.literal('order'), id: v.string() }),
  data: v.object({ order: orderSchema }),
})

export type OrderUpdatedEvent = v.InferOutput<typeof orderUpdatedEventSchema>

export const realtimeEventSchema = v.variant('type', [nftUpdatedEventSchema, orderUpdatedEventSchema])

export type RealtimeEvent = v.InferOutput<typeof realtimeEventSchema>
