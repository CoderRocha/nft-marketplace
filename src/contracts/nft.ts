import * as v from 'valibot'
import { ethAmountSchema } from '@contracts/money'

export const COLLECTIONS = [
  { id: 'arte-digital', label: 'Arte digital' },
  { id: 'fotografia', label: 'Fotografia' },
  { id: 'musica', label: 'Música' },
  { id: 'arte-3d', label: 'Arte 3D' },
  { id: 'colecionaveis', label: 'Colecionáveis' },
  { id: 'generativa', label: 'Generativa' },
  { id: 'jogos', label: 'Jogos' },
  { id: 'assinaturas', label: 'Assinaturas' },
  { id: 'utilidade', label: 'Utilidade' },
] as const

export type CollectionId = (typeof COLLECTIONS)[number]['id']

export const COLLECTION_IDS = COLLECTIONS.map((collection) => collection.id)

export const NETWORKS = [
  { id: 'ethereum', label: 'Ethereum' },
  { id: 'polygon', label: 'Polygon' },
  { id: 'solana', label: 'Solana' },
] as const

export type NetworkId = (typeof NETWORKS)[number]['id']

export const NETWORK_IDS = NETWORKS.map((network) => network.id)

export const CATALOG_TABS = [
  { id: 'todos', label: 'Todos os NFTs' },
  { id: 'lancamentos', label: 'Novos lançamentos' },
  { id: 'em-alta', label: 'Em alta' },
] as const

export type CatalogTab = (typeof CATALOG_TABS)[number]['id']

export const CATALOG_TAB_IDS = CATALOG_TABS.map((tab) => tab.id)

export const CATALOG_SORTS = [
  { id: 'recentes', label: 'Listados recentemente' },
  { id: 'menor-preco', label: 'Menor preço' },
  { id: 'maior-preco', label: 'Maior preço' },
  { id: 'populares', label: 'Mais populares' },
] as const

export type CatalogSort = (typeof CATALOG_SORTS)[number]['id']

export const CATALOG_SORT_IDS = CATALOG_SORTS.map((sort) => sort.id)

export const EDITIONS = [
  { id: '1-1', label: '1/1' },
  { id: '1-10', label: '1/10' },
  { id: '1-50', label: '1/50' },
  { id: 'aberta', label: 'Aberta' },
] as const

export type EditionId = (typeof EDITIONS)[number]['id']

export const EDITION_IDS = EDITIONS.map((edition) => edition.id)

export const MAX_QUANTITY_PER_ORDER = 10

export const CATALOG_PAGE_SIZE_MAX = 24

export const nftImageSchema = v.object({
  src: v.string(),
  srcSet: v.string(),
  alt: v.string(),
})

export type NftImage = v.InferOutput<typeof nftImageSchema>

export const editionSchema = v.object({
  id: v.picklist(EDITION_IDS),
  label: v.string(),
  price: ethAmountSchema,
  available: v.pipe(v.number(), v.integer(), v.minValue(0)),
})

export type Edition = v.InferOutput<typeof editionSchema>

export const nftSummarySchema = v.object({
  id: v.string(),
  name: v.string(),
  tokenId: v.string(),
  collection: v.picklist(COLLECTION_IDS),
  network: v.picklist(NETWORK_IDS),
  defaultEditionId: v.picklist(EDITION_IDS),
  price: ethAmountSchema,
  compareAtPrice: v.nullable(ethAmountSchema),
  rare: v.boolean(),
  soldOut: v.boolean(),
  image: nftImageSchema,
  version: v.number(),
})

export type NftSummary = v.InferOutput<typeof nftSummarySchema>

export const reviewSchema = v.object({
  id: v.string(),
  author: v.string(),
  rating: v.pipe(v.number(), v.minValue(1), v.maxValue(5)),
  comment: v.string(),
  createdAt: v.string(),
})

export type Review = v.InferOutput<typeof reviewSchema>

export const nftDetailSchema = v.object({
  ...nftSummarySchema.entries,
  description: v.string(),
  story: v.array(v.string()),
  attributes: v.array(v.string()),
  collectionName: v.string(),
  creator: v.string(),
  contractAddress: v.string(),
  royaltyPercent: v.number(),
  rating: v.number(),
  reviewCount: v.number(),
  reviews: v.array(reviewSchema),
  gallery: v.array(nftImageSchema),
  editions: v.array(editionSchema),
})

export type NftDetail = v.InferOutput<typeof nftDetailSchema>

const facetSchema = <TId extends string>(ids: TId[]) =>
  v.array(v.object({ id: v.picklist(ids), count: v.number() }))

export const nftPageSchema = v.object({
  items: v.array(nftSummarySchema),
  total: v.number(),
  page: v.number(),
  pageSize: v.number(),
  facets: v.object({
    collections: facetSchema(COLLECTION_IDS),
    networks: facetSchema(NETWORK_IDS),
    priceRange: v.object({ min: ethAmountSchema, max: ethAmountSchema }),
  }),
})

export type NftPage = v.InferOutput<typeof nftPageSchema>

export type NftListParams = {
  q: string
  aba: CatalogTab
  colecao: CollectionId[]
  rede: NetworkId[]
  precoMin: string | undefined
  precoMax: string | undefined
  ordem: CatalogSort
  pagina: number
  porPagina: number
}

export const nftHighlightsSchema = v.object({
  hero: v.array(nftSummarySchema),
  featured: v.nullable(nftSummarySchema),
})

export type NftHighlights = v.InferOutput<typeof nftHighlightsSchema>

export const nftListSchema = v.array(nftSummarySchema)
