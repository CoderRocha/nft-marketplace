import * as v from 'valibot'
import { hashText } from '@core/hash'

const attemptSchema = v.object({
  key: v.string(),
  payloadHash: v.string(),
  orderId: v.nullable(v.string()),
})

export type CheckoutAttempt = v.InferOutput<typeof attemptSchema>

const attemptStorageKey = (userId: string) => `kurio:checkout-attempt:${userId}`

const draftStorageKey = (userId: string) => `kurio:checkout-draft:${userId}`

const readJson = (key: string): unknown => {
  try {
    return JSON.parse(sessionStorage.getItem(key) ?? 'null')
  } catch {
    return null
  }
}

const writeJson = (key: string, value: unknown) => {
  try {
    if (value === null) sessionStorage.removeItem(key)
    else sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    return
  }
}

export const readAttempt = (userId: string) => {
  const stored = v.safeParse(attemptSchema, readJson(attemptStorageKey(userId)))
  return stored.success ? stored.output : null
}

export const saveAttempt = (userId: string, attempt: CheckoutAttempt | null) => {
  writeJson(attemptStorageKey(userId), attempt)
}

export const attemptFor = (userId: string, payload: unknown): CheckoutAttempt => {
  const payloadHash = hashText(JSON.stringify(payload))
  const current = readAttempt(userId)
  if (current?.payloadHash === payloadHash) return current
  const next = { key: crypto.randomUUID(), payloadHash, orderId: null }
  saveAttempt(userId, next)
  return next
}

export const readDraft = (userId: string) => readJson(draftStorageKey(userId))

export const saveDraft = (userId: string, draft: unknown) => {
  writeJson(draftStorageKey(userId), draft)
}
