import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws } from 'msw'
import * as v from 'valibot'
import type { NftUpdatedEvent, OrderUpdatedEvent, RealtimeEvent } from '@contracts/events'
import { editionSchema, nftSummarySchema } from '@contracts/nft'
import { orderSchema } from '@contracts/order'
import { WS_URL } from '@core/constants'
import { db, type OrderRecord } from '@mocks/db'
import type { NftRecord } from '@mocks/fixtures/nfts'

const ENGINE_IO_PING = '2'

const HEARTBEAT_MS = 10_000

const EVENT_LOG_SIZE = 20

type SocketIoConnection = ReturnType<typeof toSocketIo>

type ClientConnection = {
  io: SocketIoConnection
  userId: string | null
  close: () => void
}

const connections = new Set<ClientConnection>()

const eventLog: RealtimeEvent[] = []

const userIdForToken = (token: string | null) => {
  if (!token) return null
  const session = db().sessions.find((candidate) => candidate.token === token)
  return session && Date.parse(session.expiresAt) > Date.now() ? session.userId : null
}

const socketLink = ws.link(WS_URL.replace(/^http/, 'ws'))

export const realtimeHandler = socketLink.addEventListener('connection', (connection) => {
  const io = toSocketIo(connection)
  const token = new URL(connection.client.url).searchParams.get('token')
  const client: ClientConnection = {
    io,
    userId: userIdForToken(token),
    close: () => {
      connection.client.close()
    },
  }
  connections.add(client)
  const heartbeat = setInterval(() => {
    connection.client.send(ENGINE_IO_PING)
  }, HEARTBEAT_MS)
  connection.client.addEventListener('close', () => {
    clearInterval(heartbeat)
    connections.delete(client)
  })
})

const deliver = (event: RealtimeEvent) => {
  for (const client of connections) {
    if (event.userId === null || event.userId === client.userId) client.io.client.emit(event.type, event)
  }
}

const publish = (event: RealtimeEvent) => {
  eventLog.push(event)
  if (eventLog.length > EVENT_LOG_SIZE) eventLog.shift()
  deliver(event)
}

export const publishNftUpdated = (nft: NftRecord) => {
  const event: NftUpdatedEvent = {
    eventId: `evt_${crypto.randomUUID()}`,
    type: 'nft.updated',
    resource: { type: 'nft', id: nft.id },
    version: nft.version,
    userId: null,
    occurredAt: new Date().toISOString(),
    data: { nft: v.parse(nftSummarySchema, nft), editions: nft.editions.map((edition) => v.parse(editionSchema, edition)) },
  }
  publish(event)
}

export const publishOrderUpdated = (order: OrderRecord) => {
  const event: OrderUpdatedEvent = {
    eventId: `evt_${crypto.randomUUID()}`,
    type: 'order.updated',
    resource: { type: 'order', id: order.id },
    version: order.version,
    userId: order.userId,
    occurredAt: new Date().toISOString(),
    data: { order: v.parse(orderSchema, order) },
  }
  publish(event)
}

export const dropConnections = () => {
  for (const client of [...connections]) client.close()
}

const staleCopy = (event: RealtimeEvent): RealtimeEvent | null => {
  if (event.type !== 'nft.updated' || event.version <= 1) return null
  const previous = eventLog.find((candidate) => candidate.type === 'nft.updated' && candidate.resource.id === event.resource.id && candidate.version < event.version)
  return previous ? { ...previous, eventId: `evt_${crypto.randomUUID()}` } : null
}

export const replayRecentEvents = () => {
  const latest = eventLog.at(-1)
  if (!latest) return 0
  const stale = staleCopy(latest)
  deliver(latest)
  deliver(latest)
  if (stale) deliver(stale)
  return stale ? 3 : 2
}
