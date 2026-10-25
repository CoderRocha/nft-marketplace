import { expect, type Page } from '@playwright/test'
import { test, USERS, type DemoUser } from './fixtures'
import { buyFromDetail, goToCheckout, openReview, startPurchase } from './flows'

const authDialog = (page: Page) => page.getByRole('dialog')

const signInForm = (page: Page) => page.getByRole('form', { name: 'Entrar' })

const signInThroughForm = async (page: Page, user: DemoUser) => {
  await signInForm(page).getByRole('textbox', { name: 'E-mail' }).fill(USERS[user].email)
  await signInForm(page).getByLabel('Senha', { exact: true }).fill(USERS[user].password)
  await signInForm(page).getByRole('button', { name: 'Entrar' }).click()
}

const checkoutDraftKeys = (page: Page) =>
  page.evaluate(() => Object.keys(sessionStorage).filter((key) => key.startsWith('kurio:checkout-draft')))

const signOut = async (page: Page) => {
  await page.getByRole('navigation', { name: 'Meu perfil' }).getByRole('button', { name: 'Sair' }).click()
  await expect(page.getByText('Você saiu da sua conta.')).toBeVisible()
}

test.describe('Conta e sessão', () => {
  test('cadastro valida campos, trata conflito e entra na conta', async ({ page, mocks }) => {
    await mocks.boot('padrao', '/register')
    const dialog = authDialog(page)
    await dialog.getByRole('button', { name: 'Criar conta' }).click()
    await expect(dialog.getByText('Informe um nome de usuário.')).toBeVisible()
    await expect(dialog.getByLabel('Nome de usuário')).toHaveAttribute('aria-invalid', 'true')

    await dialog.getByLabel('Nome de usuário').fill('nova.colecionadora')
    await dialog.getByLabel('E-mail').fill('ocupado@kurio.dev')
    await dialog.getByLabel('Senha', { exact: true }).fill('Senha@123')
    await dialog.getByLabel('Confirmar senha', { exact: true }).fill('Senha@124')
    await dialog.getByRole('button', { name: 'Criar conta' }).click()
    await expect(dialog.getByText('As senhas não coincidem.')).toBeVisible()

    await dialog.getByLabel('Confirmar senha', { exact: true }).fill('Senha@123')
    await dialog.getByRole('button', { name: 'Criar conta' }).click()
    await expect(dialog.getByText('Este e-mail já tem uma conta. Entre ou use outro e-mail.')).toBeVisible()

    await dialog.getByLabel('E-mail').fill('nova@kurio.dev')
    await dialog.getByRole('button', { name: 'Criar conta' }).click()
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('button', { name: 'Conta de nova.colecionadora' })).toBeVisible()
  })

  test('rota privada leva ao login e volta ao destino; a sessão sobrevive ao refresh @main', async ({ page, mocks }) => {
    await mocks.boot('padrao', '/profile/wallets')
    await expect(page).toHaveURL(/\/login\?redirect=/)
    await signInForm(page).getByRole('textbox', { name: 'E-mail' }).fill(USERS.ana.email)
    await signInForm(page).getByLabel('Senha', { exact: true }).fill('senha-errada')
    await signInForm(page).getByRole('button', { name: 'Entrar' }).click()
    await expect(signInForm(page).getByText('E-mail ou senha incorretos')).toBeVisible()

    await signInThroughForm(page, 'ana')
    await expect(page).toHaveURL(/\/profile\/wallets/)
    await expect(page.getByRole('heading', { name: 'Carteira principal' })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Carteira principal' })).toBeVisible()
  })

  test('sessão expirada durante a navegação preserva o destino', async ({ page, mocks }) => {
    await mocks.boot()
    await mocks.loginAs('ana', '/profile')
    await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
    await mocks.expireSession()
    await page.getByRole('navigation', { name: 'Meu perfil' }).getByRole('link', { name: 'Carteiras' }).click()
    await expect(page).toHaveURL(/\/login\?.*motivo=expirada/)
    await expect(page.getByText(/^Sua sessão expirou/)).toBeVisible()
    await signInThroughForm(page, 'ana')
    await expect(page).toHaveURL(/\/profile\/wallets/)
  })

  test('sessão expirada durante o checkout preserva os dados preenchidos', async ({ page, mocks }) => {
    await mocks.boot()
    await mocks.loginAs('ana')
    await buyFromDetail(page)
    await goToCheckout(page)
    const note = page.getByRole('textbox', { name: 'Observação do colecionador (opcional)' })
    await note.fill('Enviar para a carteira fria')
    await expect
      .poll(() =>
        page.evaluate(() =>
          Object.keys(sessionStorage).some(
            (key) => key.startsWith('kurio:checkout-draft') && (sessionStorage.getItem(key) ?? '').includes('carteira fria'),
          ),
        ),
      )
      .toBe(true)
    await mocks.expireSession()
    await page.getByRole('button', { name: 'Conectar carteira' }).click()
    await expect(page).toHaveURL(/\/login\?.*motivo=expirada/)
    await signInThroughForm(page, 'ana')
    await expect(page).toHaveURL(/\/checkout/)
    await expect(note).toHaveValue('Enviar para a carteira fria')
  })

  test('outra carteira preenchida no checkout volta selecionada após a expiração', async ({ page, mocks }) => {
    const address = '0x1111111111111111111111111111111111111111'
    await mocks.boot()
    await mocks.loginAs('ana')
    await buyFromDetail(page)
    await goToCheckout(page)
    const otherWallet = page.getByRole('checkbox', { name: 'Usar outra carteira?' })
    await otherWallet.click()
    await page.getByRole('combobox', { name: /^Rede/ }).click()
    await page.getByRole('option', { name: 'Ethereum' }).click()
    await page.getByRole('combobox', { name: /^Tipo de carteira/ }).click()
    await page.getByRole('option', { name: 'MetaMask' }).click()
    await page.getByRole('textbox', { name: 'Endereço da carteira' }).fill(address)
    await expect
      .poll(() =>
        page.evaluate(
          (expected) => Object.keys(sessionStorage).some((key) => key.startsWith('kurio:checkout-draft') && (sessionStorage.getItem(key) ?? '').includes(expected)),
          address,
        ),
      )
      .toBe(true)
    await mocks.expireSession()
    await page.getByRole('button', { name: 'Conectar carteira' }).click()
    await expect(page).toHaveURL(/\/login\?.*motivo=expirada/)
    await signInThroughForm(page, 'ana')
    await expect(page).toHaveURL(/\/checkout/)
    await expect(page.getByRole('textbox', { name: 'Endereço da carteira' })).toHaveValue(address)
    await expect(otherWallet).toBeChecked()
  })

  test('logout apaga o rascunho do checkout do navegador', async ({ page, mocks }) => {
    await mocks.boot()
    await mocks.loginAs('ana')
    await buyFromDetail(page)
    await goToCheckout(page)
    await page.getByRole('textbox', { name: 'Observação do colecionador (opcional)' }).fill('Dados que não podem ficar')
    await expect.poll(() => checkoutDraftKeys(page)).toHaveLength(1)
    await page.goto('/profile')
    await signOut(page)
    expect(await checkoutDraftKeys(page)).toHaveLength(0)
  })

  test('pedido de outra conta não é exibido', async ({ page, mocks }) => {
    await mocks.boot()
    await startPurchase(page, mocks)
    const review = await openReview(page)
    await review.getByRole('button', { name: 'Confirmar e pagar' }).click()
    await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible({ timeout: 10_000 })
    const orderPath = new URL(page.url()).pathname
    await mocks.loginAs('bruno', orderPath)
    await expect(page.getByRole('heading', { name: 'Pedido de outra conta' })).toBeVisible()
    await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toHaveCount(0)
  })

  test('sessão curta expira quando o relógio avança', async ({ page, mocks }) => {
    await page.clock.install()
    await mocks.boot('sessao-expirada')
    await mocks.loginAs('ana', '/profile')
    await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
    await page.clock.fastForward('00:50')
    await page.getByRole('navigation', { name: 'Meu perfil' }).getByRole('link', { name: 'Carteiras' }).click()
    await expect(page).toHaveURL(/\/login\?.*motivo=expirada/)
  })

  test('logout e troca de usuário não vazam dados da conta anterior @main', async ({ page, mocks }) => {
    await mocks.boot()
    await mocks.loginAs('ana', '/profile/favorites')
    await expect(page.getByRole('article').filter({ hasText: 'Sage Nomad #009' })).toBeVisible()
    await signOut(page)
    await expect(page).toHaveURL('/')

    await page.goto('/profile/favorites')
    await signInThroughForm(page, 'bruno')
    await expect(page).toHaveURL('/profile/favorites')
    await expect(page.getByRole('article').filter({ hasText: 'Golden Beat #207' })).toBeVisible()
    await expect(page.getByRole('article').filter({ hasText: 'Sage Nomad #009' })).toHaveCount(0)
  })
})
