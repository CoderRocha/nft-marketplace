import type { Wallets } from '@contracts/wallet'

const SEED_DATE = '2026-09-20T12:00:00.000Z'

export const seedWallets = (): Record<string, Wallets> => ({
  usr_ana: {
    primary: {
      role: 'primary',
      displayName: 'Ana Souza',
      nickname: 'Principal',
      network: 'ethereum',
      profileName: 'ana.colecionadora',
      address: '0xA91F3c2B7d41e09A5f6C1b8E2D4a7c90B3F1E82C',
      ensOrSecondary: '',
      provider: 'metamask',
      referralCode: 'KURIO2026',
      email: 'ana@kurio.dev',
      ensName: 'ana',
      updatedAt: SEED_DATE,
    },
    secondary: {
      role: 'secondary',
      displayName: 'Ana Souza',
      nickname: 'Reserva',
      network: 'polygon',
      profileName: 'ana.colecionadora',
      address: '0x5B2e8C1d9A4f7E3b6D0c2A8F1e9B7d4C3a6E5f21',
      ensOrSecondary: 'nova.kurio.eth',
      provider: 'coinbase',
      referralCode: 'KURIO2026',
      email: 'ana@kurio.dev',
      ensName: 'nova',
      updatedAt: SEED_DATE,
    },
  },
  usr_bruno: {
    primary: {
      role: 'primary',
      displayName: 'Bruno Lima',
      nickname: 'Cofre',
      network: 'ethereum',
      profileName: 'bruno.nft',
      address: '0x7C4d2E9a1B6f3D8c5A0e7F2b9D1c4A6E8f3B2d90',
      ensOrSecondary: '',
      provider: 'walletconnect',
      referralCode: 'BRUNO42',
      email: 'bruno@kurio.dev',
      ensName: 'bruno',
      updatedAt: SEED_DATE,
    },
    secondary: null,
  },
})

export const seedFavorites = (): Record<string, string[]> => ({
  usr_ana: ['sage-nomad-009'],
  usr_bruno: ['golden-beat-207'],
})
