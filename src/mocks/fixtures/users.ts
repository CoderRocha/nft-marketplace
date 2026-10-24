export type UserRecord = {
  id: string
  displayName: string
  username: string
  email: string
  avatarUrl: string | null
  ensName: string
  walletNickname: string
  passwordSalt: string
  passwordHash: string
}

export const DEMO_PASSWORD = 'Senha@123'

export const seedUsers = (): UserRecord[] => [
  {
    id: 'usr_ana',
    displayName: 'Ana Souza',
    username: 'ana.colecionadora',
    email: 'ana@kurio.dev',
    avatarUrl: null,
    ensName: 'ana',
    walletNickname: 'Principal da Ana',
    passwordSalt: 'ana-salt-01',
    passwordHash: 'f18d2e86acd4bf170619971994b14e6c8b75d1ff314d85c2738d4b8097d9ee97',
  },
  {
    id: 'usr_bruno',
    displayName: 'Bruno Lima',
    username: 'bruno.nft',
    email: 'bruno@kurio.dev',
    avatarUrl: null,
    ensName: 'bruno',
    walletNickname: 'Cofre do Bruno',
    passwordSalt: 'bruno-salt-02',
    passwordHash: 'b57fbe6890704ce3d51751628e391869067f0f4cae923e18aa0ca85818171e76',
  },
  {
    id: 'usr_ocupado',
    displayName: 'Conta Existente',
    username: 'ocupado',
    email: 'ocupado@kurio.dev',
    avatarUrl: null,
    ensName: 'ocupado',
    walletNickname: 'Carteira existente',
    passwordSalt: 'ocupado-salt-03',
    passwordHash: 'c0afd83115432fca2165a23af0353af391ea18003a427aef34e66423f3775dff',
  },
]
