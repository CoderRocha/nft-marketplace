import type { QueryClient } from '@tanstack/react-query'
import { HeadContent, Link, Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import { useRealtime } from '@core/realtime'
import { useSession } from '@core/session'
import { ScenarioDialog } from '@features/dev-scenarios/scenario-dialog'
import { ErrorFallback } from '@pattern/widget-boundary'
import { buttonVariants } from '@ui/button'
import { Toaster } from '@ui/sonner'

const Devtools = import.meta.env.DEV ? lazy(() => import('@core/devtools')) : () => null

const RealtimeConnection = () => {
  useRealtime(useSession()?.user.id ?? null)
  return null
}

const RootComponent = () => (
  <>
    <RealtimeConnection />
    <HeadContent />
    <a
      href="#conteudo"
      className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
    >
      Pular para o conteúdo
    </a>
    <Outlet />
    <Toaster position="top-center" />
    <ScenarioDialog />
    <Suspense>
      <Devtools />
    </Suspense>
  </>
)

const NotFound = () => (
  <main id="conteudo" tabIndex={-1} className="mx-auto flex min-h-dvh max-w-md focus:outline-none flex-col items-center justify-center gap-4 p-6 text-center">
    <h1 className="text-2xl font-bold">Página não encontrada</h1>
    <p className="text-muted-foreground">O endereço acessado não existe ou foi removido.</p>
    <Link to="/" className={buttonVariants()}>
      Voltar ao início
    </Link>
  </main>
)

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: NotFound,
  errorComponent: ErrorFallback,
  head: () => ({ meta: [{ title: 'Kurio - Marketplace de NFTs' }] }),
})
