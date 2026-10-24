import { HttpResponse } from 'msw'
import * as v from 'valibot'
import { addCartItemInputSchema, couponInputSchema, updateCartItemInputSchema } from '@contracts/cart'
import type { Edition } from '@contracts/nft'
import {
  buildQuote,
  findCoupon,
  findEdition,
  findNftRecord,
  isCouponActive,
  maxQuantityFor,
  readCart,
  resolveCartOwner,
  toCartResponse,
  writeCart,
} from '@mocks/cart'
import { endpoint, notFoundProblem, problem, readJson, validationProblem } from '@mocks/network'

const soldOutProblem = () =>
  problem({ status: 409, code: 'availability_conflict', title: 'Edição esgotada', detail: 'Esta edição não tem mais unidades disponíveis.' })

const limitProblem = (edition: Edition) =>
  problem({
    status: 409,
    code: 'availability_conflict',
    title: 'Quantidade indisponível',
    detail: `Você pode ter no máximo ${maxQuantityFor(edition)} unidades desta edição no carrinho.`,
    extra: { available: edition.available },
  })

export const cartHandlers = [
  endpoint('get', '/cart', ({ request }) => {
    const owner = resolveCartOwner(request)
    if (owner instanceof Response) return owner
    return HttpResponse.json(toCartResponse(readCart(owner)))
  }),

  endpoint('post', '/cart/items', async ({ request }) => {
    const owner = resolveCartOwner(request)
    if (owner instanceof Response) return owner
    const input = v.safeParse(addCartItemInputSchema, await readJson(request))
    if (!input.success) return validationProblem({ quantity: ['Escolha uma edição e uma quantidade válidas.'] })
    const nft = findNftRecord(input.output.nftId)
    if (!nft) return notFoundProblem('Este NFT não existe ou foi removido do catálogo.')
    const edition = findEdition(nft, input.output.editionId)
    if (!edition || edition.available === 0) return soldOutProblem()
    const existing = readCart(owner).lines.find((line) => line.nftId === nft.id && line.editionId === edition.id)
    const quantity = (existing?.quantity ?? 0) + input.output.quantity
    if (quantity > maxQuantityFor(edition)) return limitProblem(edition)
    const cart = writeCart(owner, (draft) => {
      const line = draft.lines.find((candidate) => candidate.nftId === nft.id && candidate.editionId === edition.id)
      if (line) {
        line.quantity = quantity
        line.acceptedPrice = edition.price
      } else {
        draft.lines.push({ id: `line_${crypto.randomUUID()}`, nftId: nft.id, editionId: edition.id, quantity, acceptedPrice: edition.price })
      }
    })
    return HttpResponse.json(toCartResponse(cart), { status: 201 })
  }),

  endpoint<{ lineId: string }>('patch', '/cart/items/:lineId', async ({ request, params }) => {
    const owner = resolveCartOwner(request)
    if (owner instanceof Response) return owner
    const input = v.safeParse(updateCartItemInputSchema, await readJson(request))
    if (!input.success) return validationProblem({ quantity: ['Informe uma quantidade válida.'] })
    const line = readCart(owner).lines.find((candidate) => candidate.id === params.lineId)
    if (!line) return notFoundProblem('Este item não está mais no carrinho.')
    const nft = findNftRecord(line.nftId)
    const edition = nft && findEdition(nft, line.editionId)
    if (!edition) return notFoundProblem('Este NFT não existe ou foi removido do catálogo.')
    const { quantity, acceptPrice } = input.output
    if (quantity !== undefined && quantity > line.quantity && edition.available === 0) return soldOutProblem()
    if (quantity !== undefined && quantity > line.quantity && quantity > maxQuantityFor(edition)) return limitProblem(edition)
    const cart = writeCart(owner, (draft) => {
      const target = draft.lines.find((candidate) => candidate.id === params.lineId)
      if (!target) return
      if (quantity !== undefined) target.quantity = quantity
      if (acceptPrice) target.acceptedPrice = edition.price
    })
    return HttpResponse.json(toCartResponse(cart))
  }),

  endpoint<{ lineId: string }>('delete', '/cart/items/:lineId', ({ request, params }) => {
    const owner = resolveCartOwner(request)
    if (owner instanceof Response) return owner
    const cart = writeCart(owner, (draft) => {
      draft.lines = draft.lines.filter((line) => line.id !== params.lineId)
    })
    return HttpResponse.json(toCartResponse(cart))
  }),

  endpoint('put', '/cart/coupon', async ({ request }) => {
    const owner = resolveCartOwner(request)
    if (owner instanceof Response) return owner
    const input = v.safeParse(couponInputSchema, await readJson(request))
    if (!input.success) return validationProblem({ code: ['Informe um código promocional.'] })
    const { code } = input.output
    if (!findCoupon(code)) {
      return problem({ status: 422, code: 'coupon_invalid', title: 'Cupom inválido', errors: { code: ['Este código promocional não existe.'] } })
    }
    if (!isCouponActive(code)) {
      return problem({ status: 422, code: 'coupon_expired', title: 'Cupom expirado', errors: { code: ['Este código promocional expirou.'] } })
    }
    const cart = writeCart(owner, (draft) => {
      draft.couponCode = code
    })
    return HttpResponse.json(toCartResponse(cart))
  }),

  endpoint('delete', '/cart/coupon', ({ request }) => {
    const owner = resolveCartOwner(request)
    if (owner instanceof Response) return owner
    const cart = writeCart(owner, (draft) => {
      draft.couponCode = null
    })
    return HttpResponse.json(toCartResponse(cart))
  }),

  endpoint('post', '/quotes', ({ request }) => {
    const owner = resolveCartOwner(request)
    if (owner instanceof Response) return owner
    return HttpResponse.json(buildQuote(readCart(owner)))
  }),
]
