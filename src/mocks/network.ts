import { delay, http, HttpResponse, type DefaultBodyType, type HttpResponseResolver, type PathParams } from 'msw'
import * as v from 'valibot'
import { PROBLEM_CONTENT_TYPE, type ApiErrorCode } from '@contracts/problem'
import { API_BASE_URL } from '@core/constants'
import { db, mutate, type FailureRule } from '@mocks/db'
import { latencyFor } from '@mocks/scenarios'

export const apiUrl = (path: string) => `${API_BASE_URL}${path}`

type ProblemInit = {
  status: number
  code: ApiErrorCode
  title: string
  detail?: string
  errors?: Record<string, string[]>
  extra?: Record<string, unknown>
  headers?: Record<string, string>
}

export const problem = ({ status, code, title, detail, errors, extra, headers }: ProblemInit) =>
  HttpResponse.json(
    { type: `https://kurio.dev/problemas/${code}`, title, status, detail, code, errors, ...extra },
    { status, headers: { 'Content-Type': PROBLEM_CONTENT_TYPE, ...headers } },
  )

export const validationProblem = (errors: Record<string, string[]>, detail = 'Revise os campos destacados.') =>
  problem({ status: 422, code: 'validation_error', title: 'Dados inválidos', detail, errors })

export const notFoundProblem = (detail: string) => problem({ status: 404, code: 'not_found', title: 'Não encontrado', detail })

export const fieldErrorsFrom = (issues: [v.BaseIssue<unknown>, ...v.BaseIssue<unknown>[]], messages: Record<string, string>) => {
  const fields = Object.keys(v.flatten(issues).nested ?? {})
  return Object.fromEntries(fields.map((field) => [field, [messages[field] ?? 'Valor inválido.']]))
}

const INJECTED_CODES: Record<number, ApiErrorCode> = {
  401: 'unauthenticated',
  403: 'forbidden',
  404: 'not_found',
  409: 'availability_conflict',
  422: 'validation_error',
  503: 'transient',
}

const injectedFailure = (rule: FailureRule) => {
  if (rule.kind === 'offline') return HttpResponse.error()
  return problem({
    status: rule.kind,
    code: INJECTED_CODES[rule.kind] ?? 'internal',
    title: rule.kind >= 500 ? 'Serviço indisponível' : 'Requisição recusada',
    detail: rule.kind >= 500 ? 'Tente novamente em instantes.' : 'Não foi possível concluir a operação.',
    headers: rule.kind === 503 ? { 'Retry-After': '1' } : {},
  })
}

type Method = FailureRule['method']

const interfere = async (method: Method, path: string, request: Request) => {
  const call = mutate((current) => (current.callCount += 1))
  await delay(latencyFor(db().scenario, method, path, new URL(request.url), call))
  const rule = db().failures.find((candidate) => candidate.method === method && candidate.path === path && candidate.remaining > 0)
  if (!rule) return undefined
  mutate(() => {
    rule.remaining -= 1
  })
  return injectedFailure(rule)
}

export const endpoint = <Params extends PathParams<keyof Params> = PathParams>(
  method: Method,
  path: string,
  resolver: HttpResponseResolver<Params>,
) => http[method]<Params, DefaultBodyType, DefaultBodyType>(apiUrl(path), async (info) => (await interfere(method, path, info.request)) ?? resolver(info))

export const readJson = async (request: Request): Promise<unknown> => {
  try {
    return await request.json()
  } catch {
    return null
  }
}
