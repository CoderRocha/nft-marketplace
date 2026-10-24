import { TanStackDevtools } from '@tanstack/react-devtools'
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'

const Devtools = () => (
  <TanStackDevtools
    plugins={[
      { name: 'TanStack Router', render: <TanStackRouterDevtoolsPanel /> },
      { name: 'TanStack Query', render: <ReactQueryDevtoolsPanel /> },
    ]}
  />
)

export default Devtools
