import { cn } from 'cn'
import { MailIcon, StarIcon, TriangleAlertIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { FaLinkedinIn, FaTwitter } from 'react-icons/fa6'
import { MAX_QUANTITY_PER_ORDER, type Edition, type NftDetail } from '@contracts/nft'
import { formatEthLabel, multiplyEth } from '@core/money'
import { QuantityStepper } from '@pattern/quantity-stepper'
import type { NftSearch } from '@features/nft/schemas'

export type PurchaseSelection = {
  nft: NftDetail
  edition: Edition
  quantity: number
  unavailable: boolean
}

export type PurchaseLayout = 'inline' | 'bar'

type NftPurchasePanelProps = {
  nft: NftDetail
  search: NftSearch
  onSearchChange: (next: Partial<NftSearch>) => void
  renderActions?: (selection: PurchaseSelection, layout: PurchaseLayout) => ReactNode
}

const Rating = ({ rating, reviewCount }: { rating: number; reviewCount: number }) => (
  <>
    <p className="hidden items-center gap-2 text-[0.8125rem] md:flex">
      <span className="flex text-primary" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon key={star} className={cn('size-3.5', star <= Math.round(rating) && 'fill-current')} />
        ))}
      </span>
      <span>
        <span className="sr-only">Nota {rating} de 5, </span>
        {reviewCount} avaliações de colecionadores
      </span>
    </p>
    <p className="flex items-center gap-1 rounded-full border border-primary px-2 py-0.5 text-[0.8125rem] md:hidden">
      <StarIcon aria-hidden="true" className="size-3.5 fill-primary text-primary" />
      <span className="sr-only">Nota </span>
      {rating}
      <span className="text-muted-foreground">
        ({reviewCount}
        <span className="sr-only"> avaliações</span>)
      </span>
    </p>
  </>
)

