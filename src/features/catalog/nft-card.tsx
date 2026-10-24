import { Link } from '@tanstack/react-router'
import { cn } from 'cn'
import type { ReactNode } from 'react'
import type { NftSummary } from '@contracts/nft'
import { formatEthLabel } from '@core/money'
import { Skeleton } from '@ui/skeleton'

type NftCardProps = {
  nft: NftSummary
  actions?: ReactNode
  sizes?: string
  priority?: boolean
  className?: string
}

export const NftCard = ({ nft, actions, sizes = '(min-width: 1024px) 18rem, 50vw', priority = false, className }: NftCardProps) => (
  <article className={cn('group relative flex flex-col gap-2', className)}>
    <div className="relative rounded-3xl bg-card p-2 md:rounded-none md:p-3">
      <img
        src={nft.image.src}
        srcSet={nft.image.srcSet}
        sizes={sizes}
        alt={nft.image.alt}
        width={640}
        height={640}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        className={cn('aspect-square w-full rounded-2xl object-cover md:rounded-xl', nft.soldOut && 'opacity-60 grayscale')}
      />
      {nft.rare && (
        <span className="absolute top-2 left-0 bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground md:top-3">RARO</span>
      )}
      {nft.soldOut && (
        <span className="absolute right-3 bottom-3 rounded-sm bg-background/90 px-2 py-1 text-xs font-semibold">Esgotado</span>
      )}
      {actions}
    </div>
    <h3 className="text-[0.8125rem] leading-tight">
      <Link to="/nfts/$nftId" params={{ nftId: nft.id }} className="after:absolute after:inset-0 hover:text-primary">
        {nft.name}
      </Link>
    </h3>
    <p className="flex flex-wrap items-baseline gap-x-2 text-sm font-bold text-primary">
      <span>
        <span className="sr-only">Preço: </span>
        {formatEthLabel(nft.price)}
      </span>
      {nft.compareAtPrice && (
        <span className="text-[0.8125rem] font-normal text-muted-foreground line-through">
          <span className="sr-only">Preço anterior: </span>
          {formatEthLabel(nft.compareAtPrice)}
        </span>
      )}
    </p>
  </article>
)

export const NftCardSkeleton = ({ className }: { className?: string }) => (
  <div className={cn('flex flex-col gap-2', className)}>
    <div className="rounded-3xl bg-card p-2 md:rounded-none md:p-3">
      <Skeleton className="aspect-square w-full rounded-2xl md:rounded-xl" />
    </div>
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-1/3" />
  </div>
)
