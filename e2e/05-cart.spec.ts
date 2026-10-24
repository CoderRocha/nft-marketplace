import { expect, type Page } from '@playwright/test'
import { test, USERS } from './fixtures'

const summary = (page: Page) => page.getByRole('region', { name: 'Resumo do pedido' })

const summaryValue = (page: Page, label: string) =>
  summary(page)
    .locator('div', { has: page.getByRole('term').filter({ hasText: new RegExp(`^${label}$`) }) })
    .getByRole('definition')
    .first()

const buyFromDetail = async (page: Page, path = '/nfts/emerald-ape-042') => {
  await page.goto(path)
  await page.getByRole('button', { name: 'Comprar', exact: true }).click()
  await expect(page).toHaveURL(/\/cart/)
}

test.describe('Carrinho', () => {
  test('visitante adiciona, altera quantidade, remove e o carrinho sobrevive ao refresh', async ({ page, mocks }) => {
    await mocks.boot()
    await buyFromDetail(page)
    await expect(page.getByRole('link', { name: 'Emerald Ape #042' })).toBeVisible()
    await expect(summaryValue(page, 'Subtotal')).toHaveText('1.19 ETH')
    await expect(summaryValue(page, 'Taxa de rede')).toHaveText('0.016 ETH')
    await expect(summaryValue(page, 'Total')).toHaveText('1.206 ETH')

    await page.getByRole('button', { name: 'Aumentar quantidade de emerald ape #042' }).first().click()
    await expect(summaryValue(page, 'Subtotal')).toHaveText('2.38 ETH')
    await expect(summaryValue(page, 'Total')).toHaveText('2.396 ETH')
    await expect(page.getByRole('link', { name: 'Carrinho com 2 itens' }).first()).toBeVisible()

    await page.reload()
    await expect(summaryValue(page, 'Subtotal')).toHaveText('2.38 ETH')

    await page.getByRole('button', { name: 'Remover Emerald Ape #042 do carrinho' }).click()
    await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
  })

  test('cupom inválido, expirado, válido e remoção', async ({ page, mocks }) => {
    await mocks.boot()
    await buyFromDetail(page)
    const coupon = page.getByRole('textbox', { name: 'Código promocional' })
    const apply = page.getByRole('button', { name: 'Aplicar' })

    await coupon.fill('naoexiste')
    await apply.click()
    await expect(page.getByText('Este código promocional não existe.')).toBeVisible()

    await coupon.fill('expirado')
    await apply.click()
    await expect(page.getByText('Este código promocional expirou.')).toBeVisible()

    await coupon.fill('kurio10')
    await apply.click()
    await expect(page.getByText('Cupom KURIO10 aplicado (10% de desconto)')).toBeVisible()
    await expect(summaryValue(page, 'Desconto do lançamento')).toHaveText('(-) 0.119')
    await expect(summaryValue(page, 'Total')).toHaveText('1.087 ETH')

    await page.getByRole('button', { name: 'Remover cupom KURIO10' }).click()
    await expect(summaryValue(page, 'Desconto do lançamento')).toHaveText('(-) 0.00')
  })

  test('itens do visitante são preservados ao entrar na conta', async ({ page, mocks }) => {
    await mocks.boot()
    await buyFromDetail(page)
    await page.goto('/login?redirect=%2Fcart')
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('E-mail').fill(USERS.ana.email)
    await dialog.getByLabel('Senha', { exact: true }).fill(USERS.ana.password)
    await dialog.getByRole('button', { name: 'Entrar' }).click()
    await expect(page).toHaveURL(/\/cart$/)
    await expect(page.getByRole('link', { name: 'Emerald Ape #042' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Conta de Ana Souza' })).toBeVisible()
  })

  test('quantidade respeita a disponibilidade da edição', async ({ page, mocks }) => {
    await mocks.boot()
    await buyFromDetail(page, '/nfts/violet-nomad-314?edicao=1-10&qtd=8')
    await expect(summaryValue(page, 'Subtotal')).toHaveText('20.016 ETH')
    await expect(page.getByRole('button', { name: 'Aumentar quantidade de violet nomad #314' }).first()).toBeDisabled()
  })
})
