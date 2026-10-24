import { TicketIcon, XIcon } from 'lucide-react'
import { toast } from 'sonner'
import * as v from 'valibot'
import { COUPON_CODE_MAX } from '@contracts/cart'
import { createFormSubmitHandler, schemaValidation, useAppForm } from '@pattern/form.hooks'
import { useApplyCoupon, useRemoveCoupon } from '@features/cart/hooks'
import { Button } from '@ui/button'

const couponFormSchema = v.object({
  code: v.pipe(
    v.string(),
    v.trim(),
    v.toUpperCase(),
    v.nonEmpty('Digite um código promocional.'),
    v.maxLength(COUPON_CODE_MAX, `Use no máximo ${COUPON_CODE_MAX} caracteres.`),
  ),
})

const AppliedCoupon = ({ code, percent }: { code: string; percent: number | undefined }) => {
  const remove = useRemoveCoupon()
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-primary/50 bg-field px-3 py-2 text-[0.8125rem]">
      <span className="flex items-center gap-2">
        <TicketIcon aria-hidden="true" className="size-4 text-primary" />
        Cupom <strong className="text-primary">{code}</strong> aplicado{percent === undefined ? '' : ` (${percent}% de desconto)`}
      </span>
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label={`Remover cupom ${code}`}
        disabled={remove.isPending}
        onClick={() => {
          remove.mutate(undefined, {
            onSuccess: () => {
              toast.success('Cupom removido.')
            },
          })
        }}
      >
        <XIcon />
      </Button>
    </div>
  )
}

type CouponFormProps = {
  appliedCode: string | null
  appliedPercent: number | undefined
}

export const CouponForm = ({ appliedCode, appliedPercent }: CouponFormProps) => {
  const apply = useApplyCoupon()
  const form = useAppForm({
    defaultValues: { code: '' },
    ...schemaValidation(couponFormSchema),
    onSubmit: createFormSubmitHandler(couponFormSchema, async (input) => {
      await apply.mutateAsync(input)
      toast.success(`Cupom ${input.code} aplicado.`)
      form.reset()
    }),
  })

  if (appliedCode) return <AppliedCoupon code={appliedCode} percent={appliedPercent} />

  return (
    <form
      noValidate
      aria-label="Código promocional"
      className="flex items-start"
      onSubmit={(event) => {
        event.preventDefault()
        void form.handleSubmit()
      }}
    >
      <form.AppForm>
        <div className="flex-1">
          <form.AppField name="code">
            {(field) => (
              <field.TextField label="Código promocional" hideLabel placeholder="Digite o código promocional..." autoComplete="off" />
            )}
          </form.AppField>
        </div>
        <form.SubmitButton className="h-10 rounded-l-none px-5 text-sm">Aplicar</form.SubmitButton>
      </form.AppForm>
    </form>
  )
}
