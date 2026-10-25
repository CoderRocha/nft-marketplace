import type { FailureInput, ScenarioId } from '@contracts/mocks'
import type { EditionId } from '@contracts/nft'
import type { Order, WalletConnection } from '@contracts/order'
import type { Wallets } from '@contracts/wallet'
import { seedNfts, type NftRecord } from '@mocks/fixtures/nfts'
import { seedUsers, type UserRecord } from '@mocks/fixtures/users'
import { seedFavorites, seedWallets } from '@mocks/fixtures/wallets'

export type SessionRecord = {
  token: string
  userId: string
  expiresAt: string
}

export type FailureRule = Omit<FailureInput, 'times'> & { remaining: number }

export type CartLineRecord = {
  id: string
  nftId: string
  editionId: EditionId
  quantity: number
  acceptedPrice: string
}

export type CartRecord = {
  id: string
  lines: CartLineRecord[]
  couponCode: string | null
  updatedAt: string
}

export type OrderRecord = Order & {
  userId: string
  idempotencyKey: string
  payloadHash: string
  settleAt: string
}

export type ConnectionRecord = WalletConnection & { userId: string }

export type ScenarioFlags = {
  walletRejections: number
  priceChangePending: boolean
  soldOutPending: boolean
  orderTimeoutPending: boolean
}

export const idleFlags = (): ScenarioFlags => ({
  walletRejections: 0,
  priceChangePending: false,
  soldOutPending: false,
  orderTimeoutPending: false,
})

export type MockDb = {
  scenario: ScenarioId
  callCount: number
  failures: FailureRule[]
  users: UserRecord[]
  sessions: SessionRecord[]
  nfts: NftRecord[]
  favorites: Record<string, string[]>
  wallets: Record<string, Wallets>
  carts: Record<string, CartRecord>
  orders: OrderRecord[]
  connections: ConnectionRecord[]
  flags: ScenarioFlags
}

const STORAGE_KEY = 'kurio-mocks:v5'

const seed = (): MockDb => ({
  scenario: 'padrao',
  callCount: 0,
  failures: [],
  users: seedUsers(),
  sessions: [],
  nfts: seedNfts(),
  favorites: seedFavorites(),
  wallets: seedWallets(),
  carts: {},
  orders: [],
  connections: [],
  flags: idleFlags(),
})

const isMockDb = (value: unknown): value is MockDb =>
  typeof value === 'object' &&
  value !== null &&
  'scenario' in value &&
  'users' in value &&
  Array.isArray(value.users) &&
  'nfts' in value &&
  Array.isArray(value.nfts) &&
  'favorites' in value &&
  'wallets' in value &&
  'carts' in value &&
  'orders' in value &&
  'flags' in value

const load = (): MockDb => {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    return isMockDb(stored) ? stored : seed()
  } catch {
    return seed()
  }
}

let state: MockDb | undefined

export const db = () => (state ??= load())

const persist = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db()))
  } catch {
    return
  }
}

export const mutate = <T>(change: (current: MockDb) => T): T => {
  const result = change(db())
  persist()
  return result
}

export const resetDb = () => {
  state = seed()
  persist()
}
