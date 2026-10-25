import { useQuery } from '@tanstack/react-query'
import { SearchIcon, SlidersHorizontalIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { nftListQuery } from '@core/queries'
import { FiltersSheet } from '@features/catalog/filters-sheet'
import { toListParams } from '@features/catalog/list-params'
import type { CatalogSearch } from '@features/catalog/schemas'
import { Button } from '@ui/button'

const SEARCH_DEBOUNCE_MS = 300

type MobileCatalogBarProps = {
  search: CatalogSearch
  onSearchChange: (next: Partial<CatalogSearch>, options?: { replace?: boolean }) => void
}

export const MobileCatalogBar = ({ search, onSearchChange }: MobileCatalogBarProps) => {
  const list = useQuery(nftListQuery(toListParams(search)))
  const [draft, setDraft] = useState(search.q)
  const [syncedQuery, setSyncedQuery] = useState(search.q)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => {
    window.clearTimeout(timer.current)
  }, [])

  if (search.q !== syncedQuery) {
    setSyncedQuery(search.q)
    setDraft(search.q)
  }

  return (
    <div className="flex items-center gap-3 md:hidden">
      <form
        role="search"
        className="relative flex-1"
        onSubmit={(event) => {
          event.preventDefault()
          window.clearTimeout(timer.current)
          onSearchChange({ q: draft.trim() })
        }}
      >
        <label htmlFor="busca-mobile" className="sr-only">
          Explorar coleções
        </label>
        <SearchIcon aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-primary" />
        <input
          id="busca-mobile"
          type="search"
          value={draft}
          placeholder="Explorar coleções"
          onChange={(event) => {
            const value = event.target.value
            setDraft(value)
            window.clearTimeout(timer.current)
            timer.current = window.setTimeout(() => {
              onSearchChange({ q: value.trim() }, { replace: true })
            }, SEARCH_DEBOUNCE_MS)
          }}
          className="h-12 w-full rounded-xl bg-card pr-4 pl-12 text-sm placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        />
      </form>
      <FiltersSheet
        search={search}
        facets={list.data?.facets}
        total={list.data?.total}
        onChange={onSearchChange}
        trigger={
          <Button size="icon-lg" aria-label="Abrir filtros" className="rounded-xl bg-linear-to-br from-primary to-primary-deep">
            <SlidersHorizontalIcon className="size-5" />
          </Button>
        }
      />
    </div>
  )
}
