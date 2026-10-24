import { cn } from 'cn'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

type CatalogPaginationProps = {
  page: number
  pageCount: number
  onPageChange: (page: number) => void
}

const WINDOW = 2

const visiblePages = (page: number, pageCount: number) => {
  const pages = new Set([1, pageCount])
  for (let candidate = page - WINDOW; candidate <= page + WINDOW; candidate += 1) {
    if (candidate >= 1 && candidate <= pageCount) pages.add(candidate)
  }
  return [...pages].sort((left, right) => left - right)
}

const itemClassName =
  'flex size-7 items-center justify-center rounded-sm border border-border text-xs transition-colors hover:border-primary hover:text-primary'

export const CatalogPagination = ({ page, pageCount, onPageChange }: CatalogPaginationProps) => {
  if (pageCount <= 1) return null
  const pages = visiblePages(page, pageCount)
  return (
    <nav aria-label="Paginação do catálogo" className="flex justify-end">
      <ul className="flex items-center gap-2">
        {page > 1 && (
          <li>
            <button
              type="button"
              aria-label="Página anterior"
              className={itemClassName}
              onClick={() => {
                onPageChange(page - 1)
              }}
            >
              <ChevronLeftIcon className="size-3.5" />
            </button>
          </li>
        )}
        {pages.map((number, index) => (
          <li key={number} className="flex items-center gap-2">
            {index > 0 && number - (pages[index - 1] ?? number) > 1 && <span aria-hidden="true">…</span>}
            <button
              type="button"
              aria-label={`Página ${number}`}
              aria-current={number === page ? 'page' : undefined}
              className={cn(itemClassName, number === page && 'border-primary bg-primary font-bold text-primary-foreground hover:text-primary-foreground')}
              onClick={() => {
                onPageChange(number)
              }}
            >
              {number}
            </button>
          </li>
        ))}
        {page < pageCount && (
          <li>
            <button
              type="button"
              aria-label="Próxima página"
              className={itemClassName}
              onClick={() => {
                onPageChange(page + 1)
              }}
            >
              <ChevronRightIcon className="size-3.5" />
            </button>
          </li>
        )}
      </ul>
    </nav>
  )
}
