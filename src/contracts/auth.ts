import * as v from 'valibot'

export const PASSWORD_MIN = 8

export const PASSWORD_MAX = 72

export const USERNAME_PATTERN = /^[a-z0-9._]{3,24}$/

export const userSchema = v.object({
  id: v.string(),
  displayName: v.string(),
  username: v.string(),
  email: v.string(),
  avatarUrl: v.nullable(v.string()),
})

export type User = v.InferOutput<typeof userSchema>

export const sessionSchema = v.object({
  user: userSchema,
  expiresAt: v.string(),
})

export type Session = v.InferOutput<typeof sessionSchema>

export const authResultSchema = v.object({
  ...sessionSchema.entries,
  token: v.string(),
})

export type AuthResult = v.InferOutput<typeof authResultSchema>

export const loginInputSchema = v.object({
  email: v.pipe(v.string(), v.trim(), v.toLowerCase(), v.email()),
  password: v.pipe(v.string(), v.minLength(1)),
})

export type LoginInput = v.InferOutput<typeof loginInputSchema>

export const registerInputSchema = v.object({
  username: v.pipe(v.string(), v.trim(), v.toLowerCase(), v.regex(USERNAME_PATTERN)),
  email: v.pipe(v.string(), v.trim(), v.toLowerCase(), v.email()),
  password: v.pipe(v.string(), v.minLength(PASSWORD_MIN), v.maxLength(PASSWORD_MAX)),
})

export type RegisterInput = v.InferOutput<typeof registerInputSchema>
