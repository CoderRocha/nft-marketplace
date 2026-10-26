import * as v from 'valibot'
import { ethAmountSchema } from '@contracts/money'
import { CATALOG_SORT_IDS, CATALOG_TAB_IDS, COLLECTION_IDS, NETWORK_IDS } from '@contracts/nft'
import { searchListSchema, searchNumberSchema } from '@core/schemas'

export const catalogSearchSchema = v.object({
  q: v.fallback(v.optional(v.pipe(v.string(), v.maxLength(80)), ''), ''),
  aba: v.fallback(v.optional(v.picklist(CATALOG_TAB_IDS), 'todos'), 'todos'),
  colecao: v.fallback(v.optional(searchListSchema(v.picklist(COLLECTION_IDS)), []), []),
  rede: v.fallback(v.optional(searchListSchema(v.picklist(NETWORK_IDS)), []), []),
  precoMin: v.fallback(v.optional(ethAmountSchema), undefined),
  precoMax: v.fallback(v.optional(ethAmountSchema), undefined),
  ordem: v.fallback(v.optional(v.picklist(CATALOG_SORT_IDS), 'recentes'), 'recentes'),
  pagina: v.fallback(v.optional(v.pipe(searchNumberSchema, v.integer(), v.minValue(1)), 1), 1),
})

export type CatalogSearch = v.InferOutput<typeof catalogSearchSchema>

export const catalogSearchDefaults: CatalogSearch = {
  q: '',
  aba: 'todos',
  colecao: [],
  rede: [],
  precoMin: undefined,
  precoMax: undefined,
  ordem: 'recentes',
  pagina: 1,
}
