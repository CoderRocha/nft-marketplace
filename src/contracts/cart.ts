import * as v from 'valibot'
import { ethAmountSchema, quantitySchema } from '@contracts/money'
import { EDITION_IDS, editionSchema, nftSummarySchema } from '@contracts/nft'

export const COUPON_CODE_MAX = 24

export const cartLineSchema = v.object({
  id: v.string(),
  nftId: v.string(),
  editionId: v.picklist(EDITION_IDS),
  quantity: quantitySchema,
  acceptedPrice: ethAmountSchema,
  nft: nftSummarySchema,
  edition: editionSchema,
})

export type CartLine = v.InferOutput<typeof cartLineSchema>

export const cartSchema = v.object({
  id: v.string(),
  lines: v.array(cartLineSchema),
  couponCode: v.nullable(v.string()),
  itemCount: v.number(),
  updatedAt: v.string(),
})

export type Cart = v.InferOutput<typeof cartSchema>

export const addCartItemInputSchema = v.object({
  nftId: v.pipe(v.string(), v.nonEmpty()),
  editionId: v.picklist(EDITION_IDS),
  quantity: quantitySchema,
})

export type AddCartItemInput = v.InferOutput<typeof addCartItemInputSchema>

export const updateCartItemInputSchema = v.object({
  quantity: v.optional(quantitySchema),
  acceptPrice: v.optional(v.literal(true)),
})

export type UpdateCartItemInput = v.InferOutput<typeof updateCartItemInputSchema>

export const couponInputSchema = v.object({
  code: v.pipe(v.string(), v.trim(), v.toUpperCase(), v.nonEmpty(), v.maxLength(COUPON_CODE_MAX)),
})

export type CouponInput = v.InferOutput<typeof couponInputSchema>
