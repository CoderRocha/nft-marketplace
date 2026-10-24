import { expect, test } from '@playwright/test'
import { createEventGate } from '@core/event-gate'

const event = (eventId: string, version: number, id = 'emerald-ape-042') => ({ eventId, version, resource: { type: 'nft', id } })

test('aplica eventos novos e descarta duplicados e versões antigas', () => {
  const accept = createEventGate()
  expect(accept(event('a', 2))).toBe(true)
  expect(accept(event('a', 2))).toBe(false)
  expect(accept(event('b', 1))).toBe(false)
  expect(accept(event('c', 2))).toBe(false)
  expect(accept(event('d', 3))).toBe(true)
  expect(accept(event('e', 1, 'outro-nft'))).toBe(true)
})
