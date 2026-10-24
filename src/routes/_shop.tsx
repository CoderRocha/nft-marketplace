import { createFileRoute, Link, Outlet, useNavigate } from '@tanstack/react-router'
import { LogInIcon } from 'lucide-react'
import { ScenarioPanel } from '@features/dev-scenarios/scenario-panel'
import { NewsletterForm } from '@features/newsletter/newsletter-form'
import { ShopLayout } from '@layouts/shop-layout'
import { buttonVariants } from '@ui/button'

const ShopRoute = () => {
  const navigate = useNavigate()
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
      onSearch={() => void navigate({ to: '/', hash: 'catalogo' })}
    >
      <Outlet />
    </ShopLayout>
  )
}

export const Route = createFileRoute('/_shop')({ component: ShopRoute })
