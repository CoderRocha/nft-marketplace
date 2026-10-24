import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { nftHighlightsQuery, nftListQuery } from '@core/queries'
import { Catalog } from '@features/catalog/catalog'
import { HeroCarousel } from '@features/catalog/hero-carousel'
import { toListParams } from '@features/catalog/list-params'
import { MobileCatalogBar } from '@features/catalog/mobile-catalog-bar'
import { PromoBanners } from '@features/catalog/promo-banners'
import { catalogSearchDefaults, catalogSearchSchema, type CatalogSearch } from '@features/catalog/schemas'

const ignoreError = () => undefined

const HomeRoute = () => {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const onSearchChange = (next: Partial<CatalogSearch>, options: { replace?: boolean } = {}) => {
    void navigate({
      search: (previous) => ({ ...previous, ...next, pagina: next.pagina ?? 1 }),
      replace: options.replace,
      resetScroll: false,
    })
  }

  return (
    <div className="mx-auto flex w-full max-w-shop flex-col gap-8 px-4 pt-6 md:gap-16 md:px-6 md:pt-4">
      <MobileCatalogBar search={search} onSearchChange={onSearchChange} />
      <HeroCarousel />
      <Catalog search={search} onSearchChange={onSearchChange} />
      <PromoBanners />
    </div>
  )
}

export const Route = createFileRoute('/_shop/')({
  validateSearch: catalogSearchSchema,
  search: { middlewares: [stripSearchParams(catalogSearchDefaults)] },
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => {
    context.queryClient.query(nftListQuery(toListParams(deps))).catch(ignoreError)
    context.queryClient.query(nftHighlightsQuery()).catch(ignoreError)
  },
  component: HomeRoute,
})
