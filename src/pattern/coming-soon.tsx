import { cn } from 'cn'
import type { ReactNode } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@ui/tooltip'

type ComingSoonProps = {
  children: ReactNode
  className?: string
}

export const ComingSoon = ({ children, className }: ComingSoonProps) => (
  <Tooltip>
    <TooltipTrigger render={<span tabIndex={0} aria-disabled="true" className={cn('cursor-not-allowed', className)} />}>
      {children}
      <span className="sr-only"> (em breve)</span>
    </TooltipTrigger>
    <TooltipContent>Em breve</TooltipContent>
  </Tooltip>
)
