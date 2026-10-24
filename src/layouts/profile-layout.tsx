import { Link } from '@tanstack/react-router'
import {
  BadgePercentIcon,
  DownloadIcon,
  HeartIcon,
  LogOutIcon,
  MapPinIcon,
  ShoppingCartIcon,
  TriangleAlertIcon,
  UserIcon,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from 'cn'
import { ComingSoon } from '@pattern/coming-soon'

type ProfileLayoutProps = {
  children: ReactNode
  onSignOut: () => void
}

const itemClassName =
  'flex shrink-0 items-center gap-3 border-l-4 border-transparent px-3 py-2.5 text-[0.8125rem] whitespace-nowrap text-primary/90 transition-colors hover:bg-secondary aria-[current=page]:border-primary aria-[current=page]:bg-secondary aria-[current=page]:font-semibold aria-[current=page]:text-primary'

type NavEntry = { label: string; icon: LucideIcon } & ({ to: '/profile' | '/profile/wallets' | '/profile/favorites' } | { to: null })

const NAV: NavEntry[] = [
  { label: 'Dados do perfil', icon: UserIcon, to: '/profile' },
  { label: 'Carteiras', icon: MapPinIcon, to: '/profile/wallets' },
  { label: 'Atividade', icon: ShoppingCartIcon, to: null },
  { label: 'Lista de interesse', icon: HeartIcon, to: '/profile/favorites' },
  { label: 'Ofertas', icon: BadgePercentIcon, to: null },
  { label: 'Arquivos baixados', icon: DownloadIcon, to: null },
  { label: 'Suporte', icon: TriangleAlertIcon, to: null },
]

export const ProfileLayout = ({ children, onSignOut }: ProfileLayoutProps) => (
  <div className="mx-auto grid w-full max-w-shop gap-8 px-4 pt-6 md:grid-cols-[13.25rem_minmax(0,1fr)] md:px-6 lg:grid-cols-[14.5rem_minmax(0,1fr)]">
    <aside className="min-w-0 self-start bg-card md:py-4">
      <h2 className="hidden px-3 pb-2 text-[0.9375rem] font-semibold md:block">Meu perfil</h2>
      <nav aria-label="Meu perfil">
        <ul className="flex overflow-x-auto [scrollbar-width:none] md:flex-col">
          {NAV.map((entry) => (
            <li key={entry.label}>
              {entry.to ? (
                <Link to={entry.to} activeOptions={{ exact: true }} className={itemClassName}>
                  <entry.icon aria-hidden="true" className="size-4" />
                  {entry.label}
                </Link>
              ) : (
                <ComingSoon className={cn(itemClassName, 'cursor-not-allowed text-primary/60')}>
                  <entry.icon aria-hidden="true" className="size-4" />
                  {entry.label}
                </ComingSoon>
              )}
            </li>
          ))}
          <li className="md:mt-1 md:border-t md:border-border">
            <button type="button" onClick={onSignOut} className={cn(itemClassName, 'w-full font-semibold')}>
              <LogOutIcon aria-hidden="true" className="size-4" />
              Sair
            </button>
          </li>
        </ul>
      </nav>
    </aside>
    <div className="min-w-0">{children}</div>
  </div>
)
