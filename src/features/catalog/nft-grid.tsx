import { cn } from 'cn'
import { SearchXIcon } from 'lucide-react'
import type { NftSummary } from '@contracts/nft'
import { NftCard, NftCardSkeleton } from '@features/catalog/nft-card'
import { NftCardActions } from '@features/catalog/nft-card-actions'
import { Button } from '@ui/button'

const PRIORITY_CARDS = 1

const gridClassName = 'grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 md:gap-x-6 max-md:[&>*:nth-child(even)]:mt-8'

type NftGridProps = {
  items: NftSummary[]
  updating: boolean
}

export const NftGrid = ({ items, updating }: NftGridProps) => (
  <ul aria-busy={updating} className={cn(gridClassName, 'transition-opacity', updating && 'opacity-60')}>
    {items.map((nft, index) => (
      <li key={nft.id}>
        <NftCard nft={nft} priority={index < PRIORITY_CARDS} actions={<NftCardActions nft={nft} />} />
      </li>
    ))}
  </ul>
)

export const NftGridSkeleton = ({ count }: { count: number }) => (
  <div role="status" aria-label="Carregando NFTs" className={gridClassName}>
    {Array.from({ length: count }, (_, index) => (
      <NftCardSkeleton key={index} />
    ))}
  </div>
)

type NftGridEmptyProps = {
  onAction: () => void
  title?: string
  description?: string
  actionLabel?: string
}

export const NftGridEmpty = ({
  onAction,
  title = 'Nenhum NFT encontrado',
  description = 'Tente outra busca ou remova alguns filtros para ver mais resultados.',
  actionLabel = 'Limpar filtros',
}: NftGridEmptyProps) => (
  <div className="flex flex-col items-center gap-3 rounded-md bg-card px-6 py-12 text-center">
    <SearchXIcon aria-hidden="true" className="size-8 text-primary" />
    <p className="text-base font-semibold">{title}</p>
    <p className="max-w-sm text-[0.8125rem] text-muted-foreground">{description}</p>
    <Button variant="outline" onClick={onAction}>
      {actionLabel}
    </Button>
  </div>
)
