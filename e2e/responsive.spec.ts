import { expect, type Page } from '@playwright/test'
import { test } from './fixtures'
import { buyFromDetail, connectWallet, goToCheckout, openReview } from './flows'

const PUBLIC_ROUTES = [
  { path: '/', ready: '#catalogo article' },
  { path: '/nfts/emerald-ape-042', ready: 'text=Mais desta coleção' },
  { path: '/nfts/nao-existe-000', ready: 'text=NFT não encontrado' },
  { path: '/cart', ready: 'text=Seu carrinho está vazio' },
  { path: '/login', ready: 'form[aria-label="Entrar"]' },
  { path: '/register', ready: 'form[aria-label="Criar conta"]' },
  { path: '/rota-inexistente', ready: 'text=Página não encontrada' },
]

const PRIVATE_ROUTES = [
  { path: '/profile', ready: 'text=Perfil do colecionador' },
  { path: '/profile/wallets', ready: 'text=Carteira principal' },
  { path: '/profile/favorites', ready: 'article' },
]

const horizontalOverflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)

test.describe('Responsividade @responsive', () => {
  for (const route of PUBLIC_ROUTES) {
    test(`sem overflow horizontal em ${route.path}`, async ({ page, mocks }) => {
      await mocks.boot('padrao', route.path)
      await page.locator(route.ready).first().waitFor()
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0)
    })
  }

  test('sem overflow horizontal nas telas logadas, carrinho, pagamento e recibo', async ({ page, mocks }) => {
    await mocks.boot()
    await mocks.loginAs('ana')
    for (const route of PRIVATE_ROUTES) {
      await page.goto(route.path)
      await page.locator(route.ready).first().waitFor()
      expect(await horizontalOverflow(page), route.path).toBeLessThanOrEqual(0)
    }
    await buyFromDetail(page)
    expect(await horizontalOverflow(page), '/cart').toBeLessThanOrEqual(0)
    await goToCheckout(page)
    expect(await horizontalOverflow(page), '/checkout').toBeLessThanOrEqual(0)
    await connectWallet(page)
    const review = await openReview(page)
    await review.getByRole('button', { name: 'Confirmar e pagar' }).click()
    await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible({ timeout: 10_000 })
    expect(await horizontalOverflow(page), '/orders').toBeLessThanOrEqual(0)
  })
})
