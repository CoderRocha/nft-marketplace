import type { ReactNode } from 'react'

export const ReceiptLayout = ({ children }: { children: ReactNode }) => (
  <main id="conteudo" className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
    {children}
  </main>
)
