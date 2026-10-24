import type { User } from '@contracts/auth'
import { db, mutate, type SessionRecord } from '@mocks/db'
import type { UserRecord } from '@mocks/fixtures/users'
import { problem } from '@mocks/network'
import { sessionDurationMs } from '@mocks/scenarios'

export const hashPassword = async (salt: string, password: string) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${password}`))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export const toUser = (record: UserRecord): User => ({
  id: record.id,
  displayName: record.displayName,
  username: record.username,
  email: record.email,
  avatarUrl: record.avatarUrl,
})

export const createSession = (userId: string): SessionRecord => {
  const session = {
    token: `sess_${crypto.randomUUID()}`,
    userId,
    expiresAt: new Date(Date.now() + sessionDurationMs(db().scenario)).toISOString(),
  }
  mutate((current) => {
    current.sessions.push(session)
  })
  return session
}

export const bearerToken = (request: Request) => request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') ?? null

const unauthenticated = () =>
  problem({ status: 401, code: 'unauthenticated', title: 'Entre para continuar', detail: 'Faça login para acessar esta área.' })

const sessionExpired = () =>
  problem({ status: 401, code: 'session_expired', title: 'Sua sessão expirou', detail: 'Entre novamente para continuar de onde parou.' })

type Authenticated = { user: UserRecord; session: SessionRecord }

export const authenticate = (request: Request): Authenticated | Response => {
  const token = bearerToken(request)
  if (!token) return unauthenticated()
  const session = db().sessions.find((candidate) => candidate.token === token)
  if (!session) return sessionExpired()
  if (Date.parse(session.expiresAt) <= Date.now()) {
    mutate((current) => {
      current.sessions = current.sessions.filter((candidate) => candidate.token !== token)
    })
    return sessionExpired()
  }
  const user = db().users.find((candidate) => candidate.id === session.userId)
  return user ? { user, session } : unauthenticated()
}
