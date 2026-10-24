import { CircleAlertIcon, EyeIcon, EyeOffIcon } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { Alert, AlertTitle } from '@ui/alert'
import { Button } from '@ui/button'
import { Checkbox } from '@ui/checkbox'
import { Field, FieldDescription, FieldError, FieldLabel, FieldLegend, FieldSet } from '@ui/field'
import { Input } from '@ui/input'
import { RadioGroup, RadioGroupItem } from '@ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui/select'
import { Spinner } from '@ui/spinner'
import { Textarea } from '@ui/textarea'
import { useFieldContext, useFormContext } from '@pattern/form.contexts'

export type FieldOption = { value: string; label: string }

export const toErrorMessages = (errors: readonly unknown[]): string[] =>
  errors.flatMap((error): string[] => {
    if (typeof error === 'string') return [error]
    if (Array.isArray(error)) return toErrorMessages(error)
    if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
      return [error.message]
    }
    return []
  })

type ControlProps = {
  id: string
  'aria-invalid': boolean
  'aria-describedby': string | undefined
  'aria-required': boolean | undefined
}

type FieldShellProps = {
  label: string
  hideLabel?: boolean | undefined
  required?: boolean | undefined
  description?: string | undefined
  children: (control: ControlProps) => ReactNode
}

const FieldShell = ({ label, hideLabel, required, description, children }: FieldShellProps) => {
  const field = useFieldContext<unknown>()
  const id = useId()
  const [error] = toErrorMessages(field.state.meta.errors)
  const describedBy = [description && `${id}-description`, error && `${id}-error`].filter(Boolean).join(' ')

  return (
    <Field data-invalid={error !== undefined}>
      <FieldLabel htmlFor={id} className={hideLabel ? 'sr-only' : undefined}>
        {label}
        {required && (
          <span aria-hidden="true" className="-ml-1.5 text-primary">
            *
          </span>
        )}
      </FieldLabel>
      {children({
        id,
        'aria-invalid': error !== undefined,
        'aria-describedby': describedBy || undefined,
        'aria-required': required,
      })}
      {description && <FieldDescription id={`${id}-description`}>{description}</FieldDescription>}
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </Field>
  )
}

type TextFieldProps = {
  label: string
  hideLabel?: boolean
  required?: boolean
  description?: string
  prefix?: string
  type?: 'text' | 'email' | 'search' | 'url'
  placeholder?: string
  autoComplete?: string
}

export const TextField = ({ label, hideLabel, required, description, prefix, type = 'text', ...props }: TextFieldProps) => {
  const field = useFieldContext<string>()
  return (
    <FieldShell label={label} hideLabel={hideLabel} required={required} description={description}>
      {(control) => (
        <div className="flex gap-2">
          {prefix && (
            <span aria-hidden="true" className="flex h-10 shrink-0 items-center rounded-md border border-input bg-field px-3 text-sm">
              {prefix}
            </span>
          )}
          <Input
            {...control}
            {...props}
            type={type}
            name={field.name}
            value={field.state.value}
            onChange={(event) => {
              field.handleChange(event.target.value)
            }}
            onBlur={field.handleBlur}
          />
        </div>
      )}
    </FieldShell>
  )
}

type PasswordFieldProps = {
  label: string
  hideLabel?: boolean
  required?: boolean
  description?: string
  placeholder?: string
  autoComplete: 'current-password' | 'new-password'
}

