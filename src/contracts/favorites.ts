import * as v from 'valibot'
import { nftSummarySchema } from '@contracts/nft'

export const favoritesSchema = v.object({
  items: v.array(nftSummarySchema),
})

export type Favorites = v.InferOutput<typeof favoritesSchema>

export const favoriteChangeSchema = v.object({
  nftId: v.string(),
  favorite: v.boolean(),
})
