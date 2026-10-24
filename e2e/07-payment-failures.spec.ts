import { expect } from '@playwright/test'
import { test } from './fixtures'
import { connectWallet, listOrders, openReview, startPurchase } from './flows'

test.describe('Falhas de pagamento', () => {
  test('pagamento recusado mantém os itens no carrinho', async ({ page, mocks }) => {
    await mocks.boot('pagamento-recusado')
    await startPurchase(page, mocks)
    const review = await openReview(page)
    await review.getByRole('button', { name: 'Confirmar e pagar' }).click()
    await expect(page.getByRole('heading', { name: 'Pagamento recusado' })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('A rede recusou o pagamento.')).toBeVisible()
    await page.getByRole('link', { name: 'Ver carrinho' }).click()
    await expect(page.getByRole('link', { name: 'Emerald Ape #042' })).toBeVisible()
  })

  test('carteira recusa a conexão e aceita na nova tentativa', async ({ page, mocks }) => {
    await mocks.boot('carteira-recusada')
    await mocks.loginAs('ana')
    await page.goto('/nfts/emerald-ape-042')
    await page.getByRole('button', { name: 'Comprar', exact: true }).click()
    await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
    await page.getByRole('button', { name: 'Conectar carteira' }).click()
    await expect(page.getByText('A carteira recusou a conexão.')).toBeVisible()
    await connectWallet(page)
  })

  test('clique repetido cria um único pedido', async ({ page, mocks }) => {
    await mocks.boot()
    await startPurchase(page, mocks)
    const review = await openReview(page)
    await review.getByRole('button', { name: 'Confirmar e pagar' }).dblclick()
    await expect(page).toHaveURL(/\/orders\/ord_/)
    expect(await listOrders(mocks)).toHaveLength(1)
  })

  test('timeout após criar o pedido recupera o mesmo pedido pela chave de idempotência', async ({ page, mocks }) => {
    test.setTimeout(60_000)
    await mocks.boot('timeout-pedido')
    await startPurchase(page, mocks)
    const orderKeys: Array<string | undefined> = []
    page.on('request', (request) => {
      if (request.method() === 'POST' && new URL(request.url()).pathname === '/api/orders') {
        orderKeys.push(request.headers()['idempotency-key'])
      }
    })
    const review = await openReview(page)
    await review.getByRole('button', { name: 'Confirmar e pagar' }).click()
    await expect(page).toHaveURL(/\/orders\/ord_/, { timeout: 20_000 })
    expect(orderKeys).toHaveLength(2)
    expect(orderKeys[0]).toBeTruthy()
    expect(orderKeys[1]).toBe(orderKeys[0])
    expect(await listOrders(mocks)).toHaveLength(1)
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible({ timeout: 10_000 })
    expect(await listOrders(mocks)).toHaveLength(1)
  })

  test('preço alterado na revisão exige aceitar os novos valores', async ({ page, mocks }) => {
    await mocks.boot('preco-alterado-no-checkout')
    await startPurchase(page, mocks)
    const review = await openReview(page)
    await review.getByRole('button', { name: 'Confirmar e pagar' }).click()
    await expect(review.getByText('Os valores do pedido mudaram')).toBeVisible()
    await expect(review.getByText(/O preço de Emerald Ape #042 mudou de 1.19 ETH para 1.24 ETH/)).toBeVisible()
    await review.getByRole('button', { name: 'Aceitar novos valores' }).click()
    await review.getByRole('button', { name: 'Confirmar e pagar' }).click()
    await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('article', { name: 'Recibo do pedido' }).getByText('1.24 ETH').first()).toBeVisible()
  })

  test('edição esgotada na revisão bloqueia o pagamento', async ({ page, mocks }) => {
    await mocks.boot('esgotado-no-checkout')
    await startPurchase(page, mocks)
    const review = await openReview(page)
    await review.getByRole('button', { name: 'Confirmar e pagar' }).click()
    await expect(review.getByText(/esgotou/)).toBeVisible()
    await expect(review.getByRole('button', { name: 'Confirmar e pagar' })).toHaveCount(0)
    await review.getByRole('link', { name: 'Revisar carrinho' }).click()
    await expect(page).toHaveURL(/\/cart/)
    expect(await listOrders(mocks)).toHaveLength(0)
  })
})
