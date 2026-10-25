import { expect } from '@playwright/test'
import { test } from './fixtures'
import { buyFromDetail, openReview, startPurchase, waitForRealtime } from './flows'

test.describe('Tempo real no catálogo, carrinho e checkout', () => {
  test('nft.updated atualiza o preço do detalhe sem recarregar e avisa a mudança', async ({ page, mocks }) => {
    await mocks.boot('padrao', '/nfts/emerald-ape-042')
    const price = page.getByText('1.19 ETH').first()
    await expect(price).toBeVisible()
    await waitForRealtime(page)
    await mocks.updateNft('emerald-ape-042', { editionId: '1-50', price: '1.5' })
    await expect(page.getByText('1.50 ETH').first()).toBeVisible()
    await expect(page.getByText('Atualização em Emerald Ape #042: o preço da edição 1/50 mudou de 1.19 ETH para 1.50 ETH.')).toBeVisible()
  })

  test('preço alterado durante o checkout avisa, atualiza o resumo e exige nova confirmação', async ({ page, mocks }) => {
    await mocks.boot()
    await startPurchase(page, mocks)
    await expect(page.getByText('1.206 ETH')).toBeVisible()
    await waitForRealtime(page)

    await mocks.updateNft('emerald-ape-042', { editionId: '1-50', price: '1.3' })
    await expect(page.getByText(/o preço de Emerald Ape #042 mudou de 1.19 ETH para 1.30 ETH/)).toBeVisible()
    await expect(page.getByText('1.316 ETH')).toBeVisible()

    const review = await openReview(page)
    await expect(review.getByText(/O preço de Emerald Ape #042 mudou de 1.19 ETH para 1.30 ETH/)).toBeVisible()
    await expect(review.getByRole('button', { name: 'Confirmar e pagar' })).toHaveCount(0)
    await review.getByRole('button', { name: 'Aceitar novos valores' }).click()
    await review.getByRole('button', { name: 'Confirmar e pagar' }).click()
    await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('article', { name: 'Recibo do pedido' }).getByText('1.316 ETH').first()).toBeVisible()
  })

  test('edição esgotada com o carrinho aberto marca o item e bloqueia a finalização', async ({ page, mocks }) => {
    await mocks.boot()
    await buyFromDetail(page)
    await expect(page.getByRole('link', { name: 'Emerald Ape #042' })).toBeVisible()
    await waitForRealtime(page)
    await mocks.updateNft('emerald-ape-042', { editionId: '1-50', available: 0 })
    await expect(page.getByText(/ficou com 0 unidades/)).toBeVisible()
    await expect(page.getByText(/A edição 1\/50 de Emerald Ape #042 esgotou/)).toBeVisible()
    await expect(page.getByRole('link', { name: 'Conectar e finalizar' })).toHaveAttribute('aria-disabled', 'true')
  })
})
