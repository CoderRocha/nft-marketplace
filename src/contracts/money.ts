import * as v from 'valibot'

export const ETH_AMOUNT_PATTERN = /^\d+(\.\d{1,18})?$/

export const ethAmountSchema = v.pipe(v.string(), v.regex(ETH_AMOUNT_PATTERN))

export const quantitySchema = v.pipe(v.number(), v.integer(), v.minValue(1))
