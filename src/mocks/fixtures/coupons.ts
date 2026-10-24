export type CouponRecord = {
  code: string
  percent: number
  expiresAt: string
}

export const COUPONS: CouponRecord[] = [
  { code: 'KURIO10', percent: 10, expiresAt: '2099-12-31T23:59:59.000Z' },
  { code: 'EXPIRADO', percent: 15, expiresAt: '2025-01-01T00:00:00.000Z' },
]

export const NETWORK_FEES = {
  ethereum: '0.016',
  polygon: '0.002',
  solana: '0.0008',
} as const
