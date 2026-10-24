export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

export const WS_URL = import.meta.env.VITE_WS_URL || window.location.origin

export const MOCKS_ENABLED = import.meta.env.VITE_MOCKS === 'true'

export const REQUEST_TIMEOUT_MS = 8_000

export const CATALOG_PAGE_SIZE = 9
