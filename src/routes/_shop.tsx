import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { AccountMenu } from '@features/auth/account-menu'
import { useCart } from '@features/cart/hooks'
import { SearchDialog } from '@features/catalog/search-dialog'
import { NewsletterForm } from '@features/newsletter/newsletter-form'
import { ShopLayout } from '@layouts/shop-layout'

const ShopRoute = () => {
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)
  const searchOpener = useRef<HTMLElement | null>(null)
  const cart = useCart()
  return (
    <ShopLayout
      cartCount={cart.data?.itemCount ?? 0}
      account={<AccountMenu />}
      newsletter={<NewsletterForm />}
      onSearch={() => {
        searchOpener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
        setSearchOpen(true)
      }}
    >
      <Outlet />
      <SearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        returnFocus={searchOpener}
        onSearch={(query) => {
          void navigate({ to: '/', search: { q: query }, hash: 'catalogo' })
        }}
      />
    </ShopLayout>
  )
}

export const Route = createFileRoute('/_shop')({ component: ShopRoute })
