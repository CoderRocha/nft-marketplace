import { expect, type Page } from '@playwright/test'
import { test, USERS, type DemoUser } from './fixtures'

const authDialog = (page: Page) => page.getByRole('dialog')

const signInThroughForm = async (page: Page, user: DemoUser) => {
  await authDialog(page).getByLabel('E-mail').fill(USERS[user].email)
  await authDialog(page).getByLabel('Senha', { exact: true }).fill(USERS[user].password)
  await authDialog(page).getByRole('button', { name: 'Entrar' }).click()
}

const signOut = async (page: Page, user: DemoUser) => {
  await page.getByRole('button', { name: `Conta de ${USERS[user].displayName}` }).click()
  await page.getByRole('menuitem', { name: 'Sair' }).click()
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

  test('rota privada leva ao login e volta ao destino; a sessão sobrevive ao refresh', async ({ page, mocks }) => {
    await mocks.boot('padrao', '/profile/wallets')
    await expect(page).toHaveURL(/\/login\?redirect=/)
    await authDialog(page).getByLabel('E-mail').fill(USERS.ana.email)
    await authDialog(page).getByLabel('Senha', { exact: true }).fill('senha-errada')
    await authDialog(page).getByRole('button', { name: 'Entrar' }).click()
    await expect(authDialog(page).getByText('E-mail ou senha incorretos')).toBeVisible()

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
    await expect(authDialog(page).getByText('Sua sessão expirou')).toBeVisible()
    await signInThroughForm(page, 'ana')
    await expect(page).toHaveURL(/\/profile\/wallets/)
  })

  test('logout e troca de usuário não vazam dados da conta anterior', async ({ page, mocks }) => {
    await mocks.boot()
    await mocks.loginAs('ana', '/profile/favorites')
    await expect(page.getByRole('article').filter({ hasText: 'Sage Nomad #009' })).toBeVisible()
    await signOut(page, 'ana')
    await expect(page).toHaveURL('/')

    await page.goto('/profile/favorites')
    await signInThroughForm(page, 'bruno')
    await expect(page).toHaveURL('/profile/favorites')
    await expect(page.getByRole('article').filter({ hasText: 'Golden Beat #207' })).toBeVisible()
    await expect(page.getByRole('article').filter({ hasText: 'Sage Nomad #009' })).toHaveCount(0)
  })
})
