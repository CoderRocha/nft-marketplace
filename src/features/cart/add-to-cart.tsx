import { ShoppingCartIcon } from 'lucide-react'
import type { NftSummary } from '@contracts/nft'
import { useAddToCart } from '@features/cart/hooks'
import type { PurchaseLayout, PurchaseSelection } from '@features/nft/nft-purchase-panel'
import { Button } from '@ui/button'

type BuyActionsProps = {
  selection: PurchaseSelection
  layout: PurchaseLayout
}

export const BuyActions = ({ selection, layout }: BuyActionsProps) => {
  const { run, pending } = useAddToCart()
  const disabled = selection.unavailable || pending
  const add = (goToCart: boolean) => {
    run(
      { nftId: selection.nft.id, editionId: selection.edition.id, quantity: selection.quantity },
      { name: selection.nft.name, goToCart },
    )
  }

  if (layout === 'inline') {
    return (
      <Button
        disabled={disabled}
        onClick={() => {
          add(true)
        }}
        className="h-9 px-6 uppercase"
      >
        Comprar
      </Button>
    )
  }

  return (
    <>
      <Button
        size="lg"
        disabled={disabled}
        onClick={() => {
          add(true)
        }}
        className="h-14 flex-1 rounded-full bg-linear-to-r from-primary to-primary-deep text-base"
      >
        Comprar NFT
      </Button>
      <Button
        size="icon-lg"
        variant="outline"
        aria-label={`Adicionar ${selection.nft.name} ao carrinho`}
        disabled={disabled}
        onClick={() => {
          add(false)
        }}
        className="size-14 rounded-full border-border bg-background text-primary"
      >
        <ShoppingCartIcon className="size-5" />
      </Button>
    </>
  )
}

export const CardCartButton = ({ nft }: { nft: NftSummary }) => {
  const { run, pending } = useAddToCart()
  return (
    <button
      type="button"
      aria-label={nft.soldOut ? `${nft.name} está esgotado` : `Adicionar ${nft.name} ao carrinho`}
      disabled={nft.soldOut || pending}
      onClick={() => {
        run({ nftId: nft.id, editionId: nft.defaultEditionId, quantity: 1 }, { name: nft.name, goToCart: false })
      }}
      className="relative z-10 flex size-8 items-center justify-center rounded-md bg-card/90 hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
    >
      <ShoppingCartIcon className="size-4" />
    </button>
  )
}
