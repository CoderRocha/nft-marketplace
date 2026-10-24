import { cn } from 'cn'
import * as v from 'valibot'
import { CATALOG_SORTS, CATALOG_SORT_IDS, CATALOG_TABS } from '@contracts/nft'
import type { CatalogSearch } from '@features/catalog/schemas'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui/select'

type CatalogToolbarProps = {
  search: CatalogSearch
  onChange: (next: Partial<CatalogSearch>) => void
}

const SORT_ITEMS = CATALOG_SORTS.map((sort) => ({ value: sort.id, label: sort.label }))

export const CatalogToolbar = ({ search, onChange }: CatalogToolbarProps) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div role="group" aria-label="Seção do catálogo" className="flex gap-4 overflow-x-auto [scrollbar-width:none]">
      {CATALOG_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          aria-pressed={search.aba === tab.id}
          onClick={() => {
            onChange({ aba: tab.id })
          }}
          className={cn(
            'shrink-0 border-b-2 border-transparent pb-1 text-[0.8125rem] whitespace-nowrap transition-colors hover:text-primary',
            search.aba === tab.id && 'border-primary font-semibold text-primary',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
    <div className="flex items-center gap-1 text-[0.8125rem]">
      <span id="catalogo-ordem">Ordenar por:</span>
      <Select
        items={SORT_ITEMS}
        value={search.ordem}
        onValueChange={(value) => {
          if (v.is(v.picklist(CATALOG_SORT_IDS), value)) onChange({ ordem: value })
        }}
      >
        <SelectTrigger aria-labelledby="catalogo-ordem" className="h-8 border-none bg-transparent px-1 hover:bg-transparent">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_ITEMS.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  </div>
)
