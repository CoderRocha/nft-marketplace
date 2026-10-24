import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useSignOut } from '@features/auth/hooks'
import { ProfileLayout } from '@layouts/profile-layout'

const ProfileRoute = () => {
  const signOut = useSignOut()
  return (
    <ProfileLayout onSignOut={signOut}>
      <Outlet />
    </ProfileLayout>
  )
}

export const Route = createFileRoute('/_shop/_private/profile')({ component: ProfileRoute })
