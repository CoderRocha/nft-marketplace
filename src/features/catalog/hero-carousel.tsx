import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { cn } from 'cn'
import { ArrowRightIcon } from 'lucide-react'
import { useState } from 'react'
import type { NftSummary } from '@contracts/nft'
import { nftHighlightsQuery } from '@core/queries'
import { buttonVariants } from '@ui/button'
import { Skeleton } from '@ui/skeleton'

type HeroDotsProps = {
  items: NftSummary[]
  active: number
  onSelect: (index: number) => void
  className?: string
}

const HeroDots = ({ items, active, onSelect, className }: HeroDotsProps) =>
  items.length > 1 ? (
    <div className={cn('-my-2 flex', className)}>
      {items.map((nft, index) => (
        <button
          key={nft.id}
          type="button"
          aria-label={`Mostrar destaque ${index + 1} de ${items.length}: ${nft.name}`}
          aria-current={index === active}
          className="group flex size-6 items-center justify-center rounded-full"
          onClick={() => {
            onSelect(index)
          }}
        >
          <span aria-hidden="true" className="size-2 rounded-full bg-primary/50 group-aria-current:bg-primary" />
        </button>
      ))}
    </div>
  ) : null

const HeroImage = ({ nft, sizes, className }: { nft: NftSummary | undefined; sizes: string; className: string }) =>
  nft ? (
    <Link to="/nfts/$nftId" params={{ nftId: nft.id }} className={cn('block overflow-hidden', className)}>
      <img
        src={nft.image.src}
        srcSet={nft.image.srcSet}
        sizes={sizes}
        alt={nft.image.alt}
        width={640}
        height={640}
        fetchPriority="high"
        className="aspect-square size-full object-cover"
      />
    </Link>
  ) : (
    <Skeleton className={cn('aspect-square', className)} />
  )

export const HeroCarousel = () => {
  const highlights = useQuery(nftHighlightsQuery())
  const [active, setActive] = useState(0)
  const items = highlights.data?.hero ?? []
  const current = highlights.isPending ? undefined : items[active]
  const showImage = highlights.isPending || current !== undefined

  return (
    <section aria-label="Destaques" aria-roledescription="carrossel">
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-primary-deep via-secondary to-card p-4 md:hidden">
        <div className="flex items-center gap-3">
          <div className="flex flex-1 flex-col gap-2">
            <p className="text-xs">Bem-vindo à Kurio</p>
            <h1 className="text-xl leading-tight font-bold uppercase">
              Seja dono da cultura digital
            </h1>
            <p className="text-xs leading-relaxed text-foreground/80">Descubra NFTs selecionados de criadores do mundo todo.</p>
            <Link to="/" hash="catalogo" className="mt-1 flex items-center gap-2 text-xs font-bold text-primary uppercase">
              Explorar
              <ArrowRightIcon className="size-4" />
            </Link>
          </div>
          {showImage && <HeroImage nft={current} sizes="40vw" className="w-[42%] rounded-2xl" />}
        </div>
        <HeroDots items={items} active={active} onSelect={setActive} className="mt-1 justify-center" />
      </div>

      <div className="hidden min-h-[28.75rem] items-center gap-10 md:grid md:grid-cols-[1fr_minmax(0,28.75rem)]">
        <div className="flex flex-col gap-4">
          <p className="text-[0.8125rem]">Bem-vindo à Kurio</p>
          <h1 className="text-4xl leading-[1.35] font-bold tracking-wide uppercase lg:text-5xl">Seja dono do futuro da arte digital</h1>
          <p className="max-w-md text-[0.8125rem] leading-relaxed text-muted-foreground">
            Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie artistas e tenha uma
            parte da cultura da internet.
          </p>
          <Link to="/" hash="catalogo" className={buttonVariants({ className: 'mt-4 w-fit px-6 uppercase' })}>
            Explorar
          </Link>
          <HeroDots items={items} active={active} onSelect={setActive} className="mt-6 self-end" />
        </div>
        {showImage && <HeroImage nft={current} sizes="28.75rem" className="w-full rounded-2xl" />}
      </div>
    </section>
  )
}
