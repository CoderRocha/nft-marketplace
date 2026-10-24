import type { NftListParams } from '@contracts/nft'
import { CATALOG_PAGE_SIZE } from '@core/constants'
import type { CatalogSearch } from '@features/catalog/schemas'

export const toListParams = (search: CatalogSearch): NftListParams => ({
  ...search,
  precoMin: search.precoMin,
  precoMax: search.precoMax,
  porPagina: CATALOG_PAGE_SIZE,
})
