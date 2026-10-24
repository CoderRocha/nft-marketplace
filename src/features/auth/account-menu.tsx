import { Link, useLocation } from '@tanstack/react-router'
import { HeartIcon, LogInIcon, LogOutIcon, UserIcon, WalletIcon } from 'lucide-react'
import { useSession } from '@core/session'
import { useSignOut } from '@features/auth/hooks'
import { Avatar, AvatarFallback, AvatarImage } from '@ui/avatar'
import { buttonVariants } from '@ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@ui/dropdown-menu'

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')

export const AccountMenu = () => {
  const session = useSession()
  const location = useLocation()
  const signOut = useSignOut()

  if (!session) {
    return (
      <Link
        to="/login"
        search={{ redirect: location.pathname === '/login' ? undefined : location.href }}
        className={buttonVariants({ size: 'sm', className: 'h-8 px-3' })}
      >
        <LogInIcon />
        Entrar
      </Link>
    )
  }

  const { user } = session
  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label={`Conta de ${user.displayName}`} className="rounded-full focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
        <Avatar className="size-8 border border-primary">
          {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
          <AvatarFallback className="bg-secondary text-xs font-bold text-primary">{initials(user.displayName)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col">
            <span className="font-semibold text-foreground">{user.displayName}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link to="/profile" />}>
          <UserIcon />
          Meu perfil
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link to="/profile/wallets" />}>
          <WalletIcon />
          Carteiras
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link to="/profile/favorites" />}>
          <HeartIcon />
          Lista de interesse
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut}>
          <LogOutIcon />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
