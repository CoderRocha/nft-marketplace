import type { ReactElement } from 'react'
import type { NftPage } from '@contracts/nft'
import { CatalogFilters } from '@features/catalog/catalog-filters'
import type { CatalogSearch } from '@features/catalog/schemas'
import { Button } from '@ui/button'
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@ui/sheet'

type FiltersSheetProps = {
  search: CatalogSearch
  facets: NftPage['facets'] | undefined
  total: number | undefined
  onChange: (next: Partial<CatalogSearch>) => void
  trigger: ReactElement
}

export const FiltersSheet = ({ search, facets, total, onChange, trigger }: FiltersSheetProps) => (
  <Sheet>
    <SheetTrigger render={trigger} />
    <SheetContent side="left" closeLabel="Fechar filtros" className="w-[85%] overflow-y-auto">
      <SheetHeader>
        <SheetTitle>Filtros</SheetTitle>
      </SheetHeader>
      <CatalogFilters search={search} facets={facets} onChange={onChange} className="px-4" />
      <SheetFooter>
        <SheetClose render={<Button />}>{total === undefined ? 'Ver resultados' : `Ver ${total} resultados`}</SheetClose>
      </SheetFooter>
    </SheetContent>
  </Sheet>
)
