import * as v from 'valibot'
import { PASSWORD_MAX, PASSWORD_MIN } from '@contracts/auth'

export const requiredText = (max = 120) =>
  v.pipe(
    v.string(),
    v.trim(),
    v.nonEmpty(() => 'Campo obrigatório.'),
    v.maxLength(max, () => `Use no máximo ${max} caracteres.`),
  )

export const optionalText = (max = 500) =>
  v.pipe(
    v.string(),
    v.trim(),
    v.maxLength(max, () => `Use no máximo ${max} caracteres.`),
  )

export const emailSchema = v.pipe(
  v.string(),
  v.trim(),
  v.nonEmpty(() => 'Informe seu e-mail.'),
  v.email(() => 'E-mail inválido.'),
)

export const passwordSchema = v.pipe(
  v.string(),
  v.minLength(PASSWORD_MIN, () => 'A senha precisa ter pelo menos 8 caracteres.'),
  v.maxLength(PASSWORD_MAX, () => `Use no máximo ${PASSWORD_MAX} caracteres.`),
)

export const safeRedirectSchema = v.fallback(v.optional(v.pipe(v.string(), v.regex(/^\/(?![/\\])/))), undefined)
