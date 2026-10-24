import { delay, HttpResponse } from 'msw'
import * as v from 'valibot'
import { createOrderInputSchema, IDEMPOTENCY_HEADER, ORDER_STATUSES, walletConnectionInputSchema } from '@contracts/order'
import { isValidAddress } from '@contracts/wallet'
import { REQUEST_TIMEOUT_MS } from '@core/constants'
import { hashText } from '@core/hash'
import { addEth } from '@core/money'
import { db, mutate } from '@mocks/db'
import { authenticate } from '@mocks/auth'
import { buildQuote, findNftRecord, readCart, userCartKey } from '@mocks/cart'
import { endpoint, notFoundProblem, problem, readJson, validationProblem } from '@mocks/network'
import { updateNftEdition } from '@mocks/nft-updates'
import { createOrder, findOrder, findOrderByKey, scheduleSettlement, settleOrder, toOrder } from '@mocks/orders'

const COLLECTOR_MESSAGES: Record<string, string> = {
  displayName: 'Use entre 2 e 60 caracteres.',
  username: 'Use de 3 a 24 caracteres.',
  nickname: 'Use entre 2 e 40 caracteres.',
  network: 'Selecione uma rede.',
  profileName: 'Use entre 2 e 60 caracteres.',
  address: 'Endereço inválido para a rede selecionada.',
  ensOrSecondary: 'Use no máximo 80 caracteres.',
  provider: 'Selecione o tipo de carteira.',
  referralCode: 'Use de 4 a 12 letras ou números.',
  email: 'Informe um e-mail válido.',
  ensName: 'Use de 3 a 32 caracteres: letras minúsculas, números ou hífen.',
  note: 'Use no máximo 500 caracteres.',
}

const collectorErrors = (issues: [v.BaseIssue<unknown>, ...v.BaseIssue<unknown>[]]) =>
  Object.fromEntries(
    Object.keys(v.flatten(issues).nested ?? {}).map((path) => {
      const field = path.replace(/^collector\./, '')
      return [field, [COLLECTOR_MESSAGES[field] ?? 'Revise este campo.']]
    }),
  )

const PRICE_INCREASE = '0.05'

const applyCheckoutScenario = (userId: string) => {
  const { flags } = db()
  const first = readCart(userCartKey(userId)).lines[0]
  if (!first || (!flags.priceChangePending && !flags.soldOutPending)) return
  const edition = findNftRecord(first.nftId)?.editions.find((candidate) => candidate.id === first.editionId)
  if (!edition) return
  if (flags.priceChangePending) updateNftEdition(first.nftId, first.editionId, { price: addEth(edition.price, PRICE_INCREASE) })
  if (flags.soldOutPending) updateNftEdition(first.nftId, first.editionId, { available: 0 })
  mutate((current) => {
    current.flags.priceChangePending = false
    current.flags.soldOutPending = false
  })
}

