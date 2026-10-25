import axios, { isAxiosError, isCancel, type AxiosResponse, type Method } from 'axios'
import * as v from 'valibot'
import { problemSchema } from '@contracts/problem'
import { API_BASE_URL, REQUEST_TIMEOUT_MS } from '@core/constants'
import { ensureGuestCartId, getGuestCartId, getSessionToken } from '@core/credentials'
import { mocksReady } from '@core/mocks-ready'

export type FriendlyError = Error & {
  name: 'FriendlyError'
  status: number
  code: string
  title: string
  detail: string | undefined
  fieldErrors: Record<string, string[]>
  retryAfterMs: number | undefined
  payload: unknown
}

type FriendlyErrorInit = {
  status: number
  code: string
  title: string
  detail?: string | undefined
  fieldErrors?: Record<string, string[]> | undefined
  retryAfterMs?: number | undefined
  payload?: unknown
}

export const createFriendlyError = ({
  status,
  code,
  title,
  detail,
  fieldErrors = {},
  retryAfterMs,
  payload,
}: FriendlyErrorInit): FriendlyError =>
  Object.assign(new Error(detail ?? title), {
    name: 'FriendlyError' as const,
    status,
    code,
    title,
    detail,
    fieldErrors,
    retryAfterMs,
    payload,
  })

export const isFriendlyError = (error: unknown): error is FriendlyError =>
  error instanceof Error && error.name === 'FriendlyError'

export const hasErrorCode = (error: unknown, code: string) => isFriendlyError(error) && error.code === code

declare module '@tanstack/react-query' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- module augmentation needs interface merging
  interface Register {
    defaultError: FriendlyError
  }
}

const parseRetryAfter = (response: AxiosResponse) => {
  const seconds = Number(response.headers['retry-after'])
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : undefined
}

const fallbackTitle = (status: number) => {
  if (status === 401) return 'Sua sessão terminou'
  if (status === 403) return 'Acesso negado'
  if (status === 404) return 'Não encontrado'
  if (status === 429) return 'Muitas tentativas'
  if (status >= 500) return 'Serviço indisponível'
  return 'Algo deu errado'
}

const toFriendlyError = (error: unknown): FriendlyError => {
  if (isFriendlyError(error)) return error
  if (!isAxiosError(error)) {
    return createFriendlyError({ status: 0, code: 'unknown', title: 'Algo deu errado', detail: 'Tente novamente em instantes.' })
  }
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return createFriendlyError({
      status: 0,
      code: 'timeout',
      title: 'A resposta demorou demais',
      detail: 'Verifique sua conexão e tente novamente.',
    })
  }
  const { response } = error
  if (!response) {
    return createFriendlyError({
      status: 0,
      code: 'network_error',
      title: 'Sem conexão',
      detail: 'Não foi possível falar com o servidor. Verifique sua conexão.',
    })
  }
  const problem = v.safeParse(problemSchema, response.data)
  const status = response.status
  if (!problem.success) {
    return createFriendlyError({
      status,
      code: status >= 500 ? 'transient' : 'unknown',
      title: fallbackTitle(status),
      detail: 'Tente novamente em instantes.',
      retryAfterMs: parseRetryAfter(response),
    })
  }
  return createFriendlyError({
    status,
    code: problem.output.code ?? 'unknown',
    title: problem.output.title ?? fallbackTitle(status),
    detail: problem.output.detail,
    fieldErrors: problem.output.errors,
    retryAfterMs: parseRetryAfter(response),
    payload: problem.output,
  })
}

const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  paramsSerializer: { indexes: null },
})

http.interceptors.request.use(async (config) => {
  await mocksReady
  const token = getSessionToken()
  const guestCartId = token ? getGuestCartId() : ensureGuestCartId()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  if (guestCartId) config.headers.set('X-Cart-Id', guestCartId)
  return config
})

const unauthorizedListeners = new Set<(error: FriendlyError) => void>()

export const onUnauthorized = (listener: (error: FriendlyError) => void) => {
  unauthorizedListeners.add(listener)
  return () => {
    unauthorizedListeners.delete(listener)
  }
}

type QueryParams = Record<string, string | number | boolean | ReadonlyArray<string> | undefined>

type RequestOptions<TSchema> = {
  schema: TSchema
  params?: QueryParams
  body?: unknown
  headers?: Record<string, string>
  signal?: AbortSignal
  timeout?: number
}

export const request = async <TSchema extends v.GenericSchema>(
  method: Method,
  url: string,
  { schema, params, body, headers, signal, timeout }: RequestOptions<TSchema>,
): Promise<v.InferOutput<TSchema>> => {
  const sentToken = getSessionToken()
  try {
    const response = await http.request<unknown>({ method, url, params, data: body, headers, signal, timeout })
    const parsed = v.safeParse(schema, response.data)
    if (!parsed.success) {
      throw createFriendlyError({
        status: response.status,
        code: 'invalid_response',
        title: 'Resposta inesperada do servidor',
        detail: 'Tente novamente em instantes.',
      })
    }
    return parsed.output
  } catch (error) {
    if (isCancel(error)) throw error
    const friendly = toFriendlyError(error)
    const sessionStillCurrent = sentToken !== null && getSessionToken() === sentToken
    if (friendly.status === 401 && sessionStillCurrent) for (const listener of unauthorizedListeners) listener(friendly)
    throw friendly
  }
}
