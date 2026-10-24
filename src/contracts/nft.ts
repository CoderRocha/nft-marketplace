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
