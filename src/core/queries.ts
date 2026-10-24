import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import type { Session } from '@contracts/auth'
import type { NftListParams } from '@contracts/nft'
import { fetchSession } from '@core/api/auth'
import { fetchFavorites } from '@core/api/favorites'
import { fetchMockState } from '@core/api/mocks'
import { fetchNft, fetchNftHighlights, fetchNfts, fetchRelatedNfts } from '@core/api/nfts'
import { fetchProfile } from '@core/api/profile'
import { fetchWallets } from '@core/api/wallets'
import { getSessionToken, setSessionToken } from '@core/credentials'
import { isFriendlyError } from '@core/http'
import { keys } from '@core/keys'

const readSession = async (signal: AbortSignal): Promise<Session | null> => {
  if (!getSessionToken()) return null
  try {
    return await fetchSession(signal)
  } catch (error) {
    if (!isFriendlyError(error) || error.status !== 401) throw error
    setSessionToken(null)
    return null
  }
}

export const sessionQuery = () =>
  queryOptions({
    queryKey: keys.session.current.queryKey,
    queryFn: ({ signal }) => readSession(signal),
    staleTime: Infinity,
  })

export const profileQuery = (userId: string) =>
  queryOptions({
    queryKey: keys.me.profile(userId).queryKey,
    queryFn: ({ signal }) => fetchProfile(signal),
  })

export const favoritesQuery = (userId: string) =>
  queryOptions({
    queryKey: keys.me.favorites(userId).queryKey,
    queryFn: ({ signal }) => fetchFavorites(signal),
  })

export const walletsQuery = (userId: string) =>
  queryOptions({
    queryKey: keys.me.wallets(userId).queryKey,
    queryFn: ({ signal }) => fetchWallets(signal),
  })

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
