import { HttpResponse } from 'msw'
import * as v from 'valibot'
import { newsletterInputSchema } from '@contracts/newsletter'
import { endpoint, readJson, validationProblem } from '@mocks/network'

export const newsletterHandlers = [
  endpoint('post', '/newsletter', async ({ request }) => {
    const input = v.safeParse(newsletterInputSchema, await readJson(request))
    if (!input.success) return validationProblem({ email: ['Informe um e-mail válido.'] })
    return HttpResponse.json({ email: input.output.email, subscribedAt: new Date().toISOString() }, { status: 201 })
  }),
]
