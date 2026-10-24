import { walletSchema, walletsSchema, type WalletInput, type WalletRole } from '@contracts/wallet'
import { request } from '@core/http'

export const fetchWallets = (signal?: AbortSignal) => request('GET', '/me/wallets', { schema: walletsSchema, signal })

export const saveWallet = (role: WalletRole, body: WalletInput) => request('PUT', `/me/wallets/${role}`, { schema: walletSchema, body })
