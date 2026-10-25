import { useQuery } from '@tanstack/react-query'
import { Link, useCanGoBack, useRouter } from '@tanstack/react-router'
import { ChevronLeftIcon, SearchXIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import * as v from 'valibot'
import { nftSummarySchema } from '@contracts/nft'
import { hasErrorCode } from '@core/http'
import { nftDetailQuery } from '@core/queries'
import { ErrorState } from '@pattern/error-state'
import { FavoriteButton } from '@features/favorites/favorite-button'
import { NftDetailsTabs } from '@features/nft/nft-details-tabs'
import { NftGallery } from '@features/nft/nft-gallery'
import { NftPurchasePanel, type PurchaseLayout, type PurchaseSelection } from '@features/nft/nft-purchase-panel'
import { RelatedCarousel } from '@features/nft/related-carousel'
import type { NftSearch } from '@features/nft/schemas'
import { buttonVariants } from '@ui/button'
import { Skeleton } from '@ui/skeleton'

type NftDetailProps = {
  nftId: string
  search: NftSearch
  onSearchChange: (next: Partial<NftSearch>) => void
  renderActions?: (selection: PurchaseSelection, layout: PurchaseLayout) => ReactNode
}

const Breadcrumb = ({ name }: { name?: string }) => (
  <nav aria-label="Trilha de navegação" className="hidden text-[0.8125rem] font-semibold md:block">
    <ol className="flex flex-wrap gap-1">
      <li>
        <Link to="/" className="hover:text-primary">
          Início
        </Link>
        <span aria-hidden="true"> /</span>
      </li>
      <li>
        <Link to="/" hash="catalogo" className="hover:text-primary">
          Mercado
        </Link>
        {name && <span aria-hidden="true"> /</span>}
      </li>
      {name && (
        <li aria-current="page" className="text-muted-foreground">
          {name}
        </li>
      )}
    </ol>
  </nav>
)

const BackButton = () => {
  const router = useRouter()
  const canGoBack = useCanGoBack()
  return (
    <button
      type="button"
      aria-label="Voltar"
      onClick={() => {
        if (canGoBack) router.history.back()
        else void router.navigate({ to: '/' })
      }}
      className="absolute top-4 left-4 z-10 flex size-10 items-center justify-center rounded-full border border-primary/40 bg-background/70 md:hidden"
    >
      <ChevronLeftIcon className="size-5" />
    </button>
  )
}

const NftDetailSkeleton = () => (
  <div role="status" aria-label="Carregando NFT" className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
    <div className="flex gap-4">
      <div className="hidden w-17 flex-col gap-3 md:flex">
        {[1, 2, 3, 4].map((thumb) => (
          <Skeleton key={thumb} className="aspect-square w-full" />
        ))}
      </div>
      <Skeleton className="aspect-square flex-1 rounded-none rounded-b-3xl md:rounded-2xl" />
    </div>
    <div className="flex flex-col gap-4 px-4 md:px-0">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-7 w-1/2" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-20 w-2/3" />
    </div>
  </div>
)

const NftNotFound = () => (
  <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
    <SearchXIcon aria-hidden="true" className="size-10 text-primary" />
    <h1 className="text-2xl font-bold">NFT não encontrado</h1>
    <p className="text-muted-foreground">Este NFT não existe ou foi removido do catálogo.</p>
    <Link to="/" hash="catalogo" className={buttonVariants()}>
      Explorar o mercado
    </Link>
  </div>
)

export const NftDetail = ({ nftId, search, onSearchChange, renderActions }: NftDetailProps) => {
  const detail = useQuery(nftDetailQuery(nftId))
  const summary = detail.data && v.parse(nftSummarySchema, detail.data)

  if (hasErrorCode(detail.error, 'not_found')) return <NftNotFound />

  return (
    <div className="mx-auto flex w-full max-w-shop flex-col gap-10 pb-44 md:gap-16 md:px-6 md:pt-6 md:pb-0">
      <div className="flex flex-col gap-4">
        <Breadcrumb name={detail.data?.name} />
        {detail.isPending && <NftDetailSkeleton />}
        {detail.isLoadingError && (
          <ErrorState
            error={detail.error}
            retrying={detail.isFetching}
            onRetry={() => {
              void detail.refetch()
            }}
            className="mx-4 md:mx-0"
          />
        )}
        {detail.data && (
          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-8">
            <div className="relative">
              <BackButton />
              <NftGallery
                name={detail.data.name}
                images={detail.data.gallery}
                overlay={summary && <FavoriteButton nft={summary} variant="overlay" className="absolute top-4 right-4 md:hidden" />}
              />
            </div>
            <div className="px-4 md:px-0">
              <NftPurchasePanel
                nft={detail.data}
                search={search}
                onSearchChange={onSearchChange}
                renderActions={(selection, layout) => (
                  <>
                    {renderActions?.(selection, layout)}
                    {layout === 'inline' && summary && <FavoriteButton nft={summary} variant="button" />}
                  </>
                )}
              />
            </div>
          </div>
        )}
      </div>
      {detail.data && (
        <div className="flex flex-col gap-16 px-4 md:px-0">
          <NftDetailsTabs nft={detail.data} />
          <RelatedCarousel nftId={nftId} title="Mais desta coleção" />
        </div>
      )}
    </div>
  )
}
