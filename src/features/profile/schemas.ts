import * as v from 'valibot'
import { PASSWORD_MAX, PASSWORD_MIN } from '@contracts/auth'
import { ENS_NAME_PATTERN } from '@contracts/profile'
import { emailSchema, requiredText } from '@core/schemas'
import { usernameSchema } from '@features/auth/schemas'

const hasPasswordChange = (input: { currentPassword: string; newPassword: string; confirmNewPassword: string }) =>
  input.currentPassword !== '' || input.newPassword !== '' || input.confirmNewPassword !== ''

export const ensNameSchema = v.pipe(
  v.string(),
  v.trim(),
  v.toLowerCase(),
  v.nonEmpty('Informe o nome ENS.'),
  v.regex(ENS_NAME_PATTERN, 'Use de 3 a 32 caracteres: letras minúsculas, números ou hífen.'),
)

export const profileFormSchema = v.pipe(
  v.object({
    displayName: v.pipe(requiredText(60), v.minLength(2, 'Use pelo menos 2 caracteres.')),
    username: usernameSchema,
    email: emailSchema,
    ensName: ensNameSchema,
    walletNickname: v.pipe(requiredText(40), v.minLength(2, 'Use pelo menos 2 caracteres.')),
    currentPassword: v.string(),
    newPassword: v.string(),
    confirmNewPassword: v.string(),
  }),
  v.forward(
    v.partialCheck(
      [['currentPassword'], ['newPassword'], ['confirmNewPassword']],
      (input) => !hasPasswordChange(input) || input.currentPassword !== '',
      'Informe sua senha atual para trocar a senha.',
    ),
    ['currentPassword'],
  ),
  v.forward(
    v.partialCheck(
      [['currentPassword'], ['newPassword'], ['confirmNewPassword']],
      (input) => !hasPasswordChange(input) || (input.newPassword.length >= PASSWORD_MIN && input.newPassword.length <= PASSWORD_MAX),
      'A nova senha precisa ter entre 8 e 72 caracteres.',
    ),
    ['newPassword'],
  ),
  v.forward(
    v.partialCheck(
      [['newPassword'], ['confirmNewPassword']],
      (input) => input.newPassword === input.confirmNewPassword,
      'As senhas não coincidem.',
    ),
    ['confirmNewPassword'],
  ),
)

export type ProfileFormValues = v.InferInput<typeof profileFormSchema>
