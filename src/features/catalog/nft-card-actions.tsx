import { Link } from '@tanstack/react-router'
import { EyeIcon } from 'lucide-react'
import type { NftSummary } from '@contracts/nft'
import { CardCartButton } from '@features/cart/add-to-cart'
import { FavoriteButton } from '@features/favorites/favorite-button'

export const NftCardActions = ({ nft }: { nft: NftSummary }) => (
  <>
    <FavoriteButton nft={nft} variant="overlay" className="absolute top-4 right-4 md:hidden" />
    <div className="absolute inset-x-0 bottom-5 hidden justify-center gap-2 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 md:flex">
      <CardCartButton nft={nft} />
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
