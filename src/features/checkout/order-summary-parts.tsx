import { cn } from 'cn'
import type { NftImage } from '@contracts/nft'
import { formatEth, formatEthLabel } from '@core/money'

export type SummaryItem = {
  key: string
  name: string
  tokenId: string
  editionLabel: string
  quantity: number
  lineTotal: string
  image: NftImage
}

type ItemsListProps = {
  items: SummaryItem[]
  showEditionColumn?: boolean
  className?: string
}

export const ItemsList = ({ items, showEditionColumn = false, className }: ItemsListProps) => (
  <div className={cn('flex flex-col gap-2', className)}>
    <div
      aria-hidden="true"
      className={cn(
        'grid border-b border-border pb-2 text-[0.8125rem] font-semibold',
        showEditionColumn ? 'grid-cols-[minmax(0,1fr)_4.5rem_6rem]' : 'grid-cols-[minmax(0,1fr)_auto]',
      )}
    >
      <span>NFTs</span>
      {showEditionColumn && <span className="text-center">Edições</span>}
      <span className="text-right">Subtotal</span>
    </div>
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li
          key={item.key}
          className={cn(
            'grid items-center gap-3 bg-card p-2',
            showEditionColumn ? 'grid-cols-[minmax(0,1fr)_4.5rem_6rem] bg-transparent px-0' : 'grid-cols-[minmax(0,1fr)_auto]',
          )}
        >
          <div className="flex min-w-0 items-center gap-3">
            <img
              src={item.image.src}
              srcSet={item.image.srcSet}
              sizes="3.5rem"
              alt=""
              width={320}
              height={320}
              loading="lazy"
              className="size-13 shrink-0 rounded-md object-cover"
            />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold">{item.name}</span>
              <span className="text-xs text-muted-foreground">
                ID do token: {item.tokenId} · Edição {item.editionLabel}
              </span>
            </div>
            {!showEditionColumn && <span className="shrink-0 text-xs text-muted-foreground">(x {item.quantity})</span>}
          </div>
          {showEditionColumn && <span className="text-center text-xs text-muted-foreground">(x {item.quantity})</span>}
          <span className="text-right text-base font-bold text-primary">
            <span className="sr-only">Subtotal: </span>
            {formatEthLabel(item.lineTotal)}
          </span>
        </li>
      ))}
    </ul>
  </div>
)

type TotalsListProps = {
  subtotal?: string
  discount?: string
  networkFee: string
  total: string
  className?: string
}

export const TotalsList = ({ subtotal, discount, networkFee, total, className }: TotalsListProps) => (
  <dl className={cn('flex flex-col gap-2 text-[0.8125rem]', className)}>
    {subtotal !== undefined && (
      <div className="flex justify-between gap-3">
        <dt>Subtotal</dt>
        <dd className="tabular-nums">{formatEthLabel(subtotal)}</dd>
      </div>
    )}
    {discount !== undefined && (
      <div className="flex justify-between gap-3">
        <dt>Desconto do lançamento</dt>
        <dd className="tabular-nums">(-) {formatEth(discount)}</dd>
      </div>
    )}
    <div className="flex justify-between gap-3">
      <dt>Taxa de rede</dt>
      <dd className="tabular-nums">{formatEthLabel(networkFee)}</dd>
    </div>
    <div className="flex justify-between gap-3 border-t border-border pt-2 text-base font-bold">
      <dt>Total</dt>
      <dd className="text-primary tabular-nums">{formatEthLabel(total)}</dd>
    </div>
  </dl>
)
