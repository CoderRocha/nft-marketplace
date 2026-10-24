import { cartSchema, type AddCartItemInput, type CouponInput, type UpdateCartItemInput } from '@contracts/cart'
import { quoteSchema } from '@contracts/quote'
import { request } from '@core/http'

const linePath = (lineId: string) => `/cart/items/${encodeURIComponent(lineId)}`

export const fetchCart = (signal?: AbortSignal) => request('GET', '/cart', { schema: cartSchema, signal })

export const addCartItem = (body: AddCartItemInput) => request('POST', '/cart/items', { schema: cartSchema, body })

export const updateCartItem = (lineId: string, body: UpdateCartItemInput) =>
  request('PATCH', linePath(lineId), { schema: cartSchema, body })

export const removeCartItem = (lineId: string) => request('DELETE', linePath(lineId), { schema: cartSchema })

export const applyCoupon = (body: CouponInput) => request('PUT', '/cart/coupon', { schema: cartSchema, body })

export const removeCoupon = () => request('DELETE', '/cart/coupon', { schema: cartSchema })

export const fetchQuote = (signal?: AbortSignal) => request('POST', '/quotes', { schema: quoteSchema, signal })
