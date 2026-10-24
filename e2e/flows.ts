import { expect, type Page } from '@playwright/test'
import * as v from 'valibot'
import { orderListSchema } from '@contracts/order'
import type { MockControl } from './fixtures'

export const isMobile = (page: Page) => (page.viewportSize()?.width ?? 1440) < 768

export const buyFromDetail = async (page: Page, path = '/nfts/emerald-ape-042') => {
  await page.goto(path)
  await page.getByRole('heading', { level: 1 }).first().waitFor()
  await page.getByRole('button', { name: isMobile(page) ? 'Comprar NFT' : 'Comprar', exact: true }).click()
  await expect(page).toHaveURL(/\/cart/)
}

export const goToCheckout = async (page: Page) => {
  await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
  await expect(page).toHaveURL(/\/checkout/)
  await expect(page.getByRole('textbox', { name: 'Nome de exibição' })).toBeVisible()
  if (isMobile(page)) {
    await page.getByRole('button', { name: 'Continuar' }).click()
    await expect(page.getByRole('heading', { name: 'Pagamento com carteira' })).toBeVisible()
  }
}

export const connectWallet = async (page: Page) => {
  await page.getByRole('button', { name: 'Conectar carteira' }).click()
  await expect(page.getByText(/Conectada: /)).toBeVisible()
}

export const openReview = async (page: Page) => {
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  const dialog = page.getByRole('dialog', { name: 'Revise seu pedido' })
  await expect(dialog).toBeVisible()
  return dialog
}

export const startPurchase = async (page: Page, mocks: MockControl, path?: string) => {
  await mocks.loginAs('ana')
  await buyFromDetail(page, path)
  await goToCheckout(page)
  await connectWallet(page)
}

export const listOrders = async (mocks: MockControl) => {
  const result = await mocks.api({ method: 'GET', path: '/orders', token: await mocks.token() })
  return v.parse(orderListSchema, result.body)
}
