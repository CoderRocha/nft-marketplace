import * as v from 'valibot'
import { USERNAME_PATTERN } from '@contracts/auth'
import { emailSchema, passwordSchema, safeRedirectSchema } from '@core/schemas'

export const signInSchema = v.object({
  email: emailSchema,
  password: v.pipe(v.string(), v.nonEmpty('Informe sua senha.')),
})

export const usernameSchema = v.pipe(
  v.string(),
  v.trim(),
  v.toLowerCase(),
  v.nonEmpty('Informe um nome de usuário.'),
  v.regex(USERNAME_PATTERN, 'Use de 3 a 24 caracteres: letras minúsculas, números, ponto ou sublinhado.'),
)

export const signUpSchema = v.pipe(
  v.object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: v.pipe(v.string(), v.nonEmpty('Confirme sua senha.')),
  }),
  v.forward(
    v.partialCheck(
      [['password'], ['confirmPassword']],
      (input) => input.password === input.confirmPassword,
      'As senhas não coincidem.',
    ),
    ['confirmPassword'],
  ),
)

export const authSearchSchema = v.object({
  redirect: safeRedirectSchema,
  motivo: v.fallback(v.optional(v.picklist(['expirada'])), undefined),
})

export type AuthSearch = v.InferOutput<typeof authSearchSchema>
