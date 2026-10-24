import { HttpResponse } from 'msw'
import * as v from 'valibot'
import { AVATAR_MAX_BYTES, AVATAR_TYPES, passwordChangeInputSchema, profileInputSchema } from '@contracts/profile'
import { db, mutate } from '@mocks/db'
import type { UserRecord } from '@mocks/fixtures/users'
import { authenticate, hashPassword } from '@mocks/auth'
import { endpoint, fieldErrorsFrom, problem, readJson, validationProblem } from '@mocks/network'

const PROFILE_MESSAGES = {
  displayName: 'Use entre 2 e 60 caracteres.',
  username: 'Use de 3 a 24 caracteres: letras minúsculas, números, ponto ou sublinhado.',
  email: 'Informe um e-mail válido.',
  ensName: 'Use de 3 a 32 caracteres: letras minúsculas, números ou hífen.',
  walletNickname: 'Use entre 2 e 40 caracteres.',
}

const PASSWORD_MESSAGES = {
  currentPassword: 'Informe sua senha atual.',
  newPassword: 'A nova senha precisa ter entre 8 e 72 caracteres.',
}

const toProfile = (user: UserRecord) => ({
  displayName: user.displayName,
  username: user.username,
  email: user.email,
  ensName: user.ensName,
  walletNickname: user.walletNickname,
  avatarUrl: user.avatarUrl,
})

const BASE64_CHUNK = 0x8000

const toDataUrl = async (file: File) => {
  const bytes = new Uint8Array(await file.arrayBuffer())
  let binary = ''
  for (let index = 0; index < bytes.length; index += BASE64_CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(index, index + BASE64_CHUNK))
  }
  return `data:${file.type};base64,${btoa(binary)}`
}

const isAvatarType = (type: string) => AVATAR_TYPES.some((allowed) => allowed === type)

export const profileHandlers = [
  endpoint('get', '/me/profile', ({ request }) => {
    const auth = authenticate(request)
    if (auth instanceof Response) return auth
    return HttpResponse.json(toProfile(auth.user))
  }),

  endpoint('patch', '/me/profile', async ({ request }) => {
    const auth = authenticate(request)
    if (auth instanceof Response) return auth
    const input = v.safeParse(profileInputSchema, await readJson(request))
    if (!input.success) return validationProblem(fieldErrorsFrom(input.issues, PROFILE_MESSAGES))
    const others = db().users.filter((user) => user.id !== auth.user.id)
    const errors: Record<string, string[]> = {}
    if (others.some((user) => user.email === input.output.email)) errors.email = ['Este e-mail já pertence a outra conta.']
    if (others.some((user) => user.username === input.output.username)) errors.username = ['Este nome de usuário já está em uso.']
    if (Object.keys(errors).length > 0) {
      return problem({
        status: 409,
        code: errors.email ? 'email_taken' : 'username_taken',
        title: 'Dados já em uso',
        detail: 'Alguns dados já pertencem a outra conta.',
        errors,
      })
    }
    mutate(() => {
      Object.assign(auth.user, input.output)
    })
    return HttpResponse.json(toProfile(auth.user))
  }),

  endpoint('put', '/me/avatar', async ({ request }) => {
    const auth = authenticate(request)
    if (auth instanceof Response) return auth
    const avatar = (await request.formData().catch(() => null))?.get('avatar')
    if (!(avatar instanceof File)) return validationProblem({ avatar: ['Selecione uma imagem.'] })
    if (!isAvatarType(avatar.type)) return validationProblem({ avatar: ['Envie uma imagem PNG, JPG ou WebP.'] })
    if (avatar.size > AVATAR_MAX_BYTES) return validationProblem({ avatar: ['A imagem precisa ter até 1 MB.'] })
    const avatarUrl = await toDataUrl(avatar)
    mutate(() => {
      auth.user.avatarUrl = avatarUrl
    })
    return HttpResponse.json(toProfile(auth.user))
  }),

  endpoint('delete', '/me/avatar', ({ request }) => {
    const auth = authenticate(request)
    if (auth instanceof Response) return auth
    mutate(() => {
      auth.user.avatarUrl = null
    })
    return HttpResponse.json(toProfile(auth.user))
  }),

  endpoint('put', '/me/password', async ({ request }) => {
    const auth = authenticate(request)
    if (auth instanceof Response) return auth
    const input = v.safeParse(passwordChangeInputSchema, await readJson(request))
    if (!input.success) return validationProblem(fieldErrorsFrom(input.issues, PASSWORD_MESSAGES))
    const { currentPassword, newPassword } = input.output
    if ((await hashPassword(auth.user.passwordSalt, currentPassword)) !== auth.user.passwordHash) {
      return validationProblem({ currentPassword: ['A senha atual está incorreta.'] })
    }
    if (currentPassword === newPassword) {
      return validationProblem({ newPassword: ['A nova senha precisa ser diferente da atual.'] })
    }
    const salt = crypto.randomUUID()
    const hash = await hashPassword(salt, newPassword)
    mutate(() => {
      auth.user.passwordSalt = salt
      auth.user.passwordHash = hash
    })
    return new HttpResponse(null, { status: 204 })
  }),
]