export const PasswordField = ({ label, hideLabel, required, description, ...props }: PasswordFieldProps) => {
  const field = useFieldContext<string>()
  const [visible, setVisible] = useState(false)
  return (
    <FieldShell label={label} hideLabel={hideLabel} required={required} description={description}>
      {(control) => (
        <div className="relative">
          <Input
            {...control}
            {...props}
            type={visible ? 'text' : 'password'}
            name={field.name}
            value={field.state.value}
            onChange={(event) => {
              field.handleChange(event.target.value)
            }}
            onBlur={field.handleBlur}
            className="pr-11"
          />
          <button
            type="button"
            aria-label={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
            aria-pressed={visible}
            onClick={() => {
              setVisible((current) => !current)
            }}
            className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {visible ? <EyeIcon className="size-4" /> : <EyeOffIcon className="size-4" />}
          </button>
        </div>
      )}
    </FieldShell>
  )
}

type NumberFieldProps = {
  label: string
  description?: string
  min?: number
  max?: number
}

export const NumberField = ({ label, description, ...props }: NumberFieldProps) => {
  const field = useFieldContext<number>()
  return (
    <FieldShell label={label} description={description}>
      {(control) => (
        <Input
          {...control}
          {...props}
          type="number"
          inputMode="numeric"
          name={field.name}
          value={String(field.state.value)}
          onChange={(event) => {
            field.handleChange(Number(event.target.value))
          }}
          onBlur={field.handleBlur}
        />
      )}
    </FieldShell>
  )
}

type TextareaFieldProps = {
  label: string
  required?: boolean
  description?: string
  rows?: number
  placeholder?: string
}

export const TextareaField = ({ label, required, description, ...props }: TextareaFieldProps) => {
  const field = useFieldContext<string>()
  return (
    <FieldShell label={label} required={required} description={description}>
      {(control) => (
        <Textarea
          {...control}
          {...props}
          name={field.name}
          value={field.state.value}
          onChange={(event) => {
            field.handleChange(event.target.value)
          }}
          onBlur={field.handleBlur}
        />
      )}
    </FieldShell>
  )
}

type SelectFieldProps = {
  label: string
  required?: boolean
  description?: string
  options: readonly FieldOption[]
  placeholder?: string
}

export const SelectField = ({ label, required, description, options, placeholder }: SelectFieldProps) => {
  const field = useFieldContext<string>()
  return (
    <FieldShell label={label} required={required} description={description}>
      {(control) => (
        <Select
          items={options}
          name={field.name}
          value={field.state.value || null}
          onValueChange={(value) => {
            if (value !== null) field.handleChange(value)
          }}
        >
          <SelectTrigger {...control} className="w-full" onBlur={field.handleBlur}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </FieldShell>
  )
}

type RadioGroupFieldProps = {
  label: string
  description?: string
  options: readonly FieldOption[]
}

export const RadioGroupField = ({ label, description, options }: RadioGroupFieldProps) => {
  const field = useFieldContext<string>()
  const [error] = toErrorMessages(field.state.meta.errors)
  return (
    <FieldSet data-invalid={error !== undefined}>
      <FieldLegend variant="label">{label}</FieldLegend>
      {description && <FieldDescription>{description}</FieldDescription>}
      <RadioGroup
        name={field.name}
        value={field.state.value}
        onValueChange={(value) => {
          if (typeof value === 'string') field.handleChange(value)
        }}
      >
        {options.map((option) => (
          <FieldLabel key={option.value} className="font-normal">
            <RadioGroupItem value={option.value} aria-invalid={error !== undefined} />
            {option.label}
          </FieldLabel>
        ))}
      </RadioGroup>
      {error && <FieldError>{error}</FieldError>}
    </FieldSet>
  )
}

type CheckboxFieldProps = {
  label: string
}

export const CheckboxField = ({ label }: CheckboxFieldProps) => {
  const field = useFieldContext<boolean>()
  const [error] = toErrorMessages(field.state.meta.errors)
  return (
    <Field data-invalid={error !== undefined}>
      <FieldLabel className="font-normal">
        <Checkbox
          name={field.name}
          checked={field.state.value}
          aria-invalid={error !== undefined}
          onCheckedChange={(checked) => {
            field.handleChange(checked)
          }}
        />
        {label}
      </FieldLabel>
      {error && <FieldError>{error}</FieldError>}
    </Field>
  )
}

export const SubmitButton = ({ children, className }: { children: ReactNode; className?: string }) => {
  const form = useFormContext()
  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <Button type="submit" size="lg" disabled={isSubmitting} className={className}>
          {isSubmitting && <Spinner aria-label="Enviando" />}
          {children}
        </Button>
      )}
    </form.Subscribe>
  )
}

export const FormErrorAlert = () => {
  const form = useFormContext()
  return (
    <form.Subscribe selector={(state) => toErrorMessages(state.errors)[0]}>
      {(message) =>
        message && (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertTitle>{message}</AlertTitle>
          </Alert>
        )
      }
    </form.Subscribe>
  )
}
