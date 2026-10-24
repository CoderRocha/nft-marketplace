import { createFileRoute } from '@tanstack/react-router'

const CheckoutRoute = () => (
  <div className="mx-auto w-full max-w-shop px-4 py-10 md:px-6">
    <h1 className="text-2xl font-bold">Pagamento</h1>
  </div>
)

export const Route = createFileRoute('/_shop/_private/checkout')({ component: CheckoutRoute })
