import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { AccountMenu } from '@features/auth/account-menu'
import { SearchDialog } from '@features/catalog/search-dialog'
import { ScenarioPanel } from '@features/dev-scenarios/scenario-panel'
import { NewsletterForm } from '@features/newsletter/newsletter-form'
import { ShopLayout } from '@layouts/shop-layout'

const ShopRoute = () => {
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)
  return (
    <ShopLayout
      cartCount={0}
      account={<AccountMenu />}
      newsletter={<NewsletterForm />}
      devTools={<ScenarioPanel />}
      onSearch={() => {
        setSearchOpen(true)
      }}
    >
      <Outlet />
      <SearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onSearch={(query) => {
          void navigate({ to: '/', search: { q: query }, hash: 'catalogo' })
        }}
      />
    </ShopLayout>
  )
}

export const Route = createFileRoute('/_shop')({ component: ShopRoute })
