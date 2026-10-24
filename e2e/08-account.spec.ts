import { expect, type Page } from '@playwright/test'
import { test } from './fixtures'

const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)

const save = (page: Page) => page.getByRole('button', { name: 'Salvar', exact: true }).click()

test.describe('Perfil e carteiras', () => {
  test('edita os dados do perfil com validação, conflito e persistência', async ({ page, mocks }) => {
    await mocks.boot()
    await mocks.loginAs('ana', '/profile')
    await page.getByLabel('Nome de usuário').fill('')
    await save(page)
    await expect(page.getByText('Informe um nome de usuário.')).toBeVisible()

    await page.getByLabel('Nome de usuário').fill('ana.colecionadora')
    await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill('bruno@kurio.dev')
    await save(page)
    await expect(page.getByText('Este e-mail já pertence a outra conta.')).toBeVisible()

    await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill('ana@kurio.dev')
    await page.getByLabel('Nome de exibição').fill('Ana Colecionadora')
    await save(page)
    await expect(page.getByText('Perfil atualizado.')).toBeVisible()
    await page.reload()
    await expect(page.getByLabel('Nome de exibição')).toHaveValue('Ana Colecionadora')
    await expect(page.getByRole('button', { name: 'Conta de Ana Colecionadora' })).toBeVisible()
  })

  test('altera a senha com erros da API e entra com a nova senha', async ({ page, mocks }) => {
    await mocks.boot()
    await mocks.loginAs('ana', '/profile')
    await page.getByLabel('Senha atual', { exact: true }).fill('senha-errada')
    await page.getByLabel('Nova senha', { exact: true }).fill('NovaSenha@1')
    await page.getByLabel('Confirmar nova senha', { exact: true }).fill('OutraSenha@1')
    await save(page)
    await expect(page.getByText('As senhas não coincidem.')).toBeVisible()

    await page.getByLabel('Confirmar nova senha', { exact: true }).fill('NovaSenha@1')
    await save(page)
    await expect(page.getByText('A senha atual está incorreta.')).toBeVisible()

    await page.getByLabel('Senha atual', { exact: true }).fill('Senha@123')
    await save(page)
    await expect(page.getByText('Perfil e senha atualizados.')).toBeVisible()

    const login = await mocks.api({ method: 'POST', path: '/auth/login', body: { email: 'ana@kurio.dev', password: 'NovaSenha@1' } })
    expect(login.status).toBe(200)
  })

  test('envia, valida e remove o avatar', async ({ page, mocks }) => {
    await mocks.boot()
    await mocks.loginAs('ana', '/profile')
    const fileInput = page.getByLabel('Escolher imagem de avatar')

    await fileInput.setInputFiles({ name: 'notas.txt', mimeType: 'text/plain', buffer: Buffer.from('texto') })
    await expect(page.getByText('Envie uma imagem PNG, JPG ou WebP.')).toBeVisible()

    await fileInput.setInputFiles({ name: 'grande.png', mimeType: 'image/png', buffer: Buffer.alloc(1024 * 1024 + 1) })
    await expect(page.getByText('A imagem precisa ter até 1 MB.')).toBeVisible()

    await fileInput.setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: PNG_1X1 })
    await expect(page.getByText('Avatar atualizado.')).toBeVisible()
    await expect(page.getByRole('img', { name: 'Seu avatar atual' })).toBeVisible()

    await page.getByRole('button', { name: 'Remover' }).click()
    await expect(page.getByText('Avatar removido.')).toBeVisible()
    await expect(page.getByRole('img', { name: 'Seu avatar atual' })).toHaveCount(0)
  })

  test('valida e salva as carteiras principal e secundária', async ({ page, mocks }) => {
    await mocks.boot()
    await mocks.loginAs('bruno', '/profile/wallets')
    const primary = page.getByRole('form', { name: 'Carteira principal' })
    await primary.getByLabel('Endereço da carteira').fill('0x123')
    await primary.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(primary.getByText('Endereço inválido para a rede selecionada.')).toBeVisible()

    await primary.getByLabel('Endereço da carteira').fill('0x1111111111111111111111111111111111111111')
    await primary.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(page.getByText('Carteira principal salva.')).toBeVisible()

    await expect(page.getByText('Você ainda não adicionou uma carteira secundária.')).toBeVisible()
    await page.getByRole('checkbox', { name: 'Igual à carteira principal' }).click()
    const secondary = page.getByRole('form', { name: 'Carteira secundária' })
    await expect(secondary.getByLabel('Apelido da carteira')).toHaveValue('Reserva')
    await secondary.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(page.getByText('Carteira secundária salva.')).toBeVisible()

    await page.reload()
    await expect(page.getByRole('form', { name: 'Carteira principal' }).getByLabel('Endereço da carteira')).toHaveValue(
      '0x1111111111111111111111111111111111111111',
    )
    await expect(page.getByRole('form', { name: 'Carteira secundária' })).toBeVisible()
  })
})
