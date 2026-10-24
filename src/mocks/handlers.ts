import type { AnyHandler } from 'msw'
import { authHandlers } from '@mocks/handlers/auth'
import { controlHandlers } from '@mocks/handlers/control'
import { newsletterHandlers } from '@mocks/handlers/newsletter'
import { nftHandlers } from '@mocks/handlers/nfts'

export const handlers: AnyHandler[] = [...controlHandlers, ...authHandlers, ...nftHandlers, ...newsletterHandlers]
