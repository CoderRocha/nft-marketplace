import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { nftDetailQuery, relatedNftsQuery } from '@core/queries'
import { NftDetail } from '@features/nft/nft-detail'
import { nftSearchDefaults, nftSearchSchema, type NftSearch } from '@features/nft/schemas'

const ignoreError = () => undefined

const NftRoute = () => {
  const { nftId } = Route.useParams()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  return (
    <NftDetail
      nftId={nftId}
      search={search}
      onSearchChange={(next: Partial<NftSearch>) => {
        void navigate({ search: (previous) => ({ ...previous, ...next }), replace: true, resetScroll: false })
      }}
    />
  )
}

export const Route = createFileRoute('/_shop/nfts/$nftId')({
  validateSearch: nftSearchSchema,
  search: { middlewares: [stripSearchParams(nftSearchDefaults)] },
  loader: ({ context, params }) => {
    context.queryClient.query(nftDetailQuery(params.nftId)).catch(ignoreError)
    context.queryClient.query(relatedNftsQuery(params.nftId)).catch(ignoreError)
  },
  component: NftRoute,
})
