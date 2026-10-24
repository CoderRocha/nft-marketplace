import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import type { NftListParams } from '@contracts/nft'
import { fetchMockState } from '@core/api/mocks'
import { fetchNft, fetchNftHighlights, fetchNfts, fetchRelatedNfts } from '@core/api/nfts'
import { keys } from '@core/keys'

export const mockStateQuery = () =>
  queryOptions({
    queryKey: keys.mocks.state.queryKey,
    queryFn: ({ signal }) => fetchMockState(signal),
    staleTime: 0,
  })

export const nftListQuery = (params: NftListParams) =>
  queryOptions({
    queryKey: keys.nfts.list(params).queryKey,
    queryFn: ({ signal }) => fetchNfts(params, signal),
    placeholderData: keepPreviousData,
  })

export const nftHighlightsQuery = () =>
  queryOptions({
    queryKey: keys.nfts.highlights.queryKey,
    queryFn: ({ signal }) => fetchNftHighlights(signal),
  })

export const nftDetailQuery = (id: string) =>
  queryOptions({
    queryKey: keys.nfts.detail(id).queryKey,
    queryFn: ({ signal }) => fetchNft(id, signal),
  })

export const relatedNftsQuery = (id: string) =>
  queryOptions({
    queryKey: keys.nfts.related(id).queryKey,
    queryFn: ({ signal }) => fetchRelatedNfts(id, signal),
  })
