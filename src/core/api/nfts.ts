import {
  nftDetailSchema,
  nftHighlightsSchema,
  nftListSchema,
  nftPageSchema,
  type NftListParams,
} from '@contracts/nft'
import { request } from '@core/http'

const nftPath = (id: string) => `/nfts/${encodeURIComponent(id)}`

export const fetchNfts = (params: NftListParams, signal?: AbortSignal) =>
  request('GET', '/nfts', { schema: nftPageSchema, params, signal })

export const fetchNftHighlights = (signal?: AbortSignal) =>
  request('GET', '/nfts/highlights', { schema: nftHighlightsSchema, signal })

export const fetchNft = (id: string, signal?: AbortSignal) => request('GET', nftPath(id), { schema: nftDetailSchema, signal })

export const fetchRelatedNfts = (id: string, signal?: AbortSignal) =>
  request('GET', `${nftPath(id)}/related`, { schema: nftListSchema, signal })
