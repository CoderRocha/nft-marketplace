import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_shop/_private/profile')({ component: Outlet })
