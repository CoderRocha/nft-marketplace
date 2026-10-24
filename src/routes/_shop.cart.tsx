import { createFileRoute } from '@tanstack/react-router'
import { CartPage } from '@features/cart/cart-page'

export const Route = createFileRoute('/_shop/cart')({
  head: () => ({ meta: [{ title: 'Carrinho - Kurio' }] }),
  component: CartPage,
})
