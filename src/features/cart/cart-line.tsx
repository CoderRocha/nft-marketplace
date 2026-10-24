import { Link } from '@tanstack/react-router'
import { TrashIcon, TriangleAlertIcon } from 'lucide-react'
import type { CartLine as CartLineData } from '@contracts/cart'
import { MAX_QUANTITY_PER_ORDER } from '@contracts/nft'
import type { QuoteIssue } from '@contracts/quote'
import { formatEthLabel, multiplyEth } from '@core/money'
import { QuantityStepper } from '@pattern/quantity-stepper'
import { useAcceptPrice, useRemoveCartLine, useUpdateCartQuantity } from '@features/cart/hooks'
import { Button } from '@ui/button'

type CartLineProps = {
  line: CartLineData
  issues: QuoteIssue[]
}

const LineIssues = ({ line, issues }: CartLineProps) => {
  const acceptPrice = useAcceptPrice()
  const remove = useRemoveCartLine()
  if (issues.length === 0) return null
  return (
    <ul className="col-span-full flex flex-col gap-2">
      {issues.map((issue) => (
        <li key={issue.kind} role="status" className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md bg-warning/10 px-3 py-2 text-xs text-warning">
          <TriangleAlertIcon aria-hidden="true" className="size-4 shrink-0" />
          <span className="flex-1">{issue.message}</span>
          {issue.kind === 'price_changed' && (
            <Button
              size="xs"
              variant="outline"
              disabled={acceptPrice.isPending}
              onClick={() => {
                acceptPrice.mutate(line.id)
              }}
            >
              Aceitar novo preço
            </Button>
          )}
          {issue.kind === 'sold_out' && (
            <Button
              size="xs"
              variant="outline"
              disabled={remove.isPending}
              onClick={() => {
                remove.mutate({ lineId: line.id, name: line.nft.name })
              }}
            >
              Remover
            </Button>
          )}
        </li>
      ))}
    </ul>
  )
}

export const CartLine = ({ line, issues }: CartLineProps) => {
  const updateQuantity = useUpdateCartQuantity()
  const remove = useRemoveCartLine()
  const max = Math.min(line.edition.available, MAX_QUANTITY_PER_ORDER)
  const lineTotal = multiplyEth(line.edition.price, line.quantity)
  const onQuantityChange = (quantity: number) => {
    updateQuantity.mutate({ lineId: line.id, quantity })
  }
  const removeButton = (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={`Remover ${line.nft.name} do carrinho`}
      disabled={remove.isPending}
      onClick={() => {
        remove.mutate({ lineId: line.id, name: line.nft.name })
      }}
      className="text-foreground hover:text-destructive"
    >
      <TrashIcon />
    </Button>
  )

  return (
    <li className="grid grid-cols-[5.75rem_minmax(0,1fr)_auto] gap-x-3 gap-y-3 rounded-2xl bg-card p-2 md:grid-cols-[minmax(0,2.4fr)_1fr_1fr_1fr_2.5rem] md:items-center md:rounded-none md:px-3 md:py-2">
      <div className="contents md:flex md:items-center md:gap-3">
        <img
          src={line.nft.image.src}
          srcSet={line.nft.image.srcSet}
          sizes="5.75rem"
          alt=""
          width={320}
          height={320}
          loading="lazy"
          className="row-span-2 aspect-square w-full rounded-xl object-cover md:row-span-1 md:size-13 md:rounded-sm"
        />
        <div className="row-span-2 flex min-w-0 flex-col gap-1 self-start pt-1 md:row-span-1 md:self-auto md:pt-0">
          <Link to="/nfts/$nftId" params={{ nftId: line.nftId }} className="line-clamp-2 text-sm font-semibold hover:text-primary md:truncate">
            {line.nft.name}
          </Link>
          <span className="text-xs text-muted-foreground">
            <span className="hidden md:inline">ID do token: {line.nft.tokenId} · </span>Edição: {line.edition.label}
          </span>
          <span className="text-base font-bold text-primary md:hidden">{formatEthLabel(lineTotal)}</span>
        </div>
      </div>
      <p className="hidden text-sm font-semibold md:block">
        <span className="sr-only">Preço unitário: </span>
        {formatEthLabel(line.edition.price)}
      </p>
      <div className="col-start-3 row-start-2 flex items-end justify-end md:col-start-auto md:row-start-auto md:block">
        <QuantityStepper
          label={`Quantidade de ${line.nft.name}`}
          value={line.quantity}
          max={max}
          appearance="filled"
          className="hidden md:inline-flex"
          onChange={onQuantityChange}
        />
        <QuantityStepper
          label={`Quantidade de ${line.nft.name}`}
          value={line.quantity}
          max={max}
          appearance="ghost"
          className="md:hidden"
          onChange={onQuantityChange}
        />
      </div>
      <p className="hidden text-sm font-bold text-primary md:block">
        <span className="sr-only">Total do item: </span>
        {formatEthLabel(lineTotal)}
      </p>
      <div className="col-start-3 row-start-1 flex justify-end md:col-start-auto md:row-start-auto">{removeButton}</div>
      <LineIssues line={line} issues={issues} />
    </li>
  )
}
