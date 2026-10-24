import { http, HttpResponse } from 'msw'
import * as v from 'valibot'
import { newsletterInputSchema } from '@contracts/newsletter'
import { apiUrl, validationProblem } from '@mocks/network'

export const newsletterHandlers = [
  http.post(apiUrl('/newsletter'), async ({ request }) => {
    const input = v.safeParse(newsletterInputSchema, await request.json())
    if (!input.success) return validationProblem({ email: ['Informe um e-mail válido.'] })
    return HttpResponse.json({ email: input.output.email, subscribedAt: new Date().toISOString() }, { status: 201 })
  }),
]
