import * as v from 'valibot'
import { CATALOG_SORT_IDS, CATALOG_TAB_IDS, COLLECTION_IDS, NETWORK_IDS } from '@contracts/nft'

const ethFilter = v.pipe(v.string(), v.regex(/^\d+(\.\d{1,18})?$/))

export const catalogSearchSchema = v.object({
  q: v.fallback(v.optional(v.pipe(v.string(), v.maxLength(80)), ''), ''),
  aba: v.fallback(v.optional(v.picklist(CATALOG_TAB_IDS), 'todos'), 'todos'),
  colecao: v.fallback(v.optional(v.array(v.picklist(COLLECTION_IDS)), []), []),
  rede: v.fallback(v.optional(v.array(v.picklist(NETWORK_IDS)), []), []),
  precoMin: v.fallback(v.optional(ethFilter), undefined),
  precoMax: v.fallback(v.optional(ethFilter), undefined),
  ordem: v.fallback(v.optional(v.picklist(CATALOG_SORT_IDS), 'recentes'), 'recentes'),
  pagina: v.fallback(v.optional(v.pipe(v.number(), v.integer(), v.minValue(1)), 1), 1),
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
