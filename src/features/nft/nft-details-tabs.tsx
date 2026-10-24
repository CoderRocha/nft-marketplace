import { StarIcon } from 'lucide-react'
import { NETWORKS, type NftDetail } from '@contracts/nft'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ui/tabs'

const shortAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

const triggerClassName = 'h-9 flex-none px-0 text-[0.9375rem] data-active:font-semibold data-active:text-primary after:bg-primary'

export const NftDetailsTabs = ({ nft }: { nft: NftDetail }) => {
  const network = NETWORKS.find((candidate) => candidate.id === nft.network)?.label ?? nft.network
  return (
    <Tabs defaultValue="detalhes" className="gap-4">
      <TabsList variant="line" className="w-full justify-start gap-6 overflow-x-auto border-b border-border [scrollbar-width:none] md:gap-8">
        <TabsTrigger value="detalhes" className={triggerClassName}>
          Detalhes do NFT
        </TabsTrigger>
        <TabsTrigger value="avaliacoes" className={triggerClassName}>
          Avaliações<span className="hidden md:inline">&nbsp;de colecionadores</span> ({nft.reviewCount})
        </TabsTrigger>
      </TabsList>
      <TabsContent value="detalhes" className="flex flex-col gap-4 text-[0.8125rem] leading-relaxed text-muted-foreground">
        {nft.story.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <dl className="flex flex-col gap-3">
          <div>
            <dt className="font-semibold text-foreground">Rede:</dt>
            <dd>Cunhado na {network} com procedência imutável e metadados armazenados no IPFS.</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Contrato:</dt>
            <dd>
              <abbr title={nft.contractAddress} className="no-underline">
                {shortAddress(nft.contractAddress)}
              </abbr>{' '}
              · Contrato inteligente ERC-721 verificado.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Direitos autorais:</dt>
            <dd>
              Direitos autorais do criador: {nft.royaltyPercent}% nas vendas secundárias, pagos automaticamente pelos mercados compatíveis.
            </dd>
          </div>
        </dl>
      </TabsContent>
      <TabsContent value="avaliacoes" className="flex flex-col gap-4">
        <ul className="flex flex-col gap-4">
          {nft.reviews.map((review) => (
            <li key={review.id} className="flex flex-col gap-1 border-b border-border pb-4 text-[0.8125rem]">
              <p className="flex items-center gap-2">
                <span className="font-semibold">{review.author}</span>
                <span className="flex text-primary" aria-label={`Nota ${review.rating} de 5`}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon key={star} aria-hidden="true" className={star <= review.rating ? 'size-3 fill-current' : 'size-3'} />
                  ))}
                </span>
                <time dateTime={review.createdAt} className="text-xs text-muted-foreground">
                  {dateFormatter.format(new Date(review.createdAt))}
                </time>
              </p>
              <p className="text-muted-foreground">{review.comment}</p>
            </li>
          ))}
        </ul>
        {nft.reviews.length < nft.reviewCount && (
          <p className="text-xs text-muted-foreground">
            Mostrando as {nft.reviews.length} avaliações mais recentes de {nft.reviewCount}.
          </p>
        )}
      </TabsContent>
    </Tabs>
  )
}
