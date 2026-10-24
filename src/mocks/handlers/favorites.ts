import { HttpResponse } from 'msw'
import { db, mutate } from '@mocks/db'
import { authenticate } from '@mocks/auth'
import { toSummary } from '@mocks/handlers/nfts'
import { endpoint, notFoundProblem } from '@mocks/network'

const favoritesOf = (userId: string) => db().favorites[userId] ?? []

export const favoriteHandlers = [
  endpoint('get', '/me/favorites', ({ request }) => {
    const auth = authenticate(request)
    if (auth instanceof Response) return auth
    const items = favoritesOf(auth.user.id).flatMap((nftId) => {
      const record = db().nfts.find((nft) => nft.id === nftId)
      return record ? [toSummary(record)] : []
    })
    return HttpResponse.json({ items })
  }),

  endpoint<{ nftId: string }>('put', '/me/favorites/:nftId', ({ request, params }) => {
    const auth = authenticate(request)
    if (auth instanceof Response) return auth
    if (!db().nfts.some((nft) => nft.id === params.nftId)) return notFoundProblem('Este NFT não existe.')
    mutate((current) => {
      current.favorites[auth.user.id] = [params.nftId, ...favoritesOf(auth.user.id).filter((id) => id !== params.nftId)]
    })
    return HttpResponse.json({ nftId: params.nftId, favorite: true })
  }),

  endpoint<{ nftId: string }>('delete', '/me/favorites/:nftId', ({ request, params }) => {
    const auth = authenticate(request)
    if (auth instanceof Response) return auth
    mutate((current) => {
      current.favorites[auth.user.id] = favoritesOf(auth.user.id).filter((id) => id !== params.nftId)
    })
    return HttpResponse.json({ nftId: params.nftId, favorite: false })
  }),
]
