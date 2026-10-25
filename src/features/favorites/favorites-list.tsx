import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { HeartIcon } from 'lucide-react'
import { favoritesQuery } from '@core/queries'
import { ErrorState } from '@pattern/error-state'
import { NftCard } from '@features/catalog/nft-card'
import { NftCardActions } from '@features/catalog/nft-card-actions'
import { NftGridSkeleton } from '@features/catalog/nft-grid'
import { buttonVariants } from '@ui/button'

export const FavoritesList = ({ userId }: { userId: string }) => {
  const favorites = useQuery(favoritesQuery(userId))
  return (
    <section aria-labelledby="favoritos-titulo" className="flex flex-col gap-6">
      <h1 id="favoritos-titulo" className="text-[0.9375rem] font-semibold">
        Lista de interesse
      </h1>
      {favorites.isPending && <NftGridSkeleton count={3} />}
      {favorites.isLoadingError && (
        <ErrorState
          error={favorites.error}
          retrying={favorites.isFetching}
          onRetry={() => {
            void favorites.refetch()
          }}
        />
      )}
      {favorites.data?.items.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-md bg-card px-6 py-12 text-center">
          <HeartIcon aria-hidden="true" className="size-8 text-primary" />
          <p className="text-base font-semibold">Sua lista de interesse está vazia</p>
          <p className="max-w-sm text-[0.8125rem] text-muted-foreground">Toque no coração de um NFT para guardar aqui.</p>
          <Link to="/" hash="catalogo" className={buttonVariants({ variant: 'outline' })}>
            Explorar o mercado
          </Link>
        </div>
      )}
      {favorites.data && favorites.data.items.length > 0 && (
        <ul className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 md:gap-x-6">
          {favorites.data.items.map((nft) => (
            <li key={nft.id}>
              <NftCard nft={nft} actions={<NftCardActions nft={nft} />} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
