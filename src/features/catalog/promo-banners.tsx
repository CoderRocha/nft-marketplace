import { Link } from '@tanstack/react-router'
import { ArrowRightIcon } from 'lucide-react'
import type { CatalogSearch } from '@features/catalog/schemas'
import { buttonVariants } from '@ui/button'

type Banner = {
  title: string
  description: string
  search: Partial<CatalogSearch>
}

const BANNERS: Banner[] = [
  {
    title: 'Lançamentos gênesis de edição limitada',
    description: 'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
    search: { aba: 'lancamentos' },
  },
  {
    title: 'Arte digital selecionada e muito mais',
    description: 'Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.',
    search: { colecao: ['arte-digital'] },
  },
]

export const PromoBanners = () => (
  <section aria-label="Coleções em destaque" className="grid gap-6 md:grid-cols-2">
    {BANNERS.map((banner) => (
      <article key={banner.title} className="flex items-stretch gap-4 bg-card">
        <img
          src="/images/nfts/exemplo-nft-320.webp"
          alt=""
          width={320}
          height={320}
          loading="lazy"
          className="aspect-square w-2/5 rounded-xl object-cover sm:w-1/2"
        />
        <div className="flex flex-1 flex-col items-end justify-center gap-3 py-4 pr-4 text-right">
          <h2 className="text-[0.9375rem] leading-snug font-bold">{banner.title}</h2>
          <p className="text-xs leading-relaxed text-muted-foreground">{banner.description}</p>
          <Link to="/" search={banner.search} hash="catalogo" className={buttonVariants({ size: 'sm', className: 'h-8 px-4' })}>
            Explorar
            <ArrowRightIcon />
          </Link>
        </div>
      </article>
    ))}
  </section>
)
