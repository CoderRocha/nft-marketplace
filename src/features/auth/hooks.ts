import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { login, logout, register } from '@core/api/auth'
import { saveDraft } from '@core/checkout-attempt'
import { sessionQuery } from '@core/queries'
import { endSession, startSession } from '@core/session'

export const useSignIn = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: login,
    onSuccess: (result) => {
      startSession(queryClient, result)
    },
  })
}

export const useSignUp = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: register,
    onSuccess: (result) => {
      startSession(queryClient, result)
    },
  })
}

export const useSignOut = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const signOut = useMutation({
    mutationFn: () => logout().catch(() => undefined),
    onSettled: () => {
      const userId = queryClient.getQueryData(sessionQuery().queryKey)?.user.id
      if (userId) saveDraft(userId, null)
      endSession(queryClient)
      toast.success('Você saiu da sua conta.')
      void navigate({ to: '/' })
    },
  })
  return () => {
    signOut.mutate()
  }
}
