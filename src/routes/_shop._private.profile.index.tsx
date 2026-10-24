import { createFileRoute } from '@tanstack/react-router'
import { useSession } from '@core/session'
import { ProfileForm } from '@features/profile/profile-form'

const ProfileRoute = () => {
  const session = useSession()
  return session && <ProfileForm key={session.user.id} userId={session.user.id} />
}

export const Route = createFileRoute('/_shop/_private/profile/')({
  head: () => ({ meta: [{ title: 'Meu perfil - Kurio' }] }),
  component: ProfileRoute,
})
