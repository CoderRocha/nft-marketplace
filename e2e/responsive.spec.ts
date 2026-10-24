import { expect } from '@playwright/test'
import { test } from './fixtures'

const ROUTES = [
  { path: '/', ready: '#catalogo article' },
  { path: '/nfts/emerald-ape-042', ready: 'text=Mais desta coleção' },
  { path: '/nfts/nao-existe-000', ready: 'text=NFT não encontrado' },
]

test.describe('Responsividade @responsive', () => {
  for (const route of ROUTES) {
    test(`sem overflow horizontal em ${route.path}`, async ({ page, mocks }) => {
      await mocks.boot('padrao', route.path)
      await page.locator(route.ready).first().waitFor()
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      expect(overflow).toBeLessThanOrEqual(0)
    })
  }
})
