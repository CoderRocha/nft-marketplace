import * as v from 'valibot'
import { ethAmountSchema } from '@contracts/money'
import { EDITION_IDS, NETWORK_IDS, nftImageSchema } from '@contracts/nft'
import { quoteSchema } from '@contracts/quote'
import { isValidAddress, walletFieldsSchema, WALLET_PROVIDER_IDS } from '@contracts/wallet'

export const ORDER_STATUSES = ['pending', 'confirmed', 'declined'] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const IDEMPOTENCY_HEADER = 'Idempotency-Key'

export const COLLECTOR_NOTE_MAX = 500

export const WALLET_SOURCES = ['primary', 'secondary', 'custom'] as const

export type WalletSource = (typeof WALLET_SOURCES)[number]

export const collectorInputSchema = v.pipe(
  v.object({
    ...walletFieldsSchema.entries,
    username: v.pipe(v.string(), v.trim(), v.minLength(3), v.maxLength(24)),
    note: v.pipe(v.string(), v.trim(), v.maxLength(COLLECTOR_NOTE_MAX)),
  }),
  v.forward(
    v.check((input) => isValidAddress(input.network, input.address)),
    ['address'],
  ),
)

export type CollectorInput = v.InferOutput<typeof collectorInputSchema>

export const walletConnectionInputSchema = v.object({
  provider: v.picklist(WALLET_PROVIDER_IDS),
  network: v.picklist(NETWORK_IDS),
  address: v.pipe(v.string(), v.trim(), v.nonEmpty()),
})

export type WalletConnectionInput = v.InferOutput<typeof walletConnectionInputSchema>

export const walletConnectionSchema = v.object({
  id: v.string(),
  provider: v.picklist(WALLET_PROVIDER_IDS),
  network: v.picklist(NETWORK_IDS),
  address: v.string(),
  connectedAt: v.string(),
})

export type WalletConnection = v.InferOutput<typeof walletConnectionSchema>

export const createOrderInputSchema = v.object({
  quoteId: v.string(),
  quoteVersion: v.string(),
  connectionId: v.string(),
  walletSource: v.picklist(WALLET_SOURCES),
  collector: collectorInputSchema,
})

export type CreateOrderInput = v.InferOutput<typeof createOrderInputSchema>

export const orderLineSchema = v.object({
  nftId: v.string(),
  name: v.string(),
  tokenId: v.string(),
  editionId: v.picklist(EDITION_IDS),
  editionLabel: v.string(),
  quantity: v.number(),
  unitPrice: ethAmountSchema,
  lineTotal: ethAmountSchema,
  image: nftImageSchema,
})

export type OrderLine = v.InferOutput<typeof orderLineSchema>

export const orderSchema = v.object({
  id: v.string(),
  status: v.picklist(ORDER_STATUSES),
  version: v.number(),
  createdAt: v.string(),
  updatedAt: v.string(),
  quoteVersion: v.string(),
  lines: v.array(orderLineSchema),
  subtotal: ethAmountSchema,
  discount: ethAmountSchema,
  networkFee: ethAmountSchema,
  total: ethAmountSchema,
  coupon: v.nullable(v.object({ code: v.string(), percent: v.number() })),
  wallet: v.object({
    label: v.string(),
    address: v.string(),
    network: v.picklist(NETWORK_IDS),
    provider: v.picklist(WALLET_PROVIDER_IDS),
  }),
  transaction: v.nullable(v.object({ hash: v.string(), explorerUrl: v.string(), confirmedAt: v.string() })),
  failureReason: v.nullable(v.string()),
})

export type Order = v.InferOutput<typeof orderSchema>

export const orderListSchema = v.array(orderSchema)

export const quoteOutdatedSchema = v.looseObject({
  code: v.literal('quote_outdated'),
  quote: quoteSchema,
})
