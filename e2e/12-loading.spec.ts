import { expect } from '@playwright/test'
import { test } from './fixtures'

test.describe('Carregamento, falha e nova tentativa', () => {
  test('rede lenta mostra skeletons do catálogo e do detalhe', async ({ page, mocks }) => {
    await mocks.boot('lento')
    await expect(page.getByRole('status', { name: 'Carregando NFTs' })).toBeVisible()
    await expect(page.locator('#catalogo').getByRole('article')).toHaveCount(9, { timeout: 10_000 })

    await page.goto('/nfts/emerald-ape-042')
    await expect(page.getByRole('status', { name: 'Carregando NFT' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible({ timeout: 10_000 })
  })

  test('erro 503 mostra feedback e recupera ao tentar novamente', async ({ page, mocks }) => {
    await mocks.boot('erro-503')
    const failure = page.locator('#catalogo').getByRole('alert')
    await expect(failure).toContainText('Serviço indisponível', { timeout: 15_000 })
    await failure.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.locator('#catalogo').getByRole('article')).toHaveCount(9)
  })

  test('sem conexão no detalhe mostra feedback e recupera', async ({ page, mocks }) => {
    await mocks.boot('offline', '/nfts/emerald-ape-042')
    await expect(page.getByRole('alert').filter({ hasText: 'Sem conexão' })).toBeVisible({ timeout: 15_000 })
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
  })
})
