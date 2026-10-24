import type { ReactNode } from 'react'

export const ReceiptLayout = ({ children }: { children: ReactNode }) => (
  <main id="conteudo" tabIndex={-1} className="flex min-h-dvh items-center justify-center bg-background px-4 py-10 focus:outline-none">
    {children}
  </main>
)
