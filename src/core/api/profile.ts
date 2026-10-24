import * as v from 'valibot'
import { profileSchema, type PasswordChangeInput, type ProfileInput } from '@contracts/profile'
import { request } from '@core/http'

export const fetchProfile = (signal?: AbortSignal) => request('GET', '/me/profile', { schema: profileSchema, signal })

export const updateProfile = (body: ProfileInput) => request('PATCH', '/me/profile', { schema: profileSchema, body })

export const uploadAvatar = (file: File) => {
  const body = new FormData()
  body.append('avatar', file)
  return request('PUT', '/me/avatar', { schema: profileSchema, body })
}

export const removeAvatar = () => request('DELETE', '/me/avatar', { schema: profileSchema })

export const changePassword = (body: PasswordChangeInput) => request('PUT', '/me/password', { schema: v.unknown(), body })
