import { MAX_QUANTITY_PER_ORDER, type Edition } from '@contracts/nft'
import type { Cart } from '@contracts/cart'
import type { Quote, QuoteIssue } from '@contracts/quote'
import { addEth, compareEth, formatEthLabel, multiplyEth, percentOfEth, subtractEth } from '@core/money'
import { db, mutate, type CartLineRecord, type CartRecord } from '@mocks/db'
import { COUPONS, NETWORK_FEES } from '@mocks/fixtures/coupons'
import type { NftRecord } from '@mocks/fixtures/nfts'
import { authenticate } from '@mocks/auth'
import { toSummary } from '@mocks/handlers/nfts'
import { problem } from '@mocks/network'

const GUEST_ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/

const QUOTE_TTL_MS = 10 * 60 * 1000

export const userCartKey = (userId: string) => `user:${userId}`

export const guestCartKey = (guestId: string) => `guest:${guestId}`

export const resolveCartOwner = (request: Request): string | Response => {
  if (request.headers.get('Authorization')) {
    const auth = authenticate(request)
    return auth instanceof Response ? auth : userCartKey(auth.user.id)
  }
  const guestId = request.headers.get('X-Cart-Id')
  if (guestId && GUEST_ID_PATTERN.test(guestId)) return guestCartKey(guestId)
  return problem({ status: 422, code: 'validation_error', title: 'Carrinho não identificado', detail: 'Recarregue a página e tente novamente.' })
}

const emptyCart = (): CartRecord => ({ id: `cart_${crypto.randomUUID()}`, lines: [], couponCode: null, updatedAt: new Date().toISOString() })

export const readCart = (owner: string) => db().carts[owner] ?? emptyCart()

export const writeCart = (owner: string, change: (cart: CartRecord) => void) =>
  mutate((current) => {
    const cart = current.carts[owner] ?? emptyCart()
    change(cart)
    cart.updatedAt = new Date().toISOString()
    current.carts[owner] = cart
    return cart
  })

export const findNftRecord = (nftId: string) => db().nfts.find((nft) => nft.id === nftId)

export const findEdition = (nft: NftRecord, editionId: string) => nft.editions.find((edition) => edition.id === editionId)

export const maxQuantityFor = (edition: Edition) => Math.min(edition.available, MAX_QUANTITY_PER_ORDER)

type ResolvedLine = { line: CartLineRecord; nft: NftRecord; edition: Edition }

const resolveLines = (cart: CartRecord): ResolvedLine[] =>
  cart.lines.flatMap((line) => {
    const nft = findNftRecord(line.nftId)
    const edition = nft && findEdition(nft, line.editionId)
    return nft && edition ? [{ line, nft, edition }] : []
  })

export const toCartResponse = (cart: CartRecord): Cart => {
  const lines = resolveLines(cart)
  return {
    id: cart.id,
    lines: lines.map(({ line, nft, edition }) => ({ ...line, nft: toSummary(nft), edition })),
    couponCode: cart.couponCode,
    itemCount: lines.reduce((total, { line }) => total + line.quantity, 0),
    updatedAt: cart.updatedAt,
  }
}

export const findCoupon = (code: string) => COUPONS.find((coupon) => coupon.code === code)

export const isCouponActive = (code: string) => {
  const coupon = findCoupon(code)
  return coupon !== undefined && Date.parse(coupon.expiresAt) > Date.now()
}

const issuesFor = ({ line, nft, edition }: ResolvedLine): QuoteIssue[] => {
  if (edition.available === 0) {
    return [{ lineId: line.id, kind: 'sold_out', message: `A edição ${edition.label} de ${nft.name} esgotou. Remova o item para continuar.` }]
  }
  const issues: QuoteIssue[] = []
  if (line.quantity > edition.available) {
    issues.push({
      lineId: line.id,
      kind: 'insufficient',
      message: `Só restam ${edition.available} unidades de ${nft.name} (edição ${edition.label}). Ajuste a quantidade.`,
    })
  }
  if (compareEth(edition.price, line.acceptedPrice) !== 0) {
    issues.push({
      lineId: line.id,
      kind: 'price_changed',
      message: `O preço de ${nft.name} mudou de ${formatEthLabel(line.acceptedPrice)} para ${formatEthLabel(edition.price)}.`,
    })
  }
  return issues
}

const hashString = (text: string) => {
  let hash = 5381
  for (let index = 0; index < text.length; index += 1) hash = (Math.imul(hash, 33) ^ text.charCodeAt(index)) >>> 0
  return hash.toString(16).padStart(8, '0')
}

export const buildQuote = (cart: CartRecord): Quote => {
  const lines = resolveLines(cart)
  const subtotal = addEth('0', ...lines.map(({ line, edition }) => multiplyEth(edition.price, line.quantity)))
  const coupon = cart.couponCode && isCouponActive(cart.couponCode) ? findCoupon(cart.couponCode) : undefined
  const discount = coupon ? percentOfEth(subtotal, coupon.percent * 100) : '0'
  const networks = [...new Set(lines.map(({ nft }) => nft.network))]
  const networkFee = addEth('0', ...networks.map((network) => NETWORK_FEES[network]))
  const total = addEth(subtractEth(subtotal, discount), networkFee)
  const issues = lines.flatMap(issuesFor)
  const version = hashString(
    JSON.stringify({
      lines: lines.map(({ line, edition }) => [line.nftId, line.editionId, line.quantity, edition.price, edition.available >= line.quantity]),
      coupon: coupon?.code ?? null,
      networkFee,
      issues: issues.map((issue) => [issue.lineId, issue.kind]),
    }),
  )
  const now = Date.now()
  return {
    id: `q_${version}`,
    version,
    coupon: coupon ? { code: coupon.code, percent: coupon.percent } : null,
    subtotal,
    discount,
    networkFee,
    total,
    itemCount: lines.reduce((count, { line }) => count + line.quantity, 0),
    issues,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + QUOTE_TTL_MS).toISOString(),
  }
}

export const mergeGuestCart = (guestId: string | null, userId: string) => {
  if (!guestId || !GUEST_ID_PATTERN.test(guestId)) return
  const guestKey = guestCartKey(guestId)
  const guest = db().carts[guestKey]
  if (!guest || guest.lines.length === 0) return
  writeCart(userCartKey(userId), (cart) => {
    for (const guestLine of guest.lines) {
      const nft = findNftRecord(guestLine.nftId)
      const edition = nft && findEdition(nft, guestLine.editionId)
      if (!edition) continue
      const existing = cart.lines.find((line) => line.nftId === guestLine.nftId && line.editionId === guestLine.editionId)
      const quantity = Math.min((existing?.quantity ?? 0) + guestLine.quantity, Math.max(maxQuantityFor(edition), 1))
      if (existing) existing.quantity = quantity
      else cart.lines.push({ ...guestLine, quantity })
    }
    cart.couponCode ??= guest.couponCode
  })
  mutate((current) => {
    current.carts = Object.fromEntries(Object.entries(current.carts).filter(([key]) => key !== guestKey))
  })
}
