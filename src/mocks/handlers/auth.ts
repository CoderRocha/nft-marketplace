import { HttpResponse } from 'msw'
import * as v from 'valibot'
import { loginInputSchema, registerInputSchema } from '@contracts/auth'
import { db, mutate } from '@mocks/db'
import { authenticate, bearerToken, createSession, hashPassword, toUser } from '@mocks/auth'
import { mergeGuestCart } from '@mocks/cart'
import { endpoint, fieldErrorsFrom, problem, readJson, validationProblem } from '@mocks/network'

const REGISTER_MESSAGES = {
  username: 'Use de 3 a 24 caracteres: letras minúsculas, números, ponto ou sublinhado.',
  email: 'Informe um e-mail válido.',
  password: 'A senha precisa ter entre 8 e 72 caracteres.',
}

const LOGIN_MESSAGES = {
  email: 'Informe um e-mail válido.',
  password: 'Informe sua senha.',
}

export const authHandlers = [
  endpoint('post', '/auth/register', async ({ request }) => {
    const input = v.safeParse(registerInputSchema, await readJson(request))
    if (!input.success) return validationProblem(fieldErrorsFrom(input.issues, REGISTER_MESSAGES))
    const { username, email, password } = input.output
    const errors: Record<string, string[]> = {}
    if (db().users.some((user) => user.email === email)) errors.email = ['Este e-mail já tem uma conta. Entre ou use outro e-mail.']
    if (db().users.some((user) => user.username === username)) errors.username = ['Este nome de usuário já está em uso.']
    if (Object.keys(errors).length > 0) {
      return problem({
        status: 409,
        code: errors.email ? 'email_taken' : 'username_taken',
        title: 'Conta já existente',
        detail: 'Alguns dados já pertencem a outra conta.',
        errors,
      })
    }
    const salt = crypto.randomUUID()
    const user = {
      id: `usr_${crypto.randomUUID()}`,
      displayName: username,
      username,
      email,
      avatarUrl: null,
      ensName: username.replace(/[^a-z0-9]/g, ''),
      walletNickname: '',
      passwordSalt: salt,
      passwordHash: await hashPassword(salt, password),
    }
    mutate((current) => {
      current.users.push(user)
    })
    const session = createSession(user.id)
    mergeGuestCart(request.headers.get('X-Cart-Id'), user.id)
    return HttpResponse.json({ token: session.token, expiresAt: session.expiresAt, user: toUser(user) }, { status: 201 })
  }),

  endpoint('post', '/auth/login', async ({ request }) => {
    const input = v.safeParse(loginInputSchema, await readJson(request))
    if (!input.success) return validationProblem(fieldErrorsFrom(input.issues, LOGIN_MESSAGES))
    const user = db().users.find((candidate) => candidate.email === input.output.email)
    const valid = user && (await hashPassword(user.passwordSalt, input.output.password)) === user.passwordHash
    if (!user || !valid) {
      return problem({
        status: 401,
        code: 'unauthenticated',
        title: 'E-mail ou senha incorretos',
        detail: 'Confira os dados e tente novamente.',
      })
    }
    const session = createSession(user.id)
    mergeGuestCart(request.headers.get('X-Cart-Id'), user.id)
    return HttpResponse.json({ token: session.token, expiresAt: session.expiresAt, user: toUser(user) })
  }),

  endpoint('get', '/auth/session', ({ request }) => {
    const auth = authenticate(request)
    if (auth instanceof Response) return auth
    return HttpResponse.json({ user: toUser(auth.user), expiresAt: auth.session.expiresAt })
  }),

  endpoint('post', '/auth/logout', ({ request }) => {
    const token = bearerToken(request)
    mutate((current) => {
      current.sessions = current.sessions.filter((session) => session.token !== token)
    })
    return new HttpResponse(null, { status: 204 })
  }),
]
