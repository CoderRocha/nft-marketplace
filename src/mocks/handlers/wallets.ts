import { HttpResponse } from 'msw'
import * as v from 'valibot'
import { WALLET_ROLES, walletInputSchema } from '@contracts/wallet'
import { db, mutate } from '@mocks/db'
import { authenticate } from '@mocks/auth'
import { endpoint, fieldErrorsFrom, notFoundProblem, readJson, validationProblem } from '@mocks/network'

const WALLET_MESSAGES = {
  displayName: 'Use entre 2 e 60 caracteres.',
  nickname: 'Use entre 2 e 40 caracteres.',
  network: 'Selecione uma rede.',
  profileName: 'Use entre 2 e 60 caracteres.',
  address: 'Endereço inválido para a rede selecionada.',
  ensOrSecondary: 'Use no máximo 80 caracteres.',
  provider: 'Selecione o tipo de carteira.',
  referralCode: 'Use de 4 a 12 letras ou números.',
  email: 'Informe um e-mail válido.',
  ensName: 'Use de 3 a 32 caracteres: letras minúsculas, números ou hífen.',
}

const emptyWallets = () => ({ primary: null, secondary: null })

export const walletHandlers = [
  endpoint('get', '/me/wallets', ({ request }) => {
    const auth = authenticate(request)
    if (auth instanceof Response) return auth
    return HttpResponse.json(db().wallets[auth.user.id] ?? emptyWallets())
  }),

  endpoint<{ role: string }>('put', '/me/wallets/:role', async ({ request, params }) => {
    const auth = authenticate(request)
    if (auth instanceof Response) return auth
    const role = v.safeParse(v.picklist(WALLET_ROLES), params.role)
    if (!role.success) return notFoundProblem('Tipo de carteira desconhecido.')
    const input = v.safeParse(walletInputSchema, await readJson(request))
    if (!input.success) return validationProblem(fieldErrorsFrom(input.issues, WALLET_MESSAGES))
    const wallet = { ...input.output, role: role.output, updatedAt: new Date().toISOString() }
    mutate((current) => {
      current.wallets[auth.user.id] = { ...(current.wallets[auth.user.id] ?? emptyWallets()), [role.output]: wallet }
    })
    return HttpResponse.json(wallet)
  }),
]
