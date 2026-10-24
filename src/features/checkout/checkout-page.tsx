import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ShoppingCartIcon } from 'lucide-react'
import { profileQuery, walletsQuery } from '@core/queries'
import { ErrorState } from '@pattern/error-state'
import { useCart } from '@features/cart/hooks'
import { CheckoutForm } from '@features/checkout/checkout-form'
import type { CheckoutSearch } from '@features/checkout/schemas'
import { buttonVariants } from '@ui/button'
import { Skeleton } from '@ui/skeleton'

type CheckoutPageProps = {
  userId: string
  step: CheckoutSearch['etapa']
  onStepChange: (step: CheckoutSearch['etapa']) => void
}

const Breadcrumb = () => (
  <nav aria-label="Trilha de navegação" className="hidden text-[0.8125rem] font-semibold md:block">
    <ol className="flex gap-1">
      <li>
        <Link to="/" className="hover:text-primary">
          Início
        </Link>
        <span aria-hidden="true"> /</span>
      </li>
      <li>
        <Link to="/" hash="catalogo" className="hover:text-primary">
          Mercado
        </Link>
        <span aria-hidden="true"> /</span>
      </li>
      <li aria-current="page" className="text-muted-foreground">
        Pagamento
      </li>
    </ol>
  </nav>
)

const CheckoutSkeleton = () => (
  <div role="status" aria-label="Carregando pagamento" className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_25rem]">
    <div className="grid gap-5 md:grid-cols-2">
      {Array.from({ length: 10 }, (_, index) => (
        <Skeleton key={index} className="h-16" />
      ))}
    </div>
    <div className="flex flex-col gap-4">
      <Skeleton className="h-40" />
      <Skeleton className="h-28" />
      <Skeleton className="h-11" />
    </div>
  </div>
)

export const CheckoutPage = ({ userId, step, onStepChange }: CheckoutPageProps) => {
  const profile = useQuery(profileQuery(userId))
  const wallets = useQuery(walletsQuery(userId))
  const cart = useCart()
  const failed = [profile, wallets, cart].find((query) => query.isError)

  const content = () => {
    if (failed) {
      return (
        <ErrorState
          error={failed.error}
          retrying={failed.isFetching}
          onRetry={() => {
            void failed.refetch()
          }}
        />
      )
    }
    if (!profile.data || !wallets.data || !cart.data) return <CheckoutSkeleton />
    if (cart.data.lines.length === 0) {
      return (
        <div className="flex flex-col items-center gap-3 rounded-md bg-card px-6 py-16 text-center">
          <ShoppingCartIcon aria-hidden="true" className="size-10 text-primary" />
          <p className="text-lg font-semibold">Seu carrinho está vazio</p>
          <Link to="/" hash="catalogo" className={buttonVariants()}>
            Explorar o mercado
          </Link>
        </div>
      )
    }
    return (
      <CheckoutForm
        userId={userId}
        profile={profile.data}
        wallets={wallets.data}
        cart={cart.data}
        step={step}
        onStepChange={onStepChange}
      />
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-shop flex-col gap-6 px-4 pt-6 pb-10 md:px-6 md:pt-4">
      <Breadcrumb />
      <h1 className="sr-only">Pagamento</h1>
      {content()}
    </div>
  )
}
