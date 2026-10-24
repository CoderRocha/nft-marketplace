import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Profile } from '@contracts/profile'
import { changePassword, removeAvatar, updateProfile, uploadAvatar } from '@core/api/profile'
import { profileQuery } from '@core/queries'
import { updateSessionUser } from '@core/session'

const useApplyProfile = (userId: string) => {
  const queryClient = useQueryClient()
  return (profile: Profile) => {
    queryClient.setQueryData(profileQuery(userId).queryKey, profile)
    updateSessionUser(queryClient, {
      displayName: profile.displayName,
      username: profile.username,
      email: profile.email,
      avatarUrl: profile.avatarUrl,
    })
  }
}

export const useUpdateProfile = (userId: string) => useMutation({ mutationFn: updateProfile, onSuccess: useApplyProfile(userId) })

export const useUploadAvatar = (userId: string) => useMutation({ mutationFn: uploadAvatar, onSuccess: useApplyProfile(userId) })

export const useRemoveAvatar = (userId: string) => useMutation({ mutationFn: removeAvatar, onSuccess: useApplyProfile(userId) })

export const useChangePassword = () => useMutation({ mutationFn: changePassword })
