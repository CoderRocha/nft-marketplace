import { createFileRoute } from '@tanstack/react-router'

const LoginRoute = () => (
  <div className="mx-auto w-full max-w-shop px-4 py-10 md:px-6">
    <h1 className="text-2xl font-bold">Entrar</h1>
  </div>
)

export const Route = createFileRoute('/_shop/login')({ component: LoginRoute })
