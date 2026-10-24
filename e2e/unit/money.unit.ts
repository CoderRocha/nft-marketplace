import { expect, test } from '@playwright/test'
import { addEth, compareEth, formatEth, fromWei, multiplyEth, percentOfEth, subtractEth, toWei } from '@core/money'

test('soma e multiplica ETH sem perder precisão', () => {
  expect(addEth('0.1', '0.2')).toBe('0.3')
  expect(addEth('26.83', '0.016')).toBe('26.846')
  expect(multiplyEth('1.19', 2)).toBe('2.38')
  expect(multiplyEth('1.79', 9)).toBe('16.11')
  expect(multiplyEth('0.000000000000000001', 3)).toBe('0.000000000000000003')
  expect(subtractEth('26.846', '2.683')).toBe('24.163')
  expect(percentOfEth('26.83', 1000)).toBe('2.683')
})

test('converte e compara valores', () => {
  expect(toWei('1')).toBe(10n ** 18n)
  expect(fromWei(toWei('12.300'))).toBe('12.3')
  expect(compareEth('1.10', '1.1')).toBe(0)
  expect(compareEth('1.2', '1.19')).toBe(1)
  expect(() => toWei('1e3')).toThrow()
  expect(() => multiplyEth('1', 1.5)).toThrow()
})

test('formata com no mínimo duas casas', () => {
  expect(formatEth('1.1')).toBe('1.10')
  expect(formatEth('0.016')).toBe('0.016')
  expect(formatEth('0')).toBe('0.00')
  expect(formatEth('26.846')).toBe('26.846')
})
