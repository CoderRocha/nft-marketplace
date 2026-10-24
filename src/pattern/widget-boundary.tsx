import { QueryErrorResetBoundary, useQueryErrorResetBoundary } from '@tanstack/react-query'
import { CatchBoundary, useRouter, type ErrorComponentProps } from '@tanstack/react-router'
import { CircleAlertIcon } from 'lucide-react'
import { Suspense, type ReactNode } from 'react'
import { isFriendlyError } from '@core/http'
import { Alert, AlertDescription, AlertTitle } from '@ui/alert'
import { Button } from '@ui/button'
import { Spinner } from '@ui/spinner'

export const PendingFallback = () => {
  return (
    <div className="flex min-h-40 items-center justify-center text-primary">
      <Spinner aria-label="Carregando" className="size-6" />
    </div>
  )
}

export const ErrorFallback = ({ error, reset }: ErrorComponentProps) => {
  const router = useRouter()
  const { reset: resetQueries } = useQueryErrorResetBoundary()
  const title = isFriendlyError(error) ? error.title : 'Algo deu errado'
  const detail = isFriendlyError(error) ? error.detail : 'Não foi possível carregar este conteúdo.'

  return (
    <Alert variant="destructive">
      <CircleAlertIcon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex flex-col items-start gap-2">
        {detail}
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            resetQueries()
            reset()
            void router.invalidate()
          }}
        >
          Tentar novamente
        </Button>
      </AlertDescription>
    </Alert>
  )
}

type WidgetBoundaryProps = {
  fallback: ReactNode
  children: ReactNode
}

export const WidgetBoundary = ({ fallback, children }: WidgetBoundaryProps) => (
  <QueryErrorResetBoundary>
    <CatchBoundary getResetKey={() => 'widget'} errorComponent={ErrorFallback}>
      <Suspense fallback={fallback}>{children}</Suspense>
    </CatchBoundary>
  </QueryErrorResetBoundary>
)
