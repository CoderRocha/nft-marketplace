import { expect } from '@playwright/test'
import { test } from './fixtures'
import { buyFromDetail, connectWallet, goToCheckout, isMobile, openReview } from './flows'

test.describe('Compra completa @main', () => {
  test('do catálogo ao recibo confirmado, com recibo fixo após mudanças no catálogo', async ({ page, mocks }) => {
    await mocks.boot()
    await mocks.loginAs('ana')
    await page.locator('#catalogo').getByRole('link', { name: 'Emerald Ape #042', exact: true }).click()
    await expect(page).toHaveURL(/\/nfts\/emerald-ape-042/)
    await buyFromDetail(page)
    await expect(page.getByRole('link', { name: 'Emerald Ape #042' })).toBeVisible()

    await goToCheckout(page)
    await connectWallet(page)
    const review = await openReview(page)
    await expect(review.getByText('1.206 ETH')).toBeVisible()
    await review.getByRole('button', { name: 'Confirmar e pagar' }).click()

    await expect(page).toHaveURL(/\/orders\/ord_/)
    await expect(page.getByRole('heading', { name: 'Aguardando confirmação na rede' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible({ timeout: 10_000 })
    const receipt = page.getByRole('article', { name: 'Recibo do pedido' })
    await expect(receipt.getByText('Emerald Ape #042')).toBeVisible()
    await expect(receipt.getByRole('definition').filter({ hasText: '1.206 ETH' }).first()).toBeVisible()

    await mocks.updateNft('emerald-ape-042', { editionId: '1-50', price: '9.99' })
    await page.reload()
    await expect(receipt.getByText('1.19 ETH').first()).toBeVisible()
    await expect(receipt.getByText('9.99 ETH')).toHaveCount(0)

    await page.getByRole('button', { name: 'Ver no Etherscan' }).click()
    await expect(page.getByRole('dialog', { name: 'Transação simulada' })).toBeVisible()
    await page.keyboard.press('Escape')

    await page.goto('/cart')
    await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
    if (!isMobile(page)) await expect(page.getByRole('link', { name: 'Carrinho vazio' })).toBeVisible()
  })
})
