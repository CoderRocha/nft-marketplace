import { cn } from 'cn'
import { CircleAlertIcon, RotateCwIcon } from 'lucide-react'
import { isFriendlyError } from '@core/http'
import { Button } from '@ui/button'

type ErrorStateProps = {
  error: unknown
  retrying?: boolean
  onRetry: () => void
  className?: string
}

export const ErrorState = ({ error, retrying = false, onRetry, className }: ErrorStateProps) => {
  const title = isFriendlyError(error) ? error.title : 'Algo deu errado'
  const detail = isFriendlyError(error) ? error.detail : 'Não foi possível carregar este conteúdo.'
  return (
    <div role="alert" className={cn('flex flex-col items-center gap-3 rounded-md bg-card px-6 py-10 text-center', className)}>
      <CircleAlertIcon aria-hidden="true" className="size-8 text-destructive" />
      <p className="text-base font-semibold">{title}</p>
      {detail && <p className="max-w-sm text-[0.8125rem] text-muted-foreground">{detail}</p>}
      <Button variant="outline" disabled={retrying} onClick={onRetry}>
        <RotateCwIcon className={cn(retrying && 'animate-spin motion-reduce:animate-none')} />
        {retrying ? 'Tentando novamente' : 'Tentar novamente'}
      </Button>
    </div>
  )
}
