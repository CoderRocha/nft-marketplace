import { createQueryKeys, mergeQueryKeys } from '@lukemorales/query-key-factory'
import type { NftListParams } from '@contracts/nft'

const mocks = createQueryKeys('mocks', {
  state: null,
})

const nfts = createQueryKeys('nfts', {
  list: (params: NftListParams) => [params],
  highlights: null,
  detail: (id: string) => [id],
  related: (id: string) => [id],
})

const session = createQueryKeys('session', {
  current: null,
})

const me = createQueryKeys('me', {
  profile: (userId: string) => [userId],
  favorites: (userId: string) => [userId],
  wallets: (userId: string) => [userId],
  order: (userId: string, orderId: string) => [userId, orderId],
})

const cart = createQueryKeys('cart', {
  current: (owner: string) => [owner],
})

const quote = createQueryKeys('quote', {
  current: (owner: string, cartUpdatedAt: string) => [owner, cartUpdatedAt],
})

export const keys = mergeQueryKeys(mocks, nfts, session, me, cart, quote)
