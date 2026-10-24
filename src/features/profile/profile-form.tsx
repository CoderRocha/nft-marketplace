import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { Profile } from '@contracts/profile'
import { profileQuery } from '@core/queries'
import { ErrorState } from '@pattern/error-state'
import { createFormSubmitHandler, schemaValidation, useAppForm } from '@pattern/form.hooks'
import { AvatarField } from '@features/profile/avatar-field'
import { useChangePassword, useUpdateProfile } from '@features/profile/hooks'
import { profileFormSchema, type ProfileFormValues } from '@features/profile/schemas'
import { Skeleton } from '@ui/skeleton'

const toFormValues = (profile: Profile): ProfileFormValues => ({
  displayName: profile.displayName,
  username: profile.username,
  email: profile.email,
  ensName: profile.ensName,
  walletNickname: profile.walletNickname,
  currentPassword: '',
  newPassword: '',
  confirmNewPassword: '',
})

const ProfileFormFields = ({ userId, profile }: { userId: string; profile: Profile }) => {
  const update = useUpdateProfile(userId)
  const password = useChangePassword()
  const form = useAppForm({
    defaultValues: toFormValues(profile),
    ...schemaValidation(profileFormSchema),
    onSubmit: createFormSubmitHandler(profileFormSchema, async (values) => {
      const saved = await update.mutateAsync({
        displayName: values.displayName,
        username: values.username,
        email: values.email,
        ensName: values.ensName,
        walletNickname: values.walletNickname,
      })
      if (values.newPassword) {
        await password.mutateAsync({ currentPassword: values.currentPassword, newPassword: values.newPassword })
        toast.success('Perfil e senha atualizados.')
      } else {
        toast.success('Perfil atualizado.')
      }
      form.reset(toFormValues(saved))
    }),
  })

  return (
    <form
      noValidate
      aria-labelledby="perfil-titulo"
      className="flex flex-col gap-8"
      onSubmit={(event) => {
        event.preventDefault()
        void form.handleSubmit()
      }}
    >
      <form.AppForm>
        <section className="flex flex-col gap-5">
          <h1 id="perfil-titulo" className="text-[0.9375rem] font-semibold">
            Perfil do colecionador
          </h1>
          <form.FormErrorAlert />
          <div className="grid gap-x-5 gap-y-5 md:grid-cols-2">
            <form.AppField name="displayName">{(field) => <field.TextField label="Nome de exibição" required autoComplete="name" />}</form.AppField>
            <form.AppField name="username">{(field) => <field.TextField label="Nome de usuário" required autoComplete="username" />}</form.AppField>
            <form.AppField name="email">{(field) => <field.TextField label="E-mail" type="email" required autoComplete="email" />}</form.AppField>
            <form.AppField name="ensName">{(field) => <field.TextField label="Nome ENS" required prefix=".eth" />}</form.AppField>
            <form.AppField name="walletNickname">{(field) => <field.TextField label="Apelido da carteira" required />}</form.AppField>
            <AvatarField userId={userId} avatarUrl={profile.avatarUrl} />
          </div>
        </section>
        <section className="flex flex-col gap-5 md:max-w-[calc(50%-0.625rem)]">
          <h2 className="text-[0.9375rem] font-semibold">Alterar senha</h2>
          <p className="-mt-3 text-xs text-muted-foreground">Deixe em branco para manter a senha atual.</p>
          <form.AppField name="currentPassword">
            {(field) => <field.PasswordField label="Senha atual" autoComplete="current-password" />}
          </form.AppField>
          <form.AppField name="newPassword">{(field) => <field.PasswordField label="Nova senha" autoComplete="new-password" />}</form.AppField>
          <form.AppField name="confirmNewPassword">
            {(field) => <field.PasswordField label="Confirmar nova senha" autoComplete="new-password" />}
          </form.AppField>
        </section>
        <form.SubmitButton className="w-fit px-10">Salvar</form.SubmitButton>
      </form.AppForm>
    </form>
  )
}

export const ProfileForm = ({ userId }: { userId: string }) => {
  const profile = useQuery(profileQuery(userId))
  if (profile.isPending) {
    return (
      <div role="status" aria-label="Carregando perfil" className="grid gap-5 md:grid-cols-2">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-16" />
        ))}
      </div>
    )
  }
  if (profile.isError) {
    return (
      <ErrorState
        error={profile.error}
        retrying={profile.isFetching}
        onRetry={() => {
          void profile.refetch()
        }}
      />
    )
  }
  return <ProfileFormFields userId={userId} profile={profile.data} />
}
