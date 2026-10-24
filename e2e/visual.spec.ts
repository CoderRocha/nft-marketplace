import { expect, type Page } from '@playwright/test'
import { test } from './fixtures'
import { buyFromDetail, goToCheckout } from './flows'

const settle = async (page: Page) => {
  await page.evaluate(() => document.fonts.ready.then(() => undefined))
  await page.waitForFunction(() =>
    Array.from(document.images)
      .filter((image) => {
        const box = image.getBoundingClientRect()
        return image.checkVisibility() && box.bottom > 0 && box.top < window.innerHeight
      })
      .every((image) => image.complete && image.naturalWidth > 0),
  )
  await page.waitForTimeout(300)
}

test.describe('Regressão visual @visual', () => {
  test('início', async ({ page, mocks }) => {
    await mocks.boot()
    await page.locator('#catalogo article').first().waitFor()
    await settle(page)
    await expect(page).toHaveScreenshot('inicio.png')
  })

  test('detalhe do NFT', async ({ page, mocks }) => {
    await mocks.boot('padrao', '/nfts/emerald-ape-042')
    await page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' }).waitFor()
    await settle(page)
    await expect(page).toHaveScreenshot('detalhe.png')
  })

  test('carrinho', async ({ page, mocks }) => {
    await mocks.boot()
    await buyFromDetail(page)
    await buyFromDetail(page, '/nfts/violet-nomad-314')
    await expect(page.getByRole('link', { name: 'Conectar e finalizar' })).toHaveAttribute('aria-disabled', 'false')
    await settle(page)
    await expect(page).toHaveScreenshot('carrinho.png')
  })

  test('pagamento', async ({ page, mocks }) => {
    await mocks.boot()
    await mocks.loginAs('ana')
    await buyFromDetail(page)
    await goToCheckout(page)
    await page.getByText('Total').last().waitFor()
    await settle(page)
    await expect(page).toHaveScreenshot('pagamento.png')
  })
})
