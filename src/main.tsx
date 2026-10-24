import '@/styles.css'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createQueryClient } from '@/query-client'
import { createAppRouter } from '@/router'
import { handleSessionExpiry } from '@/session-expiry'

const queryClient = createQueryClient()
const router = createAppRouter(queryClient)
handleSessionExpiry(queryClient, router)

const container = document.getElementById('app')
if (!container) throw new Error('Missing #app element')

createRoot(container).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
