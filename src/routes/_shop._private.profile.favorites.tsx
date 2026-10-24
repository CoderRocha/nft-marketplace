import { createFileRoute } from '@tanstack/react-router'

const FavoritesRoute = () => (
  <div className="mx-auto w-full max-w-shop px-4 py-10 md:px-6">
    <h1 className="text-2xl font-bold">Lista de interesse</h1>
  </div>
)

export const Route = createFileRoute('/_shop/_private/profile/favorites')({ component: FavoritesRoute })
