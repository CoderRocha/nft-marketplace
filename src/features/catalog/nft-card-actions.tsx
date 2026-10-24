import { Link } from '@tanstack/react-router'
import { EyeIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { NftSummary } from '@contracts/nft'
import { FavoriteButton } from '@features/favorites/favorite-button'

type NftCardActionsProps = {
  nft: NftSummary
  extra?: ReactNode
}

export const NftCardActions = ({ nft, extra }: NftCardActionsProps) => (
  <>
    <FavoriteButton nft={nft} variant="overlay" className="absolute top-4 right-4 md:hidden" />
    <div className="absolute inset-x-0 bottom-5 hidden justify-center gap-2 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 md:flex">
      {extra}
      <FavoriteButton nft={nft} variant="card" />
      <Link
        to="/nfts/$nftId"
        params={{ nftId: nft.id }}
        aria-label={`Ver detalhes de ${nft.name}`}
        className="relative z-10 flex size-8 items-center justify-center rounded-md bg-card/90 hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <EyeIcon className="size-4" />
      </Link>
    </div>
  </>
)
