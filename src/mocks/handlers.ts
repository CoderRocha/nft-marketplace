import type { AnyHandler } from 'msw'
import { authHandlers } from '@mocks/handlers/auth'
import { cartHandlers } from '@mocks/handlers/cart'
import { controlHandlers } from '@mocks/handlers/control'
import { favoriteHandlers } from '@mocks/handlers/favorites'
import { newsletterHandlers } from '@mocks/handlers/newsletter'
import { nftHandlers } from '@mocks/handlers/nfts'
import { orderHandlers } from '@mocks/handlers/orders'
import { profileHandlers } from '@mocks/handlers/profile'
import { walletHandlers } from '@mocks/handlers/wallets'

export const handlers: AnyHandler[] = [
  ...controlHandlers,
  ...authHandlers,
  ...nftHandlers,
  ...favoriteHandlers,
  ...cartHandlers,
  ...orderHandlers,
  ...profileHandlers,
  ...walletHandlers,
  ...newsletterHandlers,
]
