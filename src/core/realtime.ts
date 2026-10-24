import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import type { Socket } from 'socket.io-client'
import { toast } from 'sonner'
import * as v from 'valibot'
import type { Cart } from '@contracts/cart'
import { REALTIME_EVENTS, realtimeEventSchema, type NftUpdatedEvent, type OrderUpdatedEvent } from '@contracts/events'
import type { Favorites } from '@contracts/favorites'
import type { NftPage } from '@contracts/nft'
import { WS_URL } from '@core/constants'
import { getSessionToken } from '@core/credentials'
import { createEventGate } from '@core/event-gate'
import { keys } from '@core/keys'
import { mocksReady } from '@core/mocks-ready'
import { compareEth, formatEthLabel } from '@core/money'
import { syncSettledOrder } from '@core/order-sync'
import { nftDetailQuery, orderQuery } from '@core/queries'

const RECONNECT_DELAY_MS = 500

const CART_NOTICE_DURATION_MS = 10_000

const RECONNECT_DELAY_MAX_MS = 3000

const cartNotice = (queryClient: QueryClient, event: NftUpdatedEvent) => {
  const lines = queryClient
    .getQueriesData<Cart>({ queryKey: keys.cart._def })
    .flatMap(([, cart]) => cart?.lines ?? [])
    .filter((line) => line.nftId === event.resource.id)
  if (lines.length === 0) return
  void queryClient.invalidateQueries({ queryKey: keys.cart._def })
  void queryClient.invalidateQueries({ queryKey: keys.quote._def })
  const changes = lines.flatMap((line) => {
    const edition = event.data.editions.find((candidate) => candidate.id === line.editionId)
    if (!edition) return []
    if (edition.available < line.quantity) return [`a edição ${edition.label} de ${line.nft.name} ficou com ${edition.available} unidades`]
    if (compareEth(edition.price, line.acceptedPrice) !== 0) {
      return [`o preço de ${line.nft.name} mudou de ${formatEthLabel(line.acceptedPrice)} para ${formatEthLabel(edition.price)}`]
    }
    return []
  })
  const [first] = changes
  if (first) {
    toast.warning(`Atualização no seu carrinho: ${first}. Revise antes de finalizar.`, { id: `nft-${event.resource.id}-${event.version}`, duration: CART_NOTICE_DURATION_MS })
  }
}

const applyNftUpdate = (queryClient: QueryClient, event: NftUpdatedEvent) => {
  const { nft, editions } = event.data
  const isNewer = (version: number) => version < event.version
  queryClient.setQueryData(nftDetailQuery(nft.id).queryKey, (current) =>
    current && isNewer(current.version) ? { ...current, ...nft, editions } : current,
  )
  queryClient.setQueriesData<NftPage>({ queryKey: keys.nfts.list._def }, (page) =>
    page && { ...page, items: page.items.map((item) => (item.id === nft.id && isNewer(item.version) ? nft : item)) },
  )
  queryClient.setQueriesData<Favorites>({ queryKey: keys.me.favorites._def }, (favorites) =>
    favorites && { items: favorites.items.map((item) => (item.id === nft.id && isNewer(item.version) ? nft : item)) },
  )
  void queryClient.invalidateQueries({ queryKey: keys.nfts.highlights.queryKey })
  void queryClient.invalidateQueries({ queryKey: keys.nfts.related._def })
  cartNotice(queryClient, event)
}

const applyOrderUpdate = (queryClient: QueryClient, userId: string, event: OrderUpdatedEvent) => {
  const { queryKey } = orderQuery(userId, event.resource.id)
  const current = queryClient.getQueryData(queryKey)
  if (current && (current.status !== 'pending' || current.version >= event.version)) return
  queryClient.setQueryData(queryKey, event.data.order)
  syncSettledOrder(queryClient, userId, event.data.order)
}

const reconcile = (queryClient: QueryClient) => {
  for (const queryKey of [keys.nfts._def, keys.cart._def, keys.quote._def, keys.me.order._def]) {
    void queryClient.invalidateQueries({ queryKey, refetchType: 'active' })
  }
}

export const useRealtime = (userId: string | null) => {
  const queryClient = useQueryClient()
  useEffect(() => {
    let socket: Socket | undefined
    let cancelled = false
    let connectedBefore = false
    const accept = createEventGate()
    const token = getSessionToken()

    const onEvent = (payload: unknown) => {
      const parsed = v.safeParse(realtimeEventSchema, payload)
      if (!parsed.success) return
      const event = parsed.output
      if (event.userId !== null && event.userId !== userId) return
      if (!accept(event)) return
      if (event.type === 'nft.updated') applyNftUpdate(queryClient, event)
      else if (userId) applyOrderUpdate(queryClient, userId, event)
    }

    void mocksReady
      .then(() => import('socket.io-client'))
      .then(({ io }) => {
        if (cancelled) return
        socket = io(WS_URL, {
          transports: ['websocket'],
          query: token && userId ? { token } : {},
          reconnectionDelay: RECONNECT_DELAY_MS,
          reconnectionDelayMax: RECONNECT_DELAY_MAX_MS,
        })
        socket.on('connect', () => {
          document.documentElement.dataset.realtime = 'connected'
          if (connectedBefore) {
            reconcile(queryClient)
            toast.success('Conexão em tempo real restabelecida.', { id: 'realtime-status' })
          }
          connectedBefore = true
        })
        socket.on('disconnect', (reason) => {
          document.documentElement.dataset.realtime = 'disconnected'
          if (reason !== 'io client disconnect') {
            toast.info('Conexão em tempo real perdida. Tentando reconectar...', { id: 'realtime-status' })
          }
        })
        for (const type of REALTIME_EVENTS) socket.on(type, onEvent)
      })

    return () => {
      cancelled = true
      socket?.removeAllListeners()
      socket?.disconnect()
    }
  }, [queryClient, userId])
}
