import * as v from 'valibot'
import { EDITION_IDS } from '@contracts/nft'
import { searchNumberSchema } from '@core/schemas'

export const nftSearchSchema = v.object({
  edicao: v.fallback(v.optional(v.picklist(EDITION_IDS)), undefined),
  qtd: v.fallback(v.optional(v.pipe(searchNumberSchema, v.integer(), v.minValue(1)), 1), 1),
})

export type NftSearch = v.InferOutput<typeof nftSearchSchema>

export const nftSearchDefaults: NftSearch = { edicao: undefined, qtd: 1 }
