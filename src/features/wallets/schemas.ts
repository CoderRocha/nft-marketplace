import * as v from 'valibot'
import { NETWORK_IDS } from '@contracts/nft'
import { isValidAddress, REFERRAL_CODE_PATTERN, WALLET_PROVIDER_IDS, type Wallet } from '@contracts/wallet'
import { emailSchema, optionalText, requiredText } from '@core/schemas'
import { ensNameSchema } from '@features/profile/schemas'

const isNetwork = (value: string) => NETWORK_IDS.some((network) => network === value)

const isProvider = (value: string) => WALLET_PROVIDER_IDS.some((provider) => provider === value)

export const walletFormSchema = v.pipe(
  v.object({
    displayName: v.pipe(requiredText(60), v.minLength(2, 'Use pelo menos 2 caracteres.')),
    nickname: v.pipe(requiredText(40), v.minLength(2, 'Use pelo menos 2 caracteres.')),
    network: v.pipe(v.string(), v.check(isNetwork, 'Selecione uma rede.')),
    profileName: v.pipe(requiredText(60), v.minLength(2, 'Use pelo menos 2 caracteres.')),
    address: v.pipe(v.string(), v.trim(), v.nonEmpty('Informe o endereço da carteira.')),
    ensOrSecondary: optionalText(80),
    provider: v.pipe(v.string(), v.check(isProvider, 'Selecione o tipo de carteira.')),
    referralCode: v.pipe(
      v.string(),
      v.trim(),
      v.nonEmpty('Informe o código de indicação.'),
      v.regex(REFERRAL_CODE_PATTERN, 'Use de 4 a 12 letras ou números.'),
    ),
    email: emailSchema,
    ensName: ensNameSchema,
  }),
  v.forward(
    v.partialCheck(
      [['network'], ['address']],
      (input) => !isNetwork(input.network) || NETWORK_IDS.some((network) => network === input.network && isValidAddress(network, input.address)),
      'Endereço inválido para a rede selecionada.',
    ),
    ['address'],
  ),
)

export type WalletFormValues = v.InferInput<typeof walletFormSchema>

export const emptyWalletValues: WalletFormValues = {
  displayName: '',
  nickname: '',
  network: '',
  profileName: '',
  address: '',
  ensOrSecondary: '',
  provider: '',
  referralCode: '',
  email: '',
  ensName: '',
}

export const toWalletValues = (wallet: Wallet): WalletFormValues => ({
  displayName: wallet.displayName,
  nickname: wallet.nickname,
  network: wallet.network,
  profileName: wallet.profileName,
  address: wallet.address,
  ensOrSecondary: wallet.ensOrSecondary,
  provider: wallet.provider,
  referralCode: wallet.referralCode,
  email: wallet.email,
  ensName: wallet.ensName,
})
