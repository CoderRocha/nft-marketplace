import { createFileRoute, Link, Outlet, useNavigate } from '@tanstack/react-router'
import { LogInIcon } from 'lucide-react'
import { useState } from 'react'
import { SearchDialog } from '@features/catalog/search-dialog'
import { ScenarioPanel } from '@features/dev-scenarios/scenario-panel'
import { NewsletterForm } from '@features/newsletter/newsletter-form'
import { ShopLayout } from '@layouts/shop-layout'
import { buttonVariants } from '@ui/button'

const ShopRoute = () => {
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)
  return (
    <ShopLayout
      cartCount={0}
      account={
        <Link to="/login" className={buttonVariants({ size: 'sm', className: 'h-8 px-3' })}>
          <LogInIcon />
          Entrar
        </Link>
      }
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
