import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { catalogSearchDefaults, catalogSearchSchema } from '@features/catalog/schemas'

const HomeRoute = () => (
  <div className="mx-auto w-full max-w-shop px-4 py-10 md:px-6">
    <h1 className="text-4xl font-bold uppercase">Seja dono do futuro da arte digital</h1>
    <section id="catalogo" aria-label="Catálogo" className="mt-10 min-h-60" />
  </div>
)

export const Route = createFileRoute('/_shop/')({
  validateSearch: catalogSearchSchema,
  search: { middlewares: [stripSearchParams(catalogSearchDefaults)] },
  component: HomeRoute,
})
