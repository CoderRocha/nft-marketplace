import * as v from 'valibot'
import { ethAmountSchema } from '@contracts/money'

export const QUOTE_ISSUE_KINDS = ['price_changed', 'insufficient', 'sold_out'] as const

export type QuoteIssueKind = (typeof QUOTE_ISSUE_KINDS)[number]

export const quoteIssueSchema = v.object({
  lineId: v.string(),
  kind: v.picklist(QUOTE_ISSUE_KINDS),
  message: v.string(),
})

export type QuoteIssue = v.InferOutput<typeof quoteIssueSchema>

export const quoteSchema = v.object({
  id: v.string(),
  version: v.string(),
  coupon: v.nullable(v.object({ code: v.string(), percent: v.number() })),
  subtotal: ethAmountSchema,
  discount: ethAmountSchema,
  networkFee: ethAmountSchema,
  total: ethAmountSchema,
  itemCount: v.number(),
  issues: v.array(quoteIssueSchema),
  createdAt: v.string(),
  expiresAt: v.string(),
})

export type Quote = v.InferOutput<typeof quoteSchema>
