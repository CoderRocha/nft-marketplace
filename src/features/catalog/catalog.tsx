import { useQuery } from '@tanstack/react-query'
import { SlidersHorizontalIcon, XIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { NftSummary } from '@contracts/nft'
import { CATALOG_PAGE_SIZE } from '@core/constants'
import { nftListQuery } from '@core/queries'
import { ErrorState } from '@pattern/error-state'
import { CatalogFilters } from '@features/catalog/catalog-filters'
import { CatalogPagination } from '@features/catalog/catalog-pagination'
import { CatalogToolbar } from '@features/catalog/catalog-toolbar'
import { FeaturedOffer } from '@features/catalog/featured-offer'
import { FiltersSheet } from '@features/catalog/filters-sheet'
import { toListParams } from '@features/catalog/list-params'
import { NftGrid, NftGridEmpty, NftGridSkeleton } from '@features/catalog/nft-grid'
import { catalogSearchDefaults, type CatalogSearch } from '@features/catalog/schemas'
import { Button } from '@ui/button'
import { Skeleton } from '@ui/skeleton'

type CatalogProps = {
  search: CatalogSearch
  onSearchChange: (next: Partial<CatalogSearch>, options?: { replace?: boolean }) => void
  renderActions?: (nft: NftSummary) => ReactNode
}

const scrollToCatalog = () => {
  document.getElementById('catalogo')?.scrollIntoView({ block: 'start' })
}

const resultsLabel = (total: number) => (total === 1 ? '1 NFT encontrado' : `${total} NFTs encontrados`)

export const Catalog = ({ search, onSearchChange, renderActions }: CatalogProps) => {
  const list = useQuery(nftListQuery(toListParams(search)))
  const facets = list.data?.facets
  const pageCount = list.data ? Math.ceil(list.data.total / list.data.pageSize) : 0

  const content = () => {
    if (list.isPending) return <NftGridSkeleton count={CATALOG_PAGE_SIZE} />
    if (list.isError) {
      return (
        <ErrorState
          error={list.error}
          retrying={list.isFetching}
          onRetry={() => {
            void list.refetch()
          }}
        />
      )
    }
    if (list.data.items.length === 0) {
      return (
        <NftGridEmpty
          onClear={() => {
            onSearchChange(catalogSearchDefaults)
          }}
        />
      )
    }
    return <NftGrid items={list.data.items} updating={list.isPlaceholderData && list.isFetching} renderActions={renderActions} />
  }

  return (
    <section id="catalogo" aria-labelledby="catalogo-titulo" className="scroll-mt-6">
      <h2 id="catalogo-titulo" className="sr-only">
        Catálogo de NFTs
      </h2>
      <div className="lg:grid lg:grid-cols-[17.5rem_minmax(0,1fr)] lg:items-start lg:gap-8">
        <aside aria-label="Filtros" className="hidden flex-col gap-8 lg:flex">
          <CatalogFilters search={search} facets={facets} onChange={onSearchChange} className="bg-card p-4" />
          <FeaturedOffer />
        </aside>
        <div className="flex flex-col gap-6">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <CatalogToolbar search={search} onChange={onSearchChange} />
            </div>
            <FiltersSheet
              search={search}
              facets={facets}
              total={list.data?.total}
              onChange={onSearchChange}
              trigger={
                <Button variant="outline" size="sm" className="hidden h-8 md:inline-flex lg:hidden">
                  <SlidersHorizontalIcon />
                  Filtros
                </Button>
              }
            />
          </div>
          {search.q && (
            <p className="flex items-center gap-2 text-[0.8125rem]">
              Resultados para <strong className="text-primary">“{search.q}”</strong>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Limpar busca"
                onClick={() => {
                  onSearchChange({ q: '' })
                }}
              >
                <XIcon />
              </Button>
            </p>
          )}
          <p aria-live="polite" className="sr-only">
            {list.data && !list.isPlaceholderData ? resultsLabel(list.data.total) : ''}
          </p>
          {content()}
          {list.data ? (
            <CatalogPagination
              page={search.pagina}
              pageCount={pageCount}
              onPageChange={(page) => {
                onSearchChange({ pagina: page })
                scrollToCatalog()
              }}
            />
          ) : (
            <Skeleton className="ml-auto h-7 w-40" />
          )}
        </div>
      </div>
    </section>
  )
}
