import { expect, type Page } from '@playwright/test'
import { test } from './fixtures'

const scenarioDialog = (page: Page) => page.getByRole('dialog', { name: 'Cenários de teste' })

const catalogCards = (page: Page) => page.locator('#catalogo').getByRole('article')

test.describe('Cenários de teste', () => {
  test('Ctrl + K abre o modal e Cancelar fecha sem mudar nada', async ({ page, mocks }) => {
    await mocks.boot()
    await expect(catalogCards(page)).toHaveCount(9)
    await expect(page.getByRole('contentinfo').getByText('Cenários de teste')).toHaveCount(0)

    await page.keyboard.press('Control+k')
    await expect(scenarioDialog(page)).toBeVisible()
    await scenarioDialog(page).getByRole('radio', { name: /Catálogo vazio/ }).click()
    await scenarioDialog(page).getByRole('button', { name: 'Cancelar' }).click()
    await expect(scenarioDialog(page)).toHaveCount(0)
    await expect(catalogCards(page)).toHaveCount(9)

    await page.keyboard.press('Control+k')
    await expect(scenarioDialog(page).getByRole('radio', { name: /Padrão/ })).toBeChecked()
  })

  test('Ctrl + K não atrapalha o diálogo de login aberto', async ({ page, mocks }) => {
    await mocks.boot('padrao', '/login')
    const signIn = page.getByRole('form', { name: 'Entrar' })
    await expect(signIn).toBeVisible()
    await page.keyboard.press('Control+k')
    const dialog = scenarioDialog(page)
    await expect(dialog).toBeVisible()
    await dialog.getByRole('radio', { name: /Rede lenta/ }).click()
    await dialog.getByRole('button', { name: 'Cancelar' }).click()
    await expect(dialog).toHaveCount(0)
    await expect(page).toHaveURL(/\/login/)
    await expect(signIn).toBeVisible()

    await page.keyboard.press('Control+k')
    await expect(dialog).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect(page).toHaveURL(/\/login/)
    await expect(signIn).toBeVisible()
  })

  test('Aplicar troca o cenário e recarrega a página', async ({ page, mocks }) => {
    await mocks.boot()
    await expect(catalogCards(page)).toHaveCount(9)
    await page.keyboard.press('Control+k')
    await scenarioDialog(page).getByRole('radio', { name: /Catálogo vazio/ }).click()
    await scenarioDialog(page).getByRole('button', { name: 'Aplicar' }).click()
    await expect(page.getByText('Nenhum NFT encontrado')).toBeVisible()
  })

  test('?cenarios abre o modal, limpa a URL e Restaurar dados volta ao padrão', async ({ page, mocks }) => {
    await mocks.boot('vazio', '/?cenarios')
    await expect(scenarioDialog(page)).toBeVisible()
    await expect(page).not.toHaveURL(/cenarios/)
    await scenarioDialog(page).getByRole('radio', { name: /Padrão/ }).click()
    await scenarioDialog(page).getByRole('button', { name: 'Restaurar dados' }).click()
    await expect(scenarioDialog(page)).toHaveCount(0)
    await expect(catalogCards(page)).toHaveCount(9)
  })
})
