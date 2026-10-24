import { ETH_AMOUNT_PATTERN } from '@contracts/money'

export const ETH_DECIMALS = 18

const WEI_PER_ETH = 10n ** BigInt(ETH_DECIMALS)

export const isEthAmount = (value: string) => ETH_AMOUNT_PATTERN.test(value)

export const toWei = (eth: string) => {
  if (!isEthAmount(eth)) throw new Error(`Valor ETH inválido: ${eth}`)
  const [whole = '0', fraction = ''] = eth.split('.')
  return BigInt(whole) * WEI_PER_ETH + BigInt(fraction.padEnd(ETH_DECIMALS, '0'))
}

export const fromWei = (wei: bigint) => {
  const whole = wei / WEI_PER_ETH
  const fraction = (wei % WEI_PER_ETH).toString().padStart(ETH_DECIMALS, '0').replace(/0+$/, '')
  return fraction ? `${whole}.${fraction}` : whole.toString()
}

export const addEth = (...amounts: string[]) => fromWei(amounts.reduce((total, amount) => total + toWei(amount), 0n))

export const subtractEth = (amount: string, subtrahend: string) => fromWei(toWei(amount) - toWei(subtrahend))

export const multiplyEth = (amount: string, quantity: number) => {
  if (!Number.isSafeInteger(quantity) || quantity < 0) throw new Error(`Quantidade inválida: ${quantity}`)
  return fromWei(toWei(amount) * BigInt(quantity))
}

export const percentOfEth = (amount: string, basisPoints: number) => fromWei((toWei(amount) * BigInt(basisPoints)) / 10_000n)

export const compareEth = (left: string, right: string) => {
  const difference = toWei(left) - toWei(right)
  return difference === 0n ? 0 : difference > 0n ? 1 : -1
}

export const formatEth = (eth: string, minFractionDigits = 2) => {
  const [whole = '0', fraction = ''] = fromWei(toWei(eth)).split('.')
  return `${whole}.${fraction.padEnd(minFractionDigits, '0')}`
}

export const formatEthLabel = (eth: string) => `${formatEth(eth)} ETH`
