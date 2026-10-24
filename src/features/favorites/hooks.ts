import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { NftSummary } from '@contracts/nft'
import { setFavorite } from '@core/api/favorites'
import { favoritesQuery } from '@core/queries'
import { useSession } from '@core/session'

type FavoriteChange = { nft: NftSummary; favorite: boolean }

export const useFavoriteIds = () => {
  const session = useSession()
  const favorites = useQuery({ ...favoritesQuery(session?.user.id ?? ''), enabled: session !== null })
  return new Set(favorites.data?.items.map((item) => item.id) ?? [])
}

export const useToggleFavorite = (userId: string) => {
  const queryClient = useQueryClient()
  const { queryKey } = favoritesQuery(userId)
  return useMutation({
    mutationFn: ({ nft, favorite }: FavoriteChange) => setFavorite(nft.id, favorite),
    onMutate: async ({ nft, favorite }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData(queryKey)
      queryClient.setQueryData(queryKey, (current) => {
        if (!current) return current
        const others = current.items.filter((item) => item.id !== nft.id)
        return { items: favorite ? [nft, ...others] : others }
      })
      return { previous }
    },
    onError: (_error, _change, context) => {
      queryClient.setQueryData(queryKey, context?.previous)
      toast.error('Não foi possível atualizar sua lista de interesse. Tente novamente.')
    },
    onSuccess: (_result, { nft, favorite }) => {
      toast.success(favorite ? `${nft.name} entrou na sua lista de interesse.` : `${nft.name} saiu da sua lista de interesse.`)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  })
}
