import { useLocation, useNavigate } from '@tanstack/react-router'
import { cn } from 'cn'
import { HeartIcon } from 'lucide-react'
import type { NftSummary } from '@contracts/nft'
import { useSession } from '@core/session'
import { useFavoriteIds, useToggleFavorite } from '@features/favorites/hooks'
import { Button } from '@ui/button'

type FavoriteButtonProps = {
  nft: NftSummary
  variant: 'overlay' | 'card' | 'button'
  className?: string
}

export const FavoriteButton = ({ nft, variant, className }: FavoriteButtonProps) => {
  const session = useSession()
  const location = useLocation()
  const navigate = useNavigate()
  const favorite = useFavoriteIds().has(nft.id)
  const toggle = useToggleFavorite(session?.user.id ?? '')
  const label = favorite ? `Remover ${nft.name} da lista de interesse` : `Adicionar ${nft.name} à lista de interesse`

  const onClick = () => {
    if (!session) {
      void navigate({ to: '/login', search: { redirect: location.href } })
      return
    }
    toggle.mutate({ nft, favorite: !favorite })
  }

  if (variant === 'button') {
    return (
      <Button variant="outline" aria-pressed={favorite} onClick={onClick} className={className}>
        <HeartIcon className={cn(favorite && 'fill-primary text-primary')} />
        {favorite ? 'Favoritado' : 'Favoritar'}
      </Button>
    )
  }

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={favorite}
      onClick={onClick}
      className={cn(
        'relative z-10 flex items-center justify-center text-foreground transition-colors hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
        variant === 'overlay' ? 'size-9 rounded-full border border-primary/40 bg-background/70' : 'size-8 rounded-md bg-card/90',
        className,
      )}
    >
      <HeartIcon className={cn('size-4', favorite && 'fill-primary text-primary')} />
    </button>
  )
}
