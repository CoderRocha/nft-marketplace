import * as v from 'valibot'

export const newsletterInputSchema = v.object({
  email: v.pipe(v.string(), v.trim(), v.email()),
})

export type NewsletterInput = v.InferOutput<typeof newsletterInputSchema>

export const newsletterSubscriptionSchema = v.object({
  email: v.string(),
  subscribedAt: v.string(),
})
