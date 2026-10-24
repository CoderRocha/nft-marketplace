import { createFileRoute } from '@tanstack/react-router'
import { useSession } from '@core/session'
import { WalletsManager } from '@features/wallets/wallets-manager'

const WalletsRoute = () => {
  const session = useSession()
  return session && <WalletsManager key={session.user.id} userId={session.user.id} />
}

export const Route = createFileRoute('/_shop/_private/profile/wallets')({
  head: () => ({ meta: [{ title: 'Carteiras - Kurio' }] }),
  component: WalletsRoute,
})
