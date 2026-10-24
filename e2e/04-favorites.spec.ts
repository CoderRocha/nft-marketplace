import { expect } from '@playwright/test'
import { test } from './fixtures'

test.describe('Lista de interesse', () => {
  test('visitante é levado ao login ao favoritar', async ({ page, mocks }) => {
    await mocks.boot('padrao', '/nfts/emerald-ape-042')
    await page.getByRole('button', { name: 'Favoritar' }).click()
    await expect(page).toHaveURL(/\/login\?redirect=%2Fnfts%2Femerald-ape-042/)
  })

  test('favoritar é otimista, persiste e aparece na lista', async ({ page, mocks }) => {
    await mocks.boot()
    await mocks.loginAs('ana', '/nfts/emerald-ape-042')
    const button = page.getByRole('button', { name: 'Favoritar' })
    await button.click()
    await expect(page.getByRole('button', { name: 'Favoritado' })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByText('Emerald Ape #042 entrou na sua lista de interesse.')).toBeVisible()

    await page.reload()
    await expect(page.getByRole('button', { name: 'Favoritado' })).toBeVisible()
    await page.goto('/profile/favorites')
    await expect(page.getByRole('article').filter({ hasText: 'Emerald Ape #042' })).toBeVisible()
  })

  test('falha ao favoritar desfaz a mudança e permite tentar de novo', async ({ page, mocks }) => {
    await mocks.boot()
    await mocks.loginAs('ana', '/nfts/emerald-ape-042')
    await expect(page.getByRole('button', { name: 'Favoritar' })).toBeVisible()
    await mocks.fail({ method: 'put', path: '/me/favorites/:nftId', kind: 500 })

    await page.getByRole('button', { name: 'Favoritar' }).click()
    await expect(page.getByText('Não foi possível atualizar sua lista de interesse. Tente novamente.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Favoritar' })).toHaveAttribute('aria-pressed', 'false')

    await page.getByRole('button', { name: 'Favoritar' }).click()
    await expect(page.getByRole('button', { name: 'Favoritado' })).toHaveAttribute('aria-pressed', 'true')
  })
})
