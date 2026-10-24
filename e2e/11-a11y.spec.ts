import AxeBuilder from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'
import { test } from './fixtures'
import { buyFromDetail } from './flows'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

const axeViolations = async (page: Page) => {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
  return results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    targets: violation.nodes.slice(0, 3).map((node) => node.target.join(' ')),
  }))
}

const PUBLIC_PAGES = [
  { path: '/', ready: '#catalogo article' },
  { path: '/nfts/emerald-ape-042', ready: 'text=Mais desta coleção' },
  { path: '/login', ready: 'form[aria-label="Entrar"]' },
  { path: '/register', ready: 'form[aria-label="Criar conta"]' },
]

const PRIVATE_PAGES = [
  { path: '/profile', ready: 'text=Perfil do colecionador' },
  { path: '/profile/wallets', ready: 'text=Carteira principal' },
  { path: '/profile/favorites', ready: 'article' },
]

test.describe('Acessibilidade', () => {
  for (const target of PUBLIC_PAGES) {
    test(`sem violações WCAG A/AA em ${target.path}`, async ({ page, mocks }) => {
      await mocks.boot('padrao', target.path)
      await page.locator(target.ready).first().waitFor()
      expect(await axeViolations(page)).toEqual([])
    })
  }

  test('sem violações WCAG A/AA nas telas logadas, carrinho e pagamento', async ({ page, mocks }) => {
    await mocks.boot()
    await mocks.loginAs('ana')
    for (const target of PRIVATE_PAGES) {
      await page.goto(target.path)
      await page.locator(target.ready).first().waitFor()
      expect(await axeViolations(page), target.path).toEqual([])
    }
    await buyFromDetail(page)
    const finish = page.getByRole('link', { name: 'Conectar e finalizar' })
    await expect(finish).toHaveAttribute('aria-disabled', 'false')
    await page.waitForTimeout(300)
    expect(await axeViolations(page), '/cart').toEqual([])
    await finish.click()
    await page.getByRole('textbox', { name: 'Nome de exibição' }).waitFor()
    expect(await axeViolations(page), '/checkout').toEqual([])
  })

  test('link de pular para o conteúdo e ordem de foco do header', async ({ page, mocks }) => {
    await mocks.boot()
    await page.locator('#catalogo article').first().waitFor()
    await page.keyboard.press('Tab')
    const skipLink = page.getByRole('link', { name: 'Pular para o conteúdo' })
    await expect(skipLink).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.locator('#conteudo')).toBeFocused()

    await page.keyboard.press('Shift+Tab')
    await page.keyboard.press('Shift+Tab')
    await page.locator('header').getByRole('link', { name: 'KURIO' }).focus()
    await page.keyboard.press('Tab')
    await expect(page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Início' })).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Mercado' })).toBeFocused()
  })

  test('diálogo de busca prende e devolve o foco', async ({ page, mocks }) => {
    await mocks.boot()
    const trigger = page.getByRole('banner').getByRole('button', { name: 'Buscar NFTs' })
    await trigger.focus()
    await page.keyboard.press('Enter')
    const dialog = page.getByRole('dialog', { name: 'Buscar NFTs' })
    await expect(dialog.getByRole('searchbox', { name: 'Termo de busca' })).toBeFocused()
    for (let step = 0; step < 6; step += 1) {
      await page.keyboard.press('Tab')
      await expect.poll(() => dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true)
    }
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(trigger).toBeFocused()
  })

  test('gaveta de filtros no mobile prende e devolve o foco', async ({ page, mocks }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await mocks.boot()
    const trigger = page.getByRole('button', { name: 'Abrir filtros' })
    await trigger.click()
    const sheet = page.getByRole('dialog', { name: 'Filtros' })
    await expect(sheet).toBeVisible()
    await page.keyboard.press('Tab')
    await expect.poll(() => sheet.evaluate((element) => element.contains(document.activeElement))).toBe(true)
    await page.keyboard.press('Escape')
    await expect(sheet).toBeHidden()
    await expect(trigger).toBeFocused()
  })

  test('erros de formulário ficam associados aos campos', async ({ page, mocks }) => {
    await mocks.boot('padrao', '/login')
    const form = page.getByRole('form', { name: 'Entrar' })
    await form.getByRole('button', { name: 'Entrar' }).press('Enter')
    const email = form.getByRole('textbox', { name: 'E-mail' })
    await expect(email).toHaveAttribute('aria-invalid', 'true')
    await expect(email).toHaveAccessibleDescription('Informe seu e-mail.')
    await email.fill('ana@kurio.dev')
    await expect(email).toHaveAttribute('aria-invalid', 'false')
  })
})
