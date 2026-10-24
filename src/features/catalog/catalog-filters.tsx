import { cn } from 'cn'
import { useState } from 'react'
import { COLLECTIONS, NETWORKS, type CollectionId, type NetworkId, type NftPage } from '@contracts/nft'
import type { CatalogSearch } from '@features/catalog/schemas'
import { Button } from '@ui/button'
import { Skeleton } from '@ui/skeleton'

type CatalogFiltersProps = {
  search: CatalogSearch
  facets: NftPage['facets'] | undefined
  onChange: (next: Partial<CatalogSearch>) => void
  className?: string
}

const toggle = <TId extends string>(list: TId[], id: TId) =>
  list.includes(id) ? list.filter((item) => item !== id) : [...list, id]

type FacetListProps<TId extends string> = {
  title: string
  options: ReadonlyArray<{ id: TId; label: string }>
  counts: Array<{ id: TId; count: number }> | undefined
  selected: TId[]
  onToggle: (id: TId) => void
}

const FacetList = <TId extends string>({ title, options, counts, selected, onToggle }: FacetListProps<TId>) => (
  <fieldset className="flex flex-col gap-2">
    <legend className="mb-2 text-base font-semibold">{title}</legend>
    <ul className="flex flex-col">
      {options.map((option) => {
        const active = selected.includes(option.id)
        const count = counts?.find((facet) => facet.id === option.id)?.count
        return (
          <li key={option.id}>
            <button
              type="button"
              aria-pressed={active}
              onClick={() => {
                onToggle(option.id)
              }}
              className={cn(
                'flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-[0.8125rem] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground',
                active && 'bg-secondary font-semibold text-primary',
              )}
            >
              <span>{option.label}</span>
              {count === undefined ? (
                <Skeleton className="h-3 w-6" />
              ) : (
                <span className={cn('tabular-nums', active ? 'text-primary' : 'text-foreground')}>({count})</span>
              )}
            </button>
          </li>
        )
      })}
    </ul>
  </fieldset>
)

const toSliderValue = (eth: string | undefined, fallback: number) => (eth === undefined ? fallback : Number(eth))

const toEth = (value: number) => value.toFixed(2)

type PriceRangeProps = {
  search: CatalogSearch
  bounds: { min: number; max: number }
  onApply: (range: { precoMin: string | undefined; precoMax: string | undefined }) => void
}

const PriceRange = ({ search, bounds, onApply }: PriceRangeProps) => {
  const [range, setRange] = useState({
    min: toSliderValue(search.precoMin, bounds.min),
    max: toSliderValue(search.precoMax, bounds.max),
  })
  const thumbClassName =
    'pointer-events-none absolute inset-x-0 top-1/2 h-0 w-full -translate-y-1/2 appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-3.5 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-3.5 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary focus-visible:outline-none focus-visible:[&::-webkit-slider-thumb]:ring-3 focus-visible:[&::-webkit-slider-thumb]:ring-ring/50'
  const span = bounds.max - bounds.min || 1
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-2 text-base font-semibold">Faixa de preço</legend>
      <div className="relative h-4">
        <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-primary/40" />
        <div
          className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-primary"
          style={{ left: `${((range.min - bounds.min) / span) * 100}%`, right: `${((bounds.max - range.max) / span) * 100}%` }}
        />
        <input
          type="range"
          aria-label="Preço mínimo em ETH"
          min={bounds.min}
          max={bounds.max}
          step={0.01}
          value={range.min}
          aria-valuetext={`${toEth(range.min)} ETH`}
          onChange={(event) => {
            setRange((current) => ({ ...current, min: Math.min(Number(event.target.value), current.max) }))
          }}
          className={thumbClassName}
        />
        <input
          type="range"
          aria-label="Preço máximo em ETH"
          min={bounds.min}
          max={bounds.max}
          step={0.01}
          value={range.max}
          aria-valuetext={`${toEth(range.max)} ETH`}
          onChange={(event) => {
            setRange((current) => ({ ...current, max: Math.max(Number(event.target.value), current.min) }))
          }}
          className={thumbClassName}
        />
      </div>
      <p className="text-[0.8125rem]" aria-live="polite">
        Preço: {toEth(range.min)} - {toEth(range.max)} ETH
      </p>
      <Button
        size="sm"
        className="h-7 w-fit px-3"
        onClick={() => {
          onApply({
            precoMin: range.min > bounds.min ? toEth(range.min) : undefined,
            precoMax: range.max < bounds.max ? toEth(range.max) : undefined,
          })
        }}
      >
        Aplicar
      </Button>
    </fieldset>
  )
}

export const CatalogFilters = ({ search, facets, onChange, className }: CatalogFiltersProps) => {
  const bounds = facets && { min: Math.floor(Number(facets.priceRange.min) * 100) / 100, max: Math.ceil(Number(facets.priceRange.max) * 100) / 100 }
  return (
    <div className={cn('flex flex-col gap-6', className)}>
      <FacetList<CollectionId>
        title="Coleções"
        options={COLLECTIONS}
        counts={facets?.collections}
        selected={search.colecao}
        onToggle={(id) => {
          onChange({ colecao: toggle(search.colecao, id) })
        }}
      />
      {bounds ? (
        <PriceRange
          key={`${search.precoMin ?? ''}-${search.precoMax ?? ''}-${bounds.min}-${bounds.max}`}
          search={search}
          bounds={bounds}
          onApply={onChange}
        />
      ) : (
        <Skeleton className="h-24 w-full" />
      )}
      <FacetList<NetworkId>
        title="Rede"
        options={NETWORKS}
        counts={facets?.networks}
        selected={search.rede}
        onToggle={(id) => {
          onChange({ rede: toggle(search.rede, id) })
        }}
      />
    </div>
  )
}
