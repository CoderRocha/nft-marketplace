import * as v from 'valibot'
import { COLLECTOR_NOTE_MAX } from '@contracts/order'
import type { Profile } from '@contracts/profile'
import type { Wallet } from '@contracts/wallet'
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

const draftSchema = v.partial(
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

export const mergeDraft = (defaults: CollectorFormValues, draft: unknown): CollectorFormValues => {
  const parsed = v.safeParse(draftSchema, draft)
  return parsed.success ? { ...defaults, ...parsed.output } : defaults
}

export const checkoutSearchSchema = v.object({
  etapa: v.fallback(v.optional(v.picklist(['dados', 'carteira']), 'dados'), 'dados'),
})

export type CheckoutSearch = v.InferOutput<typeof checkoutSearchSchema>
