import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { formatEthLabel } from '@core/money'
import { nftHighlightsQuery } from '@core/queries'
import { Skeleton } from '@ui/skeleton'

export const FeaturedOffer = () => {
  const highlights = useQuery(nftHighlightsQuery())
  if (highlights.isPending) return <Skeleton className="aspect-[3/4] w-full" />
  const featured = highlights.data?.featured
  if (!featured) return null
  return (
    <section aria-labelledby="oferta-destaque" className="flex flex-col gap-2 bg-card p-4">
      <h2 id="oferta-destaque" className="text-lg font-bold tracking-wide text-primary uppercase">
        NFT em destaque
      </h2>
      <p className="text-center text-[0.9375rem] font-semibold tracking-wide uppercase">Oferta limitada</p>
      <Link to="/nfts/$nftId" params={{ nftId: featured.id }} className="group flex flex-col gap-2">
        <img
          src={featured.image.src}
          srcSet={featured.image.srcSet}
          sizes="17.5rem"
          alt={featured.image.alt}
          width={640}
          height={640}
          loading="lazy"
          className="aspect-square w-full rounded-2xl object-cover"
        />
        <span className="text-[0.8125rem] group-hover:text-primary">{featured.name}</span>
        <span className="text-sm font-bold text-primary">
          {formatEthLabel(featured.price)}
          {featured.compareAtPrice && (
            <span className="ml-2 text-[0.8125rem] font-normal text-muted-foreground line-through">
              <span className="sr-only">Preço anterior: </span>
              {formatEthLabel(featured.compareAtPrice)}
            </span>
          )}
        </span>
      </Link>
    </section>
  )
}
