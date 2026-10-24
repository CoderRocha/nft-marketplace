import { Link } from '@tanstack/react-router'
import { cn } from 'cn'
import type { Cart } from '@contracts/cart'
import { formatEth, formatEthLabel } from '@core/money'
import { ErrorState } from '@pattern/error-state'
import { CouponForm } from '@features/cart/coupon-form'
import { useQuote } from '@features/cart/hooks'
import { buttonVariants } from '@ui/button'
import { Skeleton } from '@ui/skeleton'

type CartSummaryProps = {
  cart: Cart
  className?: string
}

const SummaryRow = ({ label, value, emphasis = false }: { label: string; value: string | undefined; emphasis?: boolean }) => (
  <div className={cn('flex items-center justify-between gap-3', emphasis ? 'text-base font-bold' : 'text-[0.8125rem]')}>
    <dt>{label}</dt>
    <dd className={cn('tabular-nums', emphasis && 'text-primary')}>{value ?? <Skeleton className="h-4 w-20" />}</dd>
  </div>
)

export const CartSummary = ({ cart, className }: CartSummaryProps) => {
  const quote = useQuote(cart)
  const data = quote.data
  const blocked = !data || data.issues.length > 0 || quote.isFetching
  return (
    <section aria-labelledby="resumo-titulo" aria-busy={quote.isFetching} className={cn('flex flex-col gap-5', className)}>
      <h2 id="resumo-titulo" className="hidden border-b border-border pb-3 text-base font-semibold md:block">
        Resumo do pedido
      </h2>
      <div className="flex flex-col gap-2">
        <span className="hidden text-[0.8125rem] font-semibold md:block">Código promocional</span>
        <CouponForm appliedCode={cart.couponCode} appliedPercent={data?.coupon?.percent} />
      </div>
      {quote.isError ? (
        <ErrorState
          error={quote.error}
          retrying={quote.isFetching}
          onRetry={() => {
            void quote.refetch()
          }}
          className="py-6"
        />
      ) : (
        <dl className="flex flex-col gap-3">
          <SummaryRow label="Subtotal" value={data && formatEthLabel(data.subtotal)} />
          <SummaryRow label="Desconto do lançamento" value={data && `(-) ${formatEth(data.discount)}`} />
          <div className="flex flex-col gap-1">
            <SummaryRow label="Taxa de rede" value={data && formatEthLabel(data.networkFee)} />
            <p className="text-right text-[0.6875rem] text-primary">Taxa estimada</p>
          </div>
          <div className="border-t border-border pt-3">
            <SummaryRow label="Total" value={data && formatEthLabel(data.total)} emphasis />
          </div>
        </dl>
      )}
      <p aria-live="polite" className="sr-only">
        {data && !quote.isFetching ? `Total do pedido: ${formatEthLabel(data.total)}` : ''}
      </p>
      {data && data.issues.length > 0 && (
        <p role="status" className="text-xs text-warning">
          Revise os itens destacados antes de finalizar.
        </p>
      )}
      <Link
        to="/checkout"
        aria-disabled={blocked}
        onClick={(event) => {
          if (blocked) event.preventDefault()
        }}
        className={buttonVariants({
          size: 'lg',
          className: cn(
            'w-full rounded-full md:rounded-md md:h-10 md:text-sm max-md:bg-linear-to-r max-md:from-primary max-md:to-primary-deep',
            blocked && 'pointer-events-none opacity-60',
          ),
        })}
      >
        Conectar e finalizar
      </Link>
      <Link to="/" hash="catalogo" className="hidden text-center text-[0.8125rem] text-primary hover:underline md:block">
        Continuar explorando
      </Link>
    </section>
  )
}
