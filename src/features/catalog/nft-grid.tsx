import { cn } from 'cn'
import { SearchXIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { NftSummary } from '@contracts/nft'
import { NftCard, NftCardSkeleton } from '@features/catalog/nft-card'
import { Button } from '@ui/button'

const gridClassName = 'grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 md:gap-x-6 max-md:[&>*:nth-child(even)]:mt-8'

type NftGridProps = {
  items: NftSummary[]
  updating: boolean
  renderActions?: (nft: NftSummary) => ReactNode
}

export const NftGrid = ({ items, updating, renderActions }: NftGridProps) => (
  <ul aria-busy={updating} className={cn(gridClassName, 'transition-opacity', updating && 'opacity-60')}>
    {items.map((nft) => (
      <li key={nft.id}>
        <NftCard nft={nft} actions={renderActions?.(nft)} />
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

export const NftGridEmpty = ({ onClear }: { onClear: () => void }) => (
  <div className="flex flex-col items-center gap-3 rounded-md bg-card px-6 py-12 text-center">
    <SearchXIcon aria-hidden="true" className="size-8 text-primary" />
    <p className="text-base font-semibold">Nenhum NFT encontrado</p>
    <p className="max-w-sm text-[0.8125rem] text-muted-foreground">Tente outra busca ou remova alguns filtros para ver mais resultados.</p>
    <Button variant="outline" onClick={onClear}>
      Limpar filtros
    </Button>
  </div>
)
