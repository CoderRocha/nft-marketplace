import { HttpResponse } from 'msw'
import * as v from 'valibot'
import { ethAmountSchema } from '@contracts/money'
import {
  CATALOG_PAGE_SIZE_MAX,
  CATALOG_SORT_IDS,
  CATALOG_TAB_IDS,
  COLLECTIONS,
  COLLECTION_IDS,
  NETWORK_IDS,
  nftDetailSchema,
  nftSummarySchema,
  type NftSummary,
} from '@contracts/nft'
import { compareEth, toWei } from '@core/money'
import { db } from '@mocks/db'
import { FIXTURE_REFERENCE_DATE, type NftRecord } from '@mocks/fixtures/nfts'
import { endpoint, notFoundProblem, validationProblem } from '@mocks/network'

const NEW_RELEASE_WINDOW_MS = 21 * 86_400_000

const TRENDING_MIN_POPULARITY = 70

const RELATED_LIMIT = 8

const listQuerySchema = v.object({
  q: v.optional(v.pipe(v.string(), v.maxLength(80)), ''),
  aba: v.optional(v.picklist(CATALOG_TAB_IDS), 'todos'),
  colecao: v.array(v.picklist(COLLECTION_IDS)),
  rede: v.array(v.picklist(NETWORK_IDS)),
  precoMin: v.optional(ethAmountSchema),
  precoMax: v.optional(ethAmountSchema),
  ordem: v.optional(v.picklist(CATALOG_SORT_IDS), 'recentes'),
  pagina: v.optional(v.pipe(v.string(), v.toNumber(), v.integer(), v.minValue(1)), '1'),
  porPagina: v.optional(v.pipe(v.string(), v.toNumber(), v.integer(), v.minValue(1), v.maxValue(CATALOG_PAGE_SIZE_MAX)), '9'),
})

type ListQuery = v.InferOutput<typeof listQuerySchema>

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

export const toSummary = (record: NftRecord): NftSummary => v.parse(nftSummarySchema, record)

const toDetail = (record: NftRecord) => v.parse(nftDetailSchema, record)

const collectionLabel = (id: string) => COLLECTIONS.find((collection) => collection.id === id)?.label ?? ''

const matchesText = (record: NftRecord, q: string) => {
  const needle = normalize(q.trim())
  if (!needle) return true
  return [record.name, record.tokenId, record.collectionName, collectionLabel(record.collection), record.creator].some((field) =>
    normalize(field).includes(needle),
  )
}

const matchesTab = (record: NftRecord, tab: ListQuery['aba']) => {
  if (tab === 'lancamentos') return FIXTURE_REFERENCE_DATE - Date.parse(record.listedAt) <= NEW_RELEASE_WINDOW_MS
  if (tab === 'em-alta') return record.popularity >= TRENDING_MIN_POPULARITY
  return true
}

const matchesPrice = (record: NftRecord, min: string | undefined, max: string | undefined) =>
  (min === undefined || compareEth(record.price, min) >= 0) && (max === undefined || compareEth(record.price, max) <= 0)

const SORTERS: Record<ListQuery['ordem'], (left: NftRecord, right: NftRecord) => number> = {
  recentes: (left, right) => Date.parse(right.listedAt) - Date.parse(left.listedAt),
  'menor-preco': (left, right) => compareEth(left.price, right.price),
  'maior-preco': (left, right) => compareEth(right.price, left.price),
  populares: (left, right) => right.popularity - left.popularity,
}

const countBy = <TId extends string>(records: NftRecord[], ids: readonly TId[], key: (record: NftRecord) => string) =>
  ids.map((id) => ({ id, count: records.filter((record) => key(record) === id).length }))

const priceRange = (records: NftRecord[]) => {
  const prices = records.map((record) => record.price).sort((left, right) => compareEth(left, right))
  return { min: prices[0] ?? '0', max: prices.at(-1) ?? '0' }
}

const catalog = () => (db().scenario === 'vazio' ? [] : db().nfts)

const listNfts = (query: ListQuery) => {
  const base = catalog().filter(
    (record) => matchesText(record, query.q) && matchesTab(record, query.aba) && matchesPrice(record, query.precoMin, query.precoMax),
  )
  const inCollections = (record: NftRecord) => query.colecao.length === 0 || query.colecao.some((id) => id === record.collection)
  const inNetworks = (record: NftRecord) => query.rede.length === 0 || query.rede.some((id) => id === record.network)
  const filtered = base.filter((record) => inCollections(record) && inNetworks(record)).sort(SORTERS[query.ordem])
  const start = (query.pagina - 1) * query.porPagina
  return {
    items: filtered.slice(start, start + query.porPagina).map(toSummary),
    total: filtered.length,
    page: query.pagina,
    pageSize: query.porPagina,
    facets: {
      collections: countBy(base.filter(inNetworks), COLLECTION_IDS, (record) => record.collection),
      networks: countBy(base.filter(inCollections), NETWORK_IDS, (record) => record.network),
      priceRange: priceRange(catalog()),
    },
  }
}

const findNft = (id: string) => catalog().find((record) => record.id === id)

const nftNotFound = () => notFoundProblem('Este NFT não existe ou foi removido do catálogo.')

const discountWei = (record: NftRecord) => toWei(record.compareAtPrice ?? record.price) - toWei(record.price)

const featuredOffer = (records: NftRecord[]) =>
  records
    .filter((record) => record.compareAtPrice !== null)
    .reduce<NftRecord | undefined>((best, record) => (!best || discountWei(record) > discountWei(best) ? record : best), undefined)

export const nftHandlers = [
  endpoint('get', '/nfts', ({ request }) => {
    const params = new URL(request.url).searchParams
    const query = v.safeParse(listQuerySchema, {
      ...Object.fromEntries(params),
      colecao: params.getAll('colecao'),
      rede: params.getAll('rede'),
    })
    if (!query.success) return validationProblem({ filtros: ['Os filtros enviados são inválidos.'] })
    return HttpResponse.json(listNfts(query.output))
  }),

  endpoint('get', '/nfts/highlights', () => {
    const records = catalog().filter((record) => !record.soldOut)
    const hero = [...records].sort(SORTERS.populares).slice(0, 3)
    const featured = featuredOffer(records)
    return HttpResponse.json({ hero: hero.map(toSummary), featured: featured ? toSummary(featured) : null })
  }),

  endpoint<{ id: string }>('get', '/nfts/:id', ({ params }) => {
    const record = findNft(params.id)
    return record ? HttpResponse.json(toDetail(record)) : nftNotFound()
  }),

  endpoint<{ id: string }>('get', '/nfts/:id/related', ({ params }) => {
    const record = findNft(params.id)
    if (!record) return nftNotFound()
    const others = catalog().filter((candidate) => candidate.id !== record.id)
    const sameCollection = others.filter((candidate) => candidate.collection === record.collection)
    const rest = others.filter((candidate) => candidate.collection !== record.collection).sort(SORTERS.populares)
    return HttpResponse.json([...sameCollection, ...rest].slice(0, RELATED_LIMIT).map(toSummary))
  }),
]
