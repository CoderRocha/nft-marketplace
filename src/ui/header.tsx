import type { ComponentProps } from 'react'
import { cn } from 'cn'

export const PageHeader = ({ className, ...props }: ComponentProps<'div'>) => (
  <div
    data-slot="page-header"
    className={cn('flex flex-wrap items-end justify-between gap-4 pb-6', className)}
    {...props}
  />
)

export const PageTitle = ({ className, children, ...props }: ComponentProps<'h1'>) => (
  <h1 data-slot="page-title" className={cn('text-2xl font-semibold tracking-tight', className)} {...props}>
    {children}
  </h1>
)

export const PageDescription = ({ className, ...props }: ComponentProps<'p'>) => (
  <p data-slot="page-description" className={cn('mt-1 text-sm text-muted-foreground', className)} {...props} />
)
