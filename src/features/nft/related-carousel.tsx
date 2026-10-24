import { useQuery } from '@tanstack/react-query'
import { relatedNftsQuery } from '@core/queries'
import { Carousel } from '@pattern/carousel'
import { NftCard, NftCardSkeleton } from '@features/catalog/nft-card'

const ITEM_CLASS_NAME = 'w-[calc(50%-0.5rem)] shrink-0 md:w-[calc(33.333%-0.667rem)] lg:w-[calc(20%-0.8rem)]'

type RelatedCarouselProps = {
  nftId: string
  title: string
}

export const RelatedCarousel = ({ nftId, title }: RelatedCarouselProps) => {
  const related = useQuery(relatedNftsQuery(nftId))
  if (related.isError || related.data?.length === 0) return null
  return (
    <section aria-labelledby={`relacionados-${nftId}`} className="flex flex-col gap-6">
      <h2 id={`relacionados-${nftId}`} className="border-b border-border pb-2 text-[0.9375rem] font-semibold text-primary">
        {title}
      </h2>
      <Carousel label={title}>
        {related.data
          ? related.data.map((nft) => <NftCard key={nft.id} nft={nft} sizes="(min-width: 1024px) 14rem, 50vw" className={ITEM_CLASS_NAME} />)
          : Array.from({ length: 5 }, (_, index) => <NftCardSkeleton key={index} className={ITEM_CLASS_NAME} />)}
      </Carousel>
    </section>
  )
}
