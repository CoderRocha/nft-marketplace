import { expect, type Page } from '@playwright/test'
import { test } from './fixtures'

const filters = (page: Page) => page.getByRole('complementary', { name: 'Filtros' })

const catalogCards = (page: Page) => page.locator('#catalogo').getByRole('article')

const searchFromHeader = async (page: Page, term: string) => {
  await page.getByRole('banner').getByRole('button', { name: 'Buscar NFTs' }).click()
  await page.getByRole('searchbox', { name: 'Termo de busca' }).fill(term)
  await page.getByRole('searchbox', { name: 'Termo de busca' }).press('Enter')
}

test.describe('Catálogo', () => {
  test('filtros combinados, ordenação e paginação compõem a URL e voltam pelo histórico', async ({ page, mocks }) => {
    await mocks.boot()
    await expect(catalogCards(page)).toHaveCount(9)

    await page.getByRole('button', { name: 'Página 2' }).click()
    await expect(page).toHaveURL(/pagina=2/)
    await expect(page.getByRole('button', { name: 'Página 2' })).toHaveAttribute('aria-current', 'page')

    await filters(page).getByRole('button', { name: /Música/ }).click()
    await expect(page).not.toHaveURL(/pagina=/)
    await filters(page).getByRole('button', { name: /Polygon/ }).click()
    await expect(page).toHaveURL(/colecao=.*musica/)
    await expect(page).toHaveURL(/rede=.*polygon/)
    await expect(catalogCards(page).filter({ hasText: 'Golden Beat #207' })).toBeVisible()
    await expect(catalogCards(page).filter({ hasText: 'Golden Signal #160' })).toHaveCount(0)

    await page.getByRole('combobox', { name: 'Ordenar por:' }).click()
    await page.getByRole('option', { name: 'Maior preço' }).click()
    await expect(page).toHaveURL(/ordem=maior-preco/)

    await page.goBack()
    await expect(page).not.toHaveURL(/ordem=/)
    await page.goBack()
    await page.goBack()
    await expect(page).toHaveURL(/pagina=2/)
    await expect(page.getByRole('button', { name: 'Página 2' })).toHaveAttribute('aria-current', 'page')

    await page.goForward()
    await page.reload()
    await expect(filters(page).getByRole('button', { name: /Música/ })).toHaveAttribute('aria-pressed', 'true')
  })

  test('aba e busca pelo header filtram os resultados', async ({ page, mocks }) => {
    await mocks.boot()
    await page.getByRole('button', { name: 'Em alta' }).click()
    await expect(page).toHaveURL(/aba=em-alta/)

    await searchFromHeader(page, 'emerald ape')
    await expect(page).toHaveURL(/q=emerald/)
    await expect(catalogCards(page)).toHaveCount(1)
    await expect(catalogCards(page).first()).toContainText('Emerald Ape #042')

    await searchFromHeader(page, 'nada-com-este-nome')
    await expect(page.getByText('Nenhum NFT encontrado')).toBeVisible()
    await page.getByRole('button', { name: 'Limpar filtros' }).click()
    await expect(catalogCards(page)).toHaveCount(9)
  })

  test('resposta antiga que chega depois não substitui a busca mais recente', async ({ page, mocks }) => {
    await mocks.boot('fora-de-ordem')
    await expect(catalogCards(page)).toHaveCount(9)
    await searchFromHeader(page, 'gol')
    await searchFromHeader(page, 'golden signal')
    await expect(catalogCards(page)).toHaveCount(1)
    await expect(catalogCards(page).first()).toContainText('Golden Signal #160')
    await page.waitForTimeout(2000)
    await expect(catalogCards(page)).toHaveCount(1)
    await expect(catalogCards(page).first()).toContainText('Golden Signal #160')
  })
})
