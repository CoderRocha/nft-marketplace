import * as v from 'valibot'
import { COLLECTOR_NOTE_MAX, WALLET_SOURCES, type WalletSource } from '@contracts/order'
import type { Profile } from '@contracts/profile'
import type { Wallet, Wallets } from '@contracts/wallet'
import { optionalText } from '@core/schemas'
import { usernameSchema } from '@features/auth/schemas'
import { addressFitsNetwork, INVALID_ADDRESS_MESSAGE, walletFieldsFormSchema } from '@features/wallets/schemas'

export const collectorFormSchema = v.pipe(
  v.object({
    ...v.omit(walletFieldsFormSchema, ['nickname']).entries,
    username: usernameSchema,
    note: optionalText(COLLECTOR_NOTE_MAX),
  }),
  v.forward(v.partialCheck([['network'], ['address']], addressFitsNetwork, INVALID_ADDRESS_MESSAGE), ['address']),
)

export type CollectorFormValues = v.InferInput<typeof collectorFormSchema>

export const walletFieldValues = (wallet: Wallet | null) => ({
  network: wallet?.network ?? '',
  profileName: wallet?.profileName ?? '',
  address: wallet?.address ?? '',
  ensOrSecondary: wallet?.ensOrSecondary ?? '',
  provider: wallet?.provider ?? '',
  referralCode: wallet?.referralCode ?? '',
})

export const collectorDefaults = (profile: Profile, wallet: Wallet | null): CollectorFormValues => ({
  displayName: profile.displayName,
  username: profile.username,
  email: profile.email,
  ensName: profile.ensName,
  note: '',
  ...walletFieldValues(wallet),
})

const draftFieldsSchema = v.partial(
  v.object({
    displayName: v.string(),
    username: v.string(),
    email: v.string(),
    ensName: v.string(),
    note: v.string(),
    network: v.string(),
    profileName: v.string(),
    address: v.string(),
    ensOrSecondary: v.string(),
    provider: v.string(),
    referralCode: v.string(),
  }),
)

const draftSourceSchema = v.object({ walletSource: v.optional(v.picklist(WALLET_SOURCES)) })

export const walletOf = (wallets: Wallets, source: WalletSource): Wallet | null =>
  source === 'primary' ? wallets.primary : source === 'secondary' ? wallets.secondary : null

export const registeredSource = (wallets: Wallets): WalletSource =>
  wallets.primary ? 'primary' : wallets.secondary ? 'secondary' : 'custom'

const sourceForAddress = (wallets: Wallets, address: string | undefined): WalletSource =>
  address === undefined
    ? registeredSource(wallets)
    : ((['primary', 'secondary'] as const).find((source) => walletOf(wallets, source)?.address === address) ?? 'custom')

export const restoreDraft = (profile: Profile, wallets: Wallets, draft: unknown): { values: CollectorFormValues; source: WalletSource } => {
  const fields = v.safeParse(draftFieldsSchema, draft)
  const saved = fields.success ? fields.output : {}
  const savedSource = v.safeParse(draftSourceSchema, draft)
  const requested = (savedSource.success ? savedSource.output.walletSource : undefined) ?? sourceForAddress(wallets, saved.address)
  const source = requested === 'custom' || walletOf(wallets, requested) ? requested : registeredSource(wallets)
  const wallet = walletOf(wallets, source)
  return {
    values: { ...collectorDefaults(profile, wallet), ...saved, ...(wallet ? walletFieldValues(wallet) : {}) },
    source,
  }
}

export const checkoutSearchSchema = v.object({
  etapa: v.fallback(v.optional(v.picklist(['dados', 'carteira']), 'dados'), 'dados'),
})

export type CheckoutSearch = v.InferOutput<typeof checkoutSearchSchema>
