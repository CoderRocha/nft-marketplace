import { expect } from '@playwright/test'
import { test } from './fixtures'

test.describe('Detalhe do NFT', () => {
  test('acesso direto mostra galeria, informações e relacionados', async ({ page, mocks }) => {
    await mocks.boot('padrao', '/nfts/emerald-ape-042')
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
    await expect(page.getByText('1.19 ETH').first()).toBeVisible()
    await page.getByRole('button', { name: 'Ver imagem 2 de 4' }).click()
    await expect(page.getByRole('button', { name: 'Ver imagem 2 de 4' })).toHaveAttribute('aria-pressed', 'true')
    await page.getByRole('tab', { name: /Avaliações de colecionadores/ }).click()
    await expect(page.getByRole('tabpanel')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Mais desta coleção' })).toBeVisible()
  })

  test('NFT inexistente mostra página própria', async ({ page, mocks }) => {
    await mocks.boot('padrao', '/nfts/nao-existe-000')
    await expect(page.getByRole('heading', { name: 'NFT não encontrado' })).toBeVisible()
    await page.getByRole('link', { name: 'Explorar o mercado' }).click()
    await expect(page).toHaveURL(/#catalogo/)
  })

  test('edição esgotada por acesso direto bloqueia a quantidade', async ({ page, mocks }) => {
    await mocks.boot('padrao', '/nfts/emerald-ape-042?edicao=1-1')
    await expect(page.getByRole('alert').filter({ hasText: 'A edição 1/1 está esgotada' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Aumentar quantidade' }).first()).toBeDisabled()
    await page.getByRole('radio', { name: '1/50' }).check({ force: true })
    await expect(page).not.toHaveURL(/edicao=1-1/)
    await expect(page.getByRole('alert').filter({ hasText: 'esgotada' })).toHaveCount(0)
  })

  test('quantidade respeita a disponibilidade e o limite por pedido', async ({ page, mocks }) => {
    await mocks.boot('padrao', '/nfts/violet-nomad-314?edicao=1-10')
    const increase = page.getByRole('button', { name: 'Aumentar quantidade' }).first()
    for (let click = 0; click < 7; click += 1) await increase.click()
    await expect(increase).toBeDisabled()
    await expect(page.getByText('Você selecionou todas as 8 unidades disponíveis').first()).toBeVisible()

    await page.goto('/nfts/emerald-ape-042?qtd=40')
    await expect(page.getByText('Limite de 10 unidades por pedido').first()).toBeVisible()
    await expect(page.getByRole('group', { name: 'Quantidade' }).first().getByRole('status')).toHaveText('10')
  })
})
