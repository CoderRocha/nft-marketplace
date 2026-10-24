import { Link, useCanGoBack, useRouter } from '@tanstack/react-router'
import { ChevronLeftIcon, ShoppingCartIcon } from 'lucide-react'
import { ErrorState } from '@pattern/error-state'
import { CartLine } from '@features/cart/cart-line'
import { CartSummary } from '@features/cart/cart-summary'
import { useCart, useQuote } from '@features/cart/hooks'
import { RelatedCarousel } from '@features/nft/related-carousel'
import { buttonVariants } from '@ui/button'
import { Skeleton } from '@ui/skeleton'

const MobileTopBar = () => {
  const router = useRouter()
  const canGoBack = useCanGoBack()
  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        aria-label="Voltar"
        onClick={() => {
          if (canGoBack) router.history.back()
          else void router.navigate({ to: '/' })
        }}
        className="flex size-10 items-center justify-center rounded-full border border-primary/40 md:hidden"
      >
        <ChevronLeftIcon className="size-5" />
      </button>
      <h1 className="text-lg font-bold md:sr-only">Carrinho de NFTs</h1>
    </div>
  )
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
        Carrinho
      </li>
    </ol>
  </nav>
)

const CartSkeleton = () => (
  <div role="status" aria-label="Carregando carrinho" className="grid gap-8 md:grid-cols-[minmax(0,1fr)_17.5rem] lg:grid-cols-[minmax(0,1fr)_20rem]">
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((row) => (
        <Skeleton key={row} className="h-24 rounded-2xl md:h-16 md:rounded-none" />
      ))}
    </div>
    <div className="flex flex-col gap-4">
      <Skeleton className="h-10" />
      <Skeleton className="h-28" />
      <Skeleton className="h-10" />
    </div>
  </div>
)

const EmptyCart = () => (
  <div className="flex flex-col items-center gap-3 rounded-md bg-card px-6 py-16 text-center">
    <ShoppingCartIcon aria-hidden="true" className="size-10 text-primary" />
    <p className="text-lg font-semibold">Seu carrinho está vazio</p>
    <p className="max-w-sm text-[0.8125rem] text-muted-foreground">Explore o mercado e adicione os NFTs que você quer colecionar.</p>
    <Link to="/" hash="catalogo" className={buttonVariants()}>
      Explorar o mercado
    </Link>
  </div>
)

export const CartPage = () => {
  const cart = useCart()
  const quote = useQuote(cart.data)
  const issues = quote.data?.issues ?? []

  const content = () => {
    if (cart.isPending) return <CartSkeleton />
    if (cart.isError) {
      return (
        <ErrorState
          error={cart.error}
          retrying={cart.isFetching}
          onRetry={() => {
            void cart.refetch()
          }}
        />
      )
    }
    if (cart.data.lines.length === 0) return <EmptyCart />
    return (
      <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_17.5rem] md:items-start lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
        <section aria-labelledby="itens-titulo" className="flex flex-col gap-3">
          <h2 id="itens-titulo" className="sr-only">
            Itens do carrinho
          </h2>
          <div
            aria-hidden="true"
            className="hidden grid-cols-[minmax(0,2.4fr)_1fr_1fr_1fr_2.5rem] border-b border-border px-3 pb-2 text-[0.8125rem] font-semibold md:grid"
          >
            <span>NFTs</span>
            <span>Preço</span>
            <span>Edições</span>
            <span>Total</span>
          </div>
          <ul className="flex flex-col gap-3 md:gap-2">
            {cart.data.lines.map((line) => (
              <CartLine key={line.id} line={line} issues={issues.filter((issue) => issue.lineId === line.id)} />
            ))}
          </ul>
        </section>
        <CartSummary
          cart={cart.data}
          className="sticky bottom-0 z-30 -mx-4 rounded-t-3xl bg-card px-4 pt-5 pb-[calc(1rem+env(safe-area-inset-bottom))] md:static md:mx-0 md:rounded-none md:bg-transparent md:p-0"
        />
      </div>
    )
  }

  const firstLine = cart.data?.lines[0]

  return (
    <div className="mx-auto flex w-full max-w-shop flex-col gap-6 px-4 pt-6 md:gap-4 md:px-6 md:pt-4">
      <MobileTopBar />
      <Breadcrumb />
      {content()}
      {firstLine && (
        <div className="mt-16 hidden md:block">
          <RelatedCarousel nftId={firstLine.nftId} title="Colecionadores também viram" />
        </div>
      )}
    </div>
  )
}
