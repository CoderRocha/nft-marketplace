import { createFileRoute } from '@tanstack/react-router'
import { useSession } from '@core/session'
import { FavoritesList } from '@features/favorites/favorites-list'

const FavoritesRoute = () => {
  const session = useSession()
  return session && <FavoritesList key={session.user.id} userId={session.user.id} />
}

export const Route = createFileRoute('/_shop/_private/profile/favorites')({
  head: () => ({ meta: [{ title: 'Lista de interesse - Kurio' }] }),
  component: FavoritesRoute,
})