const ShareLinks = ({ name }: { name: string }) => {
  const url = encodeURIComponent(window.location.href)
  const text = encodeURIComponent(`Olha este NFT na Kurio: ${name}`)
  const links = [
    { label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`, icon: <FaLinkedinIn /> },
    { label: 'e-mail', href: `mailto:?subject=${text}&body=${url}`, icon: <MailIcon className="size-4" /> },
    { label: 'X (Twitter)', href: `https://twitter.com/intent/tweet?url=${url}&text=${text}`, icon: <FaTwitter /> },
  ]
  return (
    <div className="flex items-center gap-3 text-[0.8125rem] font-semibold">
      Compartilhar este NFT:
      <ul className="flex items-center gap-2">
        {links.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              target={link.href.startsWith('mailto') ? undefined : '_blank'}
              rel="noopener noreferrer"
              aria-label={`Compartilhar por ${link.label}`}
              className="flex size-6 items-center justify-center rounded-sm hover:text-primary"
            >
              {link.icon}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

const quantityHint = (edition: Edition, max: number, quantity: number) => {
  if (edition.available === 0) return null
  if (quantity < max) return `${edition.available} disponíveis nesta edição`
  return edition.available <= MAX_QUANTITY_PER_ORDER
    ? `Você selecionou todas as ${edition.available} unidades disponíveis`
    : `Limite de ${MAX_QUANTITY_PER_ORDER} unidades por pedido`
}

export const NftPurchasePanel = ({ nft, search, onSearchChange, renderActions }: NftPurchasePanelProps) => {
  const edition = nft.editions.find((candidate) => candidate.id === (search.edicao ?? nft.defaultEditionId)) ?? nft.editions[0]
  if (!edition) return null
  const max = Math.min(edition.available, MAX_QUANTITY_PER_ORDER)
  const quantity = Math.max(1, Math.min(search.qtd, max))
  const unavailable = edition.available === 0
  const selection = { nft, edition, quantity, unavailable }
  const hint = quantityHint(edition, max, quantity)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3 md:flex-col md:gap-2">
        <h1 className="text-xl font-bold md:text-2xl">{nft.name}</h1>
        <div className="hidden w-full flex-wrap items-center justify-between gap-2 border-b border-border pb-3 md:flex">
          <p className="text-lg font-bold text-primary">
            <span className="sr-only">Preço da edição {edition.label}: </span>
            {formatEthLabel(edition.price)}
          </p>
          <Rating rating={nft.rating} reviewCount={nft.reviewCount} />
        </div>
        <div className="md:hidden">
          <Rating rating={nft.rating} reviewCount={nft.reviewCount} />
        </div>
      </div>

      <section aria-labelledby="sobre-nft" className="flex flex-col gap-2">
        <h2 id="sobre-nft" className="hidden text-[0.8125rem] font-semibold md:block">
          Sobre este NFT:
        </h2>
        <p className="text-[0.8125rem] leading-relaxed text-muted-foreground">{nft.description}</p>
      </section>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-[0.8125rem] font-semibold">Edição:</legend>
        <div className="flex flex-wrap gap-2">
          {nft.editions.map((option) => {
            const soldOut = option.available === 0
            return (
              <label key={option.id} className="relative">
                <input
                  type="radio"
                  name="edicao"
                  value={option.id}
                  checked={option.id === edition.id}
                  disabled={soldOut && option.id !== edition.id}
                  onChange={() => {
                    onSearchChange({ edicao: option.id, qtd: 1 })
                  }}
                  className="peer sr-only"
                />
                <span
                  className={cn(
                    'flex cursor-pointer items-center rounded-full border border-border px-3 py-1 text-xs uppercase transition-colors peer-checked:border-primary peer-checked:text-primary peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 hover:border-primary/60',
                    soldOut && 'cursor-not-allowed text-muted-foreground line-through',
                  )}
                >
                  {option.label}
                  {soldOut && <span className="sr-only"> (esgotada)</span>}
                </span>
              </label>
            )
          })}
        </div>
        {unavailable && (
          <p role="alert" className="flex items-center gap-2 text-[0.8125rem] text-warning">
            <TriangleAlertIcon aria-hidden="true" className="size-4" />
            A edição {edition.label} está esgotada. Escolha outra edição para comprar.
          </p>
        )}
      </fieldset>

      <div className="hidden flex-wrap items-center gap-4 md:flex">
        <QuantityStepper
          label="Quantidade"
          value={unavailable ? 0 : quantity}
          max={max}
          disabled={unavailable}
          onChange={(qtd) => {
            onSearchChange({ qtd })
          }}
        />
        <div className="ml-auto flex gap-3">{renderActions?.(selection, 'inline')}</div>
      </div>
      {hint && <p className="hidden text-xs text-muted-foreground md:block">{hint}</p>}

      <dl className="flex flex-col gap-2 text-[0.8125rem] text-muted-foreground">
        <div className="flex gap-1">
          <dt>ID do token:</dt>
          <dd>{nft.tokenId}</dd>
        </div>
        <div className="flex gap-1">
          <dt>Coleção:</dt>
          <dd>{nft.collectionName}</dd>
        </div>
        <div className="flex gap-1">
          <dt>Atributos:</dt>
          <dd>{nft.attributes.join(', ')}</dd>
        </div>
      </dl>
      <div className="hidden md:block">
        <ShareLinks name={nft.name} />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 flex flex-col gap-3 rounded-t-3xl bg-card px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-[0.8125rem]">
            <span aria-hidden="true">Qtd.</span>
            <QuantityStepper
              label="Quantidade"
              value={unavailable ? 0 : quantity}
              max={max}
              disabled={unavailable}
              appearance="ghost"
              onChange={(qtd) => {
                onSearchChange({ qtd })
              }}
            />
          </div>
          <p className="text-lg font-bold text-primary">
            <span className="sr-only">Total: </span>
            {formatEthLabel(multiplyEth(edition.price, unavailable ? 0 : quantity))}
          </p>
        </div>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        <div className="flex gap-3">{renderActions?.(selection, 'bar')}</div>
      </div>
    </div>
  )
}
