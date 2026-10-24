import { favoriteChangeSchema, favoritesSchema } from '@contracts/favorites'
import { request } from '@core/http'

const favoritePath = (nftId: string) => `/me/favorites/${encodeURIComponent(nftId)}`

export const fetchFavorites = (signal?: AbortSignal) => request('GET', '/me/favorites', { schema: favoritesSchema, signal })

export const setFavorite = (nftId: string, favorite: boolean) =>
  request(favorite ? 'PUT' : 'DELETE', favoritePath(nftId), { schema: favoriteChangeSchema })
