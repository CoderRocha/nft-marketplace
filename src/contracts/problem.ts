import * as v from 'valibot'

export const PROBLEM_CONTENT_TYPE = 'application/problem+json'

export const API_ERROR_CODES = [
  'validation_error',
  'unauthenticated',
  'session_expired',
  'forbidden',
  'not_found',
  'email_taken',
  'username_taken',
  'availability_conflict',
  'quote_outdated',
  'idempotency_conflict',
  'coupon_invalid',
  'coupon_expired',
  'wallet_rejected',
  'transient',
  'internal',
] as const

export type ApiErrorCode = (typeof API_ERROR_CODES)[number]

export const problemSchema = v.looseObject({
  type: v.optional(v.string()),
  title: v.optional(v.string()),
  status: v.optional(v.number()),
  detail: v.optional(v.string()),
  code: v.optional(v.string()),
  errors: v.optional(v.record(v.string(), v.array(v.string()))),
})

export type Problem = v.InferOutput<typeof problemSchema>
