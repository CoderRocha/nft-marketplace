import { useMutation } from '@tanstack/react-query'
import * as v from 'valibot'
import { toast } from 'sonner'
import { subscribeNewsletter } from '@core/api/newsletter'
import { emailSchema } from '@core/schemas'
import { createFormSubmitHandler, schemaValidation, useAppForm } from '@pattern/form.hooks'

const newsletterFormSchema = v.object({ email: emailSchema })

export const NewsletterForm = () => {
  const subscribe = useMutation({ mutationFn: subscribeNewsletter })
  const form = useAppForm({
    defaultValues: { email: '' },
    ...schemaValidation(newsletterFormSchema),
    onSubmit: createFormSubmitHandler(newsletterFormSchema, async (input) => {
      await subscribe.mutateAsync(input)
      toast.success('Inscrição confirmada. Você vai receber as novidades por e-mail.')
      form.reset()
    }),
  })

  return (
    <>
      <h2 className="text-base leading-tight font-semibold">Antecipe-se ao próximo lançamento</h2>
      <form
        noValidate
        className="flex items-start"
        onSubmit={(event) => {
          event.preventDefault()
          void form.handleSubmit()
        }}
      >
        <form.AppForm>
          <div className="flex-1">
            <form.AppField name="email">
              {(field) => (
                <field.TextField
                  label="E-mail para receber novidades"
                  hideLabel
                  type="email"
                  autoComplete="email"
                  placeholder="digite seu e-mail..."
                />
              )}
            </form.AppField>
          </div>
          <form.SubmitButton className="h-10 rounded-l-none px-4 text-sm">Enviar</form.SubmitButton>
        </form.AppForm>
      </form>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
      </p>
    </>
  )
}
