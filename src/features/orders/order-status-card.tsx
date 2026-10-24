import { Link } from '@tanstack/react-router'
import { CircleXIcon, LoaderCircleIcon, MailCheckIcon, SearchXIcon, ShieldAlertIcon, XIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Order } from '@contracts/order'
import { WALLET_PROVIDERS } from '@contracts/wallet'
import { hasErrorCode } from '@core/http'
import { formatEthLabel } from '@core/money'
import { ErrorState } from '@pattern/error-state'
import { ItemsList, TotalsList } from '@features/checkout/order-summary-parts'
import { networkLabel, shortAddress } from '@features/checkout/wallet-pickers'
import { ExplorerDialog } from '@features/orders/explorer-dialog'
import { useOrder } from '@features/orders/hooks'
import { buttonVariants } from '@ui/button'
import { Skeleton } from '@ui/skeleton'

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

const providerLabel = (provider: string) => WALLET_PROVIDERS.find((candidate) => candidate.id === provider)?.label ?? provider

const CardFrame = ({ children, label }: { children: ReactNode; label: string }) => (
  <article
    aria-label={label}
    className="relative flex w-full max-w-lg flex-col gap-6 border-b-8 border-primary bg-card px-5 pt-10 pb-8 sm:px-9"
  >
    <Link to="/" aria-label="Fechar e voltar ao início" className="absolute top-4 right-4 rounded-md p-1 text-primary hover:text-foreground">
      <XIcon className="size-5" />
    </Link>
    {children}
  </article>
)

const Receipt = ({ order }: { order: Order }) => (
  <CardFrame label="Recibo do pedido">
    <header className="flex flex-col items-center gap-3 text-center">
      <MailCheckIcon aria-hidden="true" className="size-14 text-primary" strokeWidth={1.25} />
      <h1 className="text-base font-semibold">Seus NFTs agora estão na sua carteira</h1>
    </header>
    <dl className="-mx-5 grid grid-cols-2 gap-3 border-y border-primary/60 px-5 py-3 text-xs sm:-mx-9 sm:grid-cols-4 sm:px-9">
      <div className="flex flex-col">
        <dt className="font-semibold">ID da transação</dt>
        <dd>
          <abbr title={order.transaction?.hash} className="no-underline">
            {order.transaction ? shortAddress(order.transaction.hash) : '-'}
          </abbr>
        </dd>
      </div>
      <div className="flex flex-col">
        <dt className="font-semibold">Data</dt>
        <dd>
          <time dateTime={order.transaction?.confirmedAt ?? order.updatedAt}>
            {dateFormatter.format(new Date(order.transaction?.confirmedAt ?? order.updatedAt))}
          </time>
        </dd>
      </div>
      <div className="flex flex-col">
        <dt className="font-semibold">Total</dt>
        <dd>{formatEthLabel(order.total)}</dd>
      </div>
      <div className="flex flex-col">
        <dt className="font-semibold">Carteira</dt>
        <dd>{providerLabel(order.wallet.provider)}</dd>
      </div>
    </dl>
    <section aria-labelledby="detalhes-transacao" className="flex flex-col gap-3">
      <h2 id="detalhes-transacao" className="text-[0.8125rem] font-semibold">
        Detalhes da transação
      </h2>
      <ItemsList
        showEditionColumn
        items={order.lines.map((line) => ({
          key: `${line.nftId}-${line.editionId}`,
          name: line.name,
          tokenId: line.tokenId,
          editionLabel: line.editionLabel,
          quantity: line.quantity,
          lineTotal: line.lineTotal,
          image: line.image,
        }))}
      />
      <TotalsList
        discount={order.coupon ? order.discount : undefined}
        networkFee={order.networkFee}
        total={order.total}
        className="sm:ml-auto sm:w-3/4"
      />
    </section>
    <p className="text-center text-xs leading-relaxed text-muted-foreground">
      Transação confirmada na {networkLabel(order.wallet.network)}. A propriedade foi transferida para sua carteira conectada (
      {shortAddress(order.wallet.address)}) e registrada na rede.
    </p>
    {order.transaction && <ExplorerDialog hash={order.transaction.hash} />}
  </CardFrame>
)

const Pending = ({ order }: { order: Order }) => (
  <CardFrame label="Pedido em processamento">
    <div role="status" className="flex flex-col items-center gap-3 text-center">
      <LoaderCircleIcon aria-hidden="true" className="size-12 animate-spin text-primary motion-reduce:animate-none" />
      <h1 className="text-base font-semibold">Aguardando confirmação na rede</h1>
      <p className="text-[0.8125rem] text-muted-foreground">
        Seu pagamento de {formatEthLabel(order.total)} foi enviado. Isso costuma levar alguns segundos. Você pode recarregar a página
        sem criar uma nova compra.
      </p>
      <p className="text-xs text-muted-foreground">Pedido {order.id}</p>
    </div>
  </CardFrame>
)

const Declined = ({ order }: { order: Order }) => (
  <CardFrame label="Pagamento recusado">
    <div role="alert" className="flex flex-col items-center gap-3 text-center">
      <CircleXIcon aria-hidden="true" className="size-12 text-destructive" />
      <h1 className="text-base font-semibold">Pagamento recusado</h1>
      <p className="text-[0.8125rem] text-muted-foreground">{order.failureReason}</p>
    </div>
    <div className="flex flex-wrap justify-center gap-3">
      <Link to="/checkout" className={buttonVariants()}>
        Tentar novamente
      </Link>
      <Link to="/cart" className={buttonVariants({ variant: 'outline' })}>
        Ver carrinho
      </Link>
    </div>
  </CardFrame>
)

const Problem = ({ icon, title, detail }: { icon: ReactNode; title: string; detail: string }) => (
  <CardFrame label={title}>
    <div className="flex flex-col items-center gap-3 text-center">
      {icon}
      <h1 className="text-base font-semibold">{title}</h1>
      <p className="text-[0.8125rem] text-muted-foreground">{detail}</p>
      <Link to="/" className={buttonVariants({ variant: 'outline' })}>
        Voltar ao início
      </Link>
    </div>
  </CardFrame>
)

export const OrderStatusCard = ({ userId, orderId }: { userId: string; orderId: string }) => {
  const order = useOrder(userId, orderId)
  if (hasErrorCode(order.error, 'forbidden')) {
    return (
      <Problem
        icon={<ShieldAlertIcon aria-hidden="true" className="size-12 text-destructive" />}
        title="Pedido de outra conta"
        detail="Você não tem acesso a este pedido."
      />
    )
  }
  if (hasErrorCode(order.error, 'not_found')) {
    return (
      <Problem
        icon={<SearchXIcon aria-hidden="true" className="size-12 text-primary" />}
        title="Pedido não encontrado"
        detail="Confira o endereço ou volte ao início."
      />
    )
  }
  if (order.isError) {
    return (
      <ErrorState
        error={order.error}
        retrying={order.isFetching}
        onRetry={() => {
          void order.refetch()
        }}
        className="w-full max-w-lg"
      />
    )
  }
  if (order.isPending) return <Skeleton role="status" aria-label="Carregando pedido" className="h-96 w-full max-w-lg" />
  if (order.data.status === 'confirmed') return <Receipt order={order.data} />
  if (order.data.status === 'declined') return <Declined order={order.data} />
  return <Pending order={order.data} />
}
