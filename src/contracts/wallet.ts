import * as v from 'valibot'
import { NETWORK_IDS, type NetworkId } from '@contracts/nft'
import { ENS_NAME_PATTERN } from '@contracts/profile'

export const WALLET_PROVIDERS = [
  { id: 'metamask', label: 'MetaMask' },
  { id: 'walletconnect', label: 'WalletConnect' },
  { id: 'coinbase', label: 'Coinbase Wallet' },
] as const

export type WalletProviderId = (typeof WALLET_PROVIDERS)[number]['id']

export const WALLET_PROVIDER_IDS = WALLET_PROVIDERS.map((provider) => provider.id)

export const WALLET_ROLES = ['primary', 'secondary'] as const

export type WalletRole = (typeof WALLET_ROLES)[number]

const ADDRESS_PATTERNS: Record<NetworkId, RegExp> = {
  ethereum: /^0x[a-fA-F0-9]{40}$/,
  polygon: /^0x[a-fA-F0-9]{40}$/,
  solana: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
}

export const isValidAddress = (network: NetworkId, address: string) => ADDRESS_PATTERNS[network].test(address)

export const REFERRAL_CODE_PATTERN = /^[A-Za-z0-9]{4,12}$/

export const walletSchema = v.object({
  role: v.picklist(WALLET_ROLES),
  displayName: v.string(),
  nickname: v.string(),
  network: v.picklist(NETWORK_IDS),
  profileName: v.string(),
  address: v.string(),
  ensOrSecondary: v.string(),
  provider: v.picklist(WALLET_PROVIDER_IDS),
  referralCode: v.string(),
  email: v.string(),
  ensName: v.string(),
  updatedAt: v.string(),
})

export type Wallet = v.InferOutput<typeof walletSchema>

export const walletsSchema = v.object({
  primary: v.nullable(walletSchema),
  secondary: v.nullable(walletSchema),
})

export type Wallets = v.InferOutput<typeof walletsSchema>

export const walletInputSchema = v.pipe(
  v.object({
    displayName: v.pipe(v.string(), v.trim(), v.minLength(2), v.maxLength(60)),
    nickname: v.pipe(v.string(), v.trim(), v.minLength(2), v.maxLength(40)),
    network: v.picklist(NETWORK_IDS),
    profileName: v.pipe(v.string(), v.trim(), v.minLength(2), v.maxLength(60)),
    address: v.pipe(v.string(), v.trim()),
    ensOrSecondary: v.pipe(v.string(), v.trim(), v.maxLength(80)),
    provider: v.picklist(WALLET_PROVIDER_IDS),
    referralCode: v.pipe(v.string(), v.trim(), v.regex(REFERRAL_CODE_PATTERN)),
    email: v.pipe(v.string(), v.trim(), v.toLowerCase(), v.email()),
    ensName: v.pipe(v.string(), v.trim(), v.toLowerCase(), v.regex(ENS_NAME_PATTERN)),
  }),
  v.forward(
    v.check((input) => isValidAddress(input.network, input.address)),
    ['address'],
  ),
)

export type WalletInput = v.InferOutput<typeof walletInputSchema>