export const orderHandlers = [
  endpoint('post', '/wallet-connections', async ({ request }) => {
    const auth = authenticate(request)
    if (auth instanceof Response) return auth
    const input = v.safeParse(walletConnectionInputSchema, await readJson(request))
    if (!input.success || !isValidAddress(input.output.network, input.output.address)) {
      return validationProblem({ address: ['Escolha uma carteira com endereço válido para a rede.'] })
    }
    if (db().flags.walletRejections > 0) {
      mutate((current) => {
        current.flags.walletRejections -= 1
      })
      return problem({
        status: 409,
        code: 'wallet_rejected',
        title: 'Conexão recusada',
        detail: 'A carteira recusou a conexão. Confira o aplicativo da carteira e tente novamente.',
      })
    }
    const connection = { id: `conn_${crypto.randomUUID()}`, ...input.output, connectedAt: new Date().toISOString(), userId: auth.user.id }
    mutate((current) => {
      current.connections = [...current.connections.filter((candidate) => candidate.userId !== auth.user.id), connection]
    })
    return HttpResponse.json(connection, { status: 201 })
  }),

  endpoint<{ connectionId: string }>('delete', '/wallet-connections/:connectionId', ({ request, params }) => {
    const auth = authenticate(request)
    if (auth instanceof Response) return auth
    mutate((current) => {
      current.connections = current.connections.filter(
        (connection) => !(connection.id === params.connectionId && connection.userId === auth.user.id),
      )
    })
    return new HttpResponse(null, { status: 204 })
  }),

  endpoint('post', '/orders', async ({ request }) => {
    const auth = authenticate(request)
    if (auth instanceof Response) return auth
    const idempotencyKey = request.headers.get(IDEMPOTENCY_HEADER)
    if (!idempotencyKey) return validationProblem({ pedido: ['Envie o cabeçalho Idempotency-Key.'] }, 'Pedido sem chave de idempotência.')
    const body = await readJson(request)
    const payloadHash = hashText(JSON.stringify(body))
    const existing = findOrderByKey(auth.user.id, idempotencyKey)
    if (existing) {
      if (existing.payloadHash !== payloadHash) {
        return problem({
          status: 422,
          code: 'idempotency_conflict',
          title: 'Pedido em conflito',
          detail: 'Esta tentativa já foi usada com outros dados. Revise o pedido e confirme novamente.',
        })
      }
      return HttpResponse.json(toOrder(settleOrder(existing)), { headers: { 'Idempotent-Replayed': 'true' } })
    }
    const input = v.safeParse(createOrderInputSchema, body)
    if (!input.success) return validationProblem(collectorErrors(input.issues))
    applyCheckoutScenario(auth.user.id)
    const cart = readCart(userCartKey(auth.user.id))
    const quote = buildQuote(cart)
    if (cart.lines.length === 0) {
      return problem({ status: 409, code: 'availability_conflict', title: 'Carrinho vazio', detail: 'Adicione NFTs ao carrinho antes de pagar.' })
    }
    if (quote.version !== input.output.quoteVersion || quote.issues.length > 0) {
      return problem({
        status: 409,
        code: 'quote_outdated',
        title: 'Os valores do pedido mudaram',
        detail: 'Preço, disponibilidade, cupom ou taxa mudaram desde a sua revisão. Confira os novos valores e confirme de novo.',
        extra: { quote },
      })
    }
    const connection = db().connections.find((candidate) => candidate.id === input.output.connectionId && candidate.userId === auth.user.id)
    if (!connection) {
      return problem({ status: 409, code: 'wallet_rejected', title: 'Carteira desconectada', detail: 'Conecte a carteira novamente para pagar.' })
    }
    const order = createOrder({ userId: auth.user.id, idempotencyKey, payloadHash, input: input.output, quote, connection })
    scheduleSettlement(order.id)
    if (db().flags.orderTimeoutPending) {
      mutate((current) => {
        current.flags.orderTimeoutPending = false
      })
      await delay(REQUEST_TIMEOUT_MS + 1500)
    }
    return HttpResponse.json(toOrder(order), { status: 201 })
  }),

  endpoint('get', '/orders', ({ request }) => {
    const auth = authenticate(request)
    if (auth instanceof Response) return auth
    const status = v.safeParse(v.picklist(ORDER_STATUSES), new URL(request.url).searchParams.get('status'))
    const orders = db()
      .orders.filter((order) => order.userId === auth.user.id)
      .map(settleOrder)
      .filter((order) => !status.success || order.status === status.output)
    return HttpResponse.json(orders.map(toOrder))
  }),

  endpoint<{ orderId: string }>('get', '/orders/:orderId', ({ request, params }) => {
    const auth = authenticate(request)
    if (auth instanceof Response) return auth
    const order = findOrder(params.orderId)
    if (!order) return notFoundProblem('Este pedido não existe.')
    if (order.userId !== auth.user.id) {
      return problem({ status: 403, code: 'forbidden', title: 'Pedido de outra conta', detail: 'Você não tem acesso a este pedido.' })
    }
    return HttpResponse.json(toOrder(settleOrder(order)))
  }),
]
