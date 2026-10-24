import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as v from 'valibot'
import { NETWORKS } from '@contracts/nft'
import { WALLET_PROVIDERS, walletInputSchema, type WalletRole } from '@contracts/wallet'
import { saveWallet } from '@core/api/wallets'
import { walletsQuery } from '@core/queries'
import { createFormSubmitHandler, schemaValidation, useAppForm } from '@pattern/form.hooks'
import { walletFormSchema, type WalletFormValues } from '@features/wallets/schemas'

const NETWORK_OPTIONS = NETWORKS.map((network) => ({ value: network.id, label: network.label }))

const PROVIDER_OPTIONS = WALLET_PROVIDERS.map((provider) => ({ value: provider.id, label: provider.label }))

const ROLE_LABEL: Record<WalletRole, string> = { primary: 'principal', secondary: 'secundária' }

type WalletFormProps = {
  userId: string
  role: WalletRole
  initialValues: WalletFormValues
}

export const WalletForm = ({ userId, role, initialValues }: WalletFormProps) => {
  const queryClient = useQueryClient()
  const save = useMutation({
    mutationFn: (values: WalletFormValues) => saveWallet(role, v.parse(walletInputSchema, values)),
    onSuccess: (wallet) => {
      queryClient.setQueryData(walletsQuery(userId).queryKey, (current) => (current ? { ...current, [role]: wallet } : current))
    },
  })
  const form = useAppForm({
    defaultValues: initialValues,
    ...schemaValidation(walletFormSchema),
    onSubmit: createFormSubmitHandler(walletFormSchema, async (values) => {
      await save.mutateAsync(values)
      toast.success(`Carteira ${ROLE_LABEL[role]} salva.`)
    }),
  })

  return (
    <form
      noValidate
      aria-label={`Carteira ${ROLE_LABEL[role]}`}
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault()
        void form.handleSubmit()
      }}
    >
      <form.AppForm>
        <form.FormErrorAlert />
        <div className="grid gap-5 md:grid-cols-2">
          <form.AppField name="displayName">{(field) => <field.TextField label="Nome de exibição" required />}</form.AppField>
          <form.AppField name="nickname">{(field) => <field.TextField label="Apelido da carteira" required />}</form.AppField>
          <form.AppField name="network">
            {(field) => <field.SelectField label="Rede" required options={NETWORK_OPTIONS} placeholder="Selecione uma rede" />}
          </form.AppField>
          <form.AppField name="profileName">{(field) => <field.TextField label="Nome do perfil" required />}</form.AppField>
          <form.AppField name="address">
            {(field) => <field.TextField label="Endereço da carteira" required placeholder="Endereço 0x da carteira" />}
          </form.AppField>
          <form.AppField name="ensOrSecondary">
            {(field) => (
              <field.TextField label="ENS ou carteira secundária (opcional)" placeholder="ENS ou carteira secundária (opcional)" />
            )}
          </form.AppField>
          <form.AppField name="provider">
            {(field) => <field.SelectField label="Tipo de carteira" required options={PROVIDER_OPTIONS} placeholder="Selecione uma carteira" />}
          </form.AppField>
          <form.AppField name="referralCode">{(field) => <field.TextField label="Código de indicação" required />}</form.AppField>
          <form.AppField name="email">{(field) => <field.TextField label="E-mail" type="email" required autoComplete="email" />}</form.AppField>
          <form.AppField name="ensName">{(field) => <field.TextField label="Nome ENS" required prefix=".eth" />}</form.AppField>
        </div>
        <form.SubmitButton className="h-9 w-fit px-4 text-sm">Salvar carteira</form.SubmitButton>
      </form.AppForm>
    </form>
  )
}
