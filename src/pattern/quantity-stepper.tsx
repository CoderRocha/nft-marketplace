import { cn } from 'cn'
import { MinusIcon, PlusIcon } from 'lucide-react'
import { Button } from '@ui/button'

type QuantityStepperProps = {
  value: number
  max: number
  min?: number
  label: string
  disabled?: boolean
  appearance?: 'filled' | 'ghost'
  className?: string
  onChange: (value: number) => void
}

export const QuantityStepper = ({
  value,
  max,
  min = 1,
  label,
  disabled = false,
  appearance = 'filled',
  className,
  onChange,
}: QuantityStepperProps) => {
  const buttonClassName =
    appearance === 'filled'
      ? 'size-6 rounded-md bg-primary text-primary-foreground hover:bg-primary/80'
      : 'size-7 rounded-full bg-secondary text-foreground hover:bg-secondary/70'
  return (
    <div role="group" aria-label={label} className={cn('inline-flex items-center gap-2', className)}>
      <Button
        size="icon-xs"
        className={buttonClassName}
        aria-label={`Diminuir ${label.toLowerCase()}`}
        disabled={disabled || value <= min}
        onClick={() => {
          onChange(value - 1)
        }}
      >
        <MinusIcon />
      </Button>
      <output aria-live="polite" className="min-w-6 text-center text-sm font-semibold tabular-nums">
        {value}
      </output>
      <Button
        size="icon-xs"
        className={buttonClassName}
        aria-label={`Aumentar ${label.toLowerCase()}`}
        disabled={disabled || value >= max}
        onClick={() => {
          onChange(value + 1)
        }}
      >
        <PlusIcon />
      </Button>
    </div>
  )
}
