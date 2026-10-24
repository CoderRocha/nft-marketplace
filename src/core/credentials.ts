const SESSION_TOKEN_KEY = 'kurio:session-token'

const GUEST_CART_KEY = 'kurio:guest-cart'

const readStorage = (key: string) => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

const writeStorage = (key: string, value: string | null) => {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    return
  }
}

export const getSessionToken = () => readStorage(SESSION_TOKEN_KEY)

export const setSessionToken = (token: string | null) => {
  writeStorage(SESSION_TOKEN_KEY, token)
}

export const getGuestCartId = () => readStorage(GUEST_CART_KEY)

export const setGuestCartId = (cartId: string | null) => {
  writeStorage(GUEST_CART_KEY, cartId)
}
