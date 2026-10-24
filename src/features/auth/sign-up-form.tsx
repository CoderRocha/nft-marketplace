import { createFormSubmitHandler, schemaValidation, useAppForm } from '@pattern/form.hooks'
import { useSignUp } from '@features/auth/hooks'
import { signUpSchema } from '@features/auth/schemas'

type SignUpFormProps = {
  onSuccess: () => void
}

export const SignUpForm = ({ onSuccess }: SignUpFormProps) => {
  const signUp = useSignUp()
  const form = useAppForm({
    defaultValues: { username: '', email: '', password: '', confirmPassword: '' },
    ...schemaValidation(signUpSchema),
    onSubmit: createFormSubmitHandler(signUpSchema, async ({ username, email, password }) => {
      await signUp.mutateAsync({ username, email, password })
      onSuccess()
    }),
  })

  return (
    <form
      noValidate
      aria-label="Criar conta"
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        void form.handleSubmit()
      }}
    >
      <form.AppForm>
        <form.FormErrorAlert />
        <form.AppField name="username">
          {(field) => <field.TextField label="Nome de usuário" autoComplete="username" placeholder="ex.: ana.colecionadora" />}
        </form.AppField>
        <form.AppField name="email">
          {(field) => <field.TextField label="E-mail" type="email" autoComplete="email" placeholder="Digite seu e-mail" />}
        </form.AppField>
        <form.AppField name="password">
          {(field) => (
            <field.PasswordField label="Senha" autoComplete="new-password" placeholder="Mínimo de 8 caracteres" />
          )}
        </form.AppField>
        <form.AppField name="confirmPassword">
          {(field) => <field.PasswordField label="Confirmar senha" autoComplete="new-password" placeholder="Repita a senha" />}
        </form.AppField>
        <form.SubmitButton className="w-full">Criar conta</form.SubmitButton>
      </form.AppForm>
    </form>
  )
}
