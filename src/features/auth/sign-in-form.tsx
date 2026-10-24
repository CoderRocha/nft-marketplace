import { ComingSoon } from '@pattern/coming-soon'
import { createFormSubmitHandler, schemaValidation, useAppForm } from '@pattern/form.hooks'
import { useSignIn } from '@features/auth/hooks'
import { signInSchema } from '@features/auth/schemas'

type SignInFormProps = {
  onSuccess: () => void
}

export const SignInForm = ({ onSuccess }: SignInFormProps) => {
  const signIn = useSignIn()
  const form = useAppForm({
    defaultValues: { email: '', password: '' },
    ...schemaValidation(signInSchema),
    onSubmit: createFormSubmitHandler(signInSchema, async (input) => {
      await signIn.mutateAsync(input)
      onSuccess()
    }),
  })

  return (
    <form
      noValidate
      aria-label="Entrar"
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        void form.handleSubmit()
      }}
    >
      <form.AppForm>
        <form.FormErrorAlert />
        <form.AppField name="email">
          {(field) => <field.TextField label="E-mail" type="email" autoComplete="email" placeholder="contato@email.com" />}
        </form.AppField>
        <form.AppField name="password">
          {(field) => <field.PasswordField label="Senha" autoComplete="current-password" placeholder="Sua senha" />}
        </form.AppField>
        <ComingSoon className="self-end text-xs text-primary">Esqueceu a senha?</ComingSoon>
        <form.SubmitButton className="w-full">Entrar</form.SubmitButton>
      </form.AppForm>
    </form>
  )
}
