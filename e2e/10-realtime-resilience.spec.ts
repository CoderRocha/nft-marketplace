import { expect } from '@playwright/test'
import { test } from './fixtures'
import { buyFromDetail, listOrders, openReview, startPurchase, waitForRealtime } from './flows'

test.describe('Resiliência do tempo real', () => {
  test('eventos duplicados e antigos não regridem o estado nem repetem avisos', async ({ page, mocks }) => {
    await mocks.boot()
    await buyFromDetail(page)
    await page.goto('/nfts/emerald-ape-042')
    await expect(page.getByRole('link', { name: 'Carrinho com 1 item' }).first()).toBeVisible()
    await waitForRealtime(page)
    await mocks.updateNft('emerald-ape-042', { editionId: '1-50', price: '1.3' })
    await expect(page.getByText('1.30 ETH').first()).toBeVisible()
    await mocks.updateNft('emerald-ape-042', { editionId: '1-50', price: '1.4' })
    await expect(page.getByText('1.40 ETH').first()).toBeVisible()
    const notice = page.getByText(/Emerald Ape #042 mudou de 1.19 ETH para 1.40 ETH/)
    await expect(notice).toHaveCount(1)

    await mocks.replayRealtime()
    await page.waitForTimeout(800)
    const editionPrice = page.getByText(/^Preço da edição 1\/50:/).locator('xpath=..')
    await expect(editionPrice).toHaveText(/1\.40 ETH/)
    await expect(editionPrice).not.toHaveText(/1\.30 ETH/)
    await expect(notice).toHaveCount(1)
  })

  test('queda da conexão reconecta e reconcilia com a API', async ({ page, mocks }) => {
    await mocks.boot('padrao', '/nfts/emerald-ape-042')
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
    await waitForRealtime(page)
    await mocks.dropRealtime()
    await expect(page.getByText('Conexão em tempo real perdida. Tentando reconectar...')).toBeVisible()
    await expect(page.getByText('Conexão em tempo real restabelecida.')).toBeVisible({ timeout: 10_000 })
    await mocks.updateNft('emerald-ape-042', { editionId: '1-50', price: '2' })
    await expect(page.getByText('2.00 ETH').first()).toBeVisible()
  })

  test('pedido pendente é retomado após queda e após recarregar, sem nova compra', async ({ page, mocks }) => {
    await mocks.boot()
    await startPurchase(page, mocks)
    const review = await openReview(page)
    await review.getByRole('button', { name: 'Confirmar e pagar' }).click()
    await expect(page.getByRole('heading', { name: 'Aguardando confirmação na rede' })).toBeVisible()
    await mocks.dropRealtime()
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible({ timeout: 15_000 })
    expect(await listOrders(mocks)).toHaveLength(1)
    await page.goto('/checkout')
    await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
    expect(await listOrders(mocks)).toHaveLength(1)
  })
})
