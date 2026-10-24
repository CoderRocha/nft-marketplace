import * as v from 'valibot'
import { authResultSchema, sessionSchema, type LoginInput, type RegisterInput } from '@contracts/auth'
import { request } from '@core/http'

export const fetchSession = (signal?: AbortSignal) => request('GET', '/auth/session', { schema: sessionSchema, signal })

export const login = (body: LoginInput) => request('POST', '/auth/login', { schema: authResultSchema, body })

export const register = (body: RegisterInput) => request('POST', '/auth/register', { schema: authResultSchema, body })

export const logout = () => request('POST', '/auth/logout', { schema: v.unknown() })
