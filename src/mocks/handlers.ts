import type { AnyHandler } from 'msw'
import { newsletterHandlers } from '@mocks/handlers/newsletter'

export const handlers: AnyHandler[] = [...newsletterHandlers]
