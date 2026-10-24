import * as v from 'valibot'
import { PASSWORD_MAX, PASSWORD_MIN, USERNAME_PATTERN } from '@contracts/auth'

export const ENS_NAME_PATTERN = /^[a-z0-9-]{3,32}$/

export const AVATAR_MAX_BYTES = 1024 * 1024

export const AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const

export const profileSchema = v.object({
  displayName: v.string(),
  username: v.string(),
  email: v.string(),
  ensName: v.string(),
  walletNickname: v.string(),
  avatarUrl: v.nullable(v.string()),
})

export type Profile = v.InferOutput<typeof profileSchema>

export const profileInputSchema = v.object({
  displayName: v.pipe(v.string(), v.trim(), v.minLength(2), v.maxLength(60)),
  username: v.pipe(v.string(), v.trim(), v.toLowerCase(), v.regex(USERNAME_PATTERN)),
  email: v.pipe(v.string(), v.trim(), v.toLowerCase(), v.email()),
  ensName: v.pipe(v.string(), v.trim(), v.toLowerCase(), v.regex(ENS_NAME_PATTERN)),
  walletNickname: v.pipe(v.string(), v.trim(), v.minLength(2), v.maxLength(40)),
})

export type ProfileInput = v.InferOutput<typeof profileInputSchema>

export const passwordChangeInputSchema = v.object({
  currentPassword: v.pipe(v.string(), v.minLength(1)),
  newPassword: v.pipe(v.string(), v.minLength(PASSWORD_MIN), v.maxLength(PASSWORD_MAX)),
})

export type PasswordChangeInput = v.InferOutput<typeof passwordChangeInputSchema>
