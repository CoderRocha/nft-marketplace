import { newsletterSubscriptionSchema, type NewsletterInput } from '@contracts/newsletter'
import { request } from '@core/http'

export const subscribeNewsletter = (body: NewsletterInput) =>
  request('POST', '/newsletter', { schema: newsletterSubscriptionSchema, body })
