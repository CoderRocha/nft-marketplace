import { createFileRoute, Outlet } from '@tanstack/react-router'
import { requireSession } from '@core/session'

export const Route = createFileRoute('/_shop/_private')({
  beforeLoad: async ({ context, location }) => {
    await requireSession(context.queryClient, location.href)
  },
  component: Outlet,
})
