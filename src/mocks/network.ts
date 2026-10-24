import { HttpResponse } from 'msw'
import { PROBLEM_CONTENT_TYPE, type ApiErrorCode } from '@contracts/problem'
import { API_BASE_URL } from '@core/constants'

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
