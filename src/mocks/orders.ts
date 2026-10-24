import * as v from 'valibot'
import { orderSchema, type CreateOrderInput, type Order } from '@contracts/order'
import type { Quote } from '@contracts/quote'
import { multiplyEth } from '@core/money'
import { db, mutate, type ConnectionRecord, type OrderRecord } from '@mocks/db'
import { findEdition, findNftRecord, readCart, userCartKey, writeCart } from '@mocks/cart'
import { updateNftEdition } from '@mocks/nft-updates'
import { publishOrderUpdated } from '@mocks/realtime'

export const SETTLE_DELAY_MS = 2500

const randomHex = (bytes: number) =>
  Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (byte) => byte.toString(16).padStart(2, '0')).join('')

export const toOrder = (record: OrderRecord): Order => v.parse(orderSchema, record)

export const findOrder = (orderId: string) => db().orders.find((order) => order.id === orderId)

export const findOrderByKey = (userId: string, idempotencyKey: string) =>
  db().orders.find((order) => order.userId === userId && order.idempotencyKey === idempotencyKey)

type CreateOrderParams = {
  userId: string
  idempotencyKey: string
  payloadHash: string
  input: CreateOrderInput
  quote: Quote
  connection: ConnectionRecord
}

export const createOrder = ({ userId, idempotencyKey, payloadHash, input, quote, connection }: CreateOrderParams) => {
  const cart = readCart(userCartKey(userId))
  const lines = cart.lines.flatMap((line) => {
    const nft = findNftRecord(line.nftId)
    const edition = nft && findEdition(nft, line.editionId)
    if (!nft || !edition) return []
    return [
      {
        nftId: nft.id,
        name: nft.name,
        tokenId: nft.tokenId,
        editionId: edition.id,
        editionLabel: edition.label,
        quantity: line.quantity,
        unitPrice: edition.price,
        lineTotal: multiplyEth(edition.price, line.quantity),
        image: nft.image,
      },
    ]
  })
  const now = Date.now()
  const order: OrderRecord = {
    id: `ord_${randomHex(6)}`,
    status: 'pending',
    version: 1,
    createdAt: new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString(),
    quoteVersion: quote.version,
    lines,
    subtotal: quote.subtotal,
    discount: quote.discount,
    networkFee: quote.networkFee,
    total: quote.total,
    coupon: quote.coupon,
    wallet: {
      label: input.collector.nickname,
      address: connection.address,
      network: connection.network,
      provider: connection.provider,
    },
    transaction: null,
    failureReason: null,
    userId,
    idempotencyKey,
    payloadHash,
    settleAt: new Date(now + SETTLE_DELAY_MS).toISOString(),
  }
  mutate((current) => {
    current.orders.push(order)
  })
  return order
}

const DECLINED_BY_NETWORK = 'A rede recusou o pagamento. Nenhum valor foi cobrado e seus itens continuam no carrinho.'

const DECLINED_BY_STOCK = 'Uma das edições esgotou antes da confirmação. Nenhum valor foi cobrado e seus itens continuam no carrinho.'

const decline = (order: OrderRecord, reason: string) => {
  mutate(() => {
    order.status = 'declined'
    order.failureReason = reason
    order.version += 1
    order.updatedAt = new Date().toISOString()
  })
  publishOrderUpdated(order)
}

const confirm = (order: OrderRecord) => {
  for (const line of order.lines) {
    const edition = findNftRecord(line.nftId)?.editions.find((candidate) => candidate.id === line.editionId)
    if (edition) updateNftEdition(line.nftId, line.editionId, { available: edition.available - line.quantity })
  }
  writeCart(userCartKey(order.userId), (cart) => {
    cart.lines = cart.lines.flatMap((cartLine) => {
      const purchased = order.lines.find((line) => line.nftId === cartLine.nftId && line.editionId === cartLine.editionId)
      if (!purchased) return [cartLine]
      const remaining = cartLine.quantity - purchased.quantity
      return remaining > 0 ? [{ ...cartLine, quantity: remaining }] : []
    })
    cart.couponCode = null
  })
  const hash = `0x${randomHex(32)}`
  mutate(() => {
    order.status = 'confirmed'
    order.transaction = {
      hash,
      explorerUrl: `https://sepolia.etherscan.io/tx/${hash}`,
      confirmedAt: new Date().toISOString(),
    }
    order.version += 1
    order.updatedAt = new Date().toISOString()
  })
  publishOrderUpdated(order)
}

export const settleOrder = (order: OrderRecord) => {
  if (order.status !== 'pending' || Date.parse(order.settleAt) > Date.now()) return order
  if (db().scenario === 'pagamento-recusado') {
    decline(order, DECLINED_BY_NETWORK)
    return order
  }
  const inStock = order.lines.every((line) => {
    const edition = findNftRecord(line.nftId)?.editions.find((candidate) => candidate.id === line.editionId)
    return edition !== undefined && edition.available >= line.quantity
  })
  if (inStock) confirm(order)
  else decline(order, DECLINED_BY_STOCK)
  return order
}

export const scheduleSettlement = (orderId: string) => {
  setTimeout(() => {
    const order = findOrder(orderId)
    if (order) settleOrder(order)
  }, SETTLE_DELAY_MS)
}
