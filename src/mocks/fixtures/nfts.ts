import { COLLECTIONS, EDITIONS, NETWORK_IDS, type CollectionId, type EditionId, type NetworkId, type NftDetail } from '@contracts/nft'
import { percentOfEth } from '@core/money'
import { between, createRandom, pick, type Random } from '@mocks/random'

export type NftRecord = NftDetail & {
  listedAt: string
  popularity: number
}

export const FIXTURE_REFERENCE_DATE = Date.UTC(2026, 9, 1, 12)

const DAY_MS = 86_400_000

const IMAGE_WIDTHS = [320, 640, 1024]

const imageFor = (alt: string) => ({
  src: '/images/nfts/exemplo-nft-640.webp',
  srcSet: IMAGE_WIDTHS.map((width) => `/images/nfts/exemplo-nft-${width}.webp ${width}w`).join(', '),
  alt,
})

const EDITION_PRICE_BASIS_POINTS: Record<EditionId, number> = {
  '1-1': 40_000,
  '1-10': 18_000,
  '1-50': 10_000,
  aberta: 6_000,
}

const DEFAULT_EDITION_PREFERENCE: EditionId[] = ['1-50', 'aberta', '1-10', '1-1']

const CREATORS = ['Nova Sato', 'Lia Moreau', 'Caio Brandt', 'Iris Okafor', 'Theo Lima', 'Maya Quinn', 'Rafa Duarte']

const ATTRIBUTE_POOL = ['Óculos', 'Esmeralda', 'Raro', 'Jaqueta', 'Chapéu', 'Fones', 'Dourado', 'Neon', 'Vintage', 'Capuz']

const REVIEWERS = ['Marina', 'Pedro', 'Júlia', 'Lucas', 'Bea', 'Otávio', 'Carla', 'Diego']

const REVIEW_COMMENTS = [
  'Arte impecável, os detalhes em alta resolução valem cada ETH.',
  'Entrega rápida na carteira e procedência clara.',
  'Coleção consistente, já estou de olho nos próximos lançamentos.',
  'Ótimo custo-benefício para uma edição limitada.',
  'A comunidade em volta da coleção é muito ativa.',
]

const ADJECTIVES = ['Emerald', 'Sage', 'Neon', 'Cosmic', 'Violet', 'Ivory', 'Golden', 'Amber', 'Crimson', 'Silent', 'Lunar', 'Velvet']

const NOUNS = ['Ape', 'Nomad', 'Vessel', 'Bloom', 'Baron', 'Beat', 'Signal', 'Pilot', 'Echo', 'Drifter', 'Monk', 'Rider']

type NftSeed = {
  name: string
  number: number
  price: string
  collection: CollectionId
  network: NetworkId
  compareAtPrice?: string
  rare?: boolean
  available?: Partial<Record<EditionId, number>>
  ageDays: number
  popularity: number
}

const DESIGN_SEEDS: NftSeed[] = [
  {
    name: 'Emerald Ape',
    number: 42,
    price: '1.19',
    collection: 'arte-digital',
    network: 'ethereum',
    rare: true,
    available: { '1-1': 0, '1-10': 4, '1-50': 37, aberta: 999 },
    ageDays: 2,
    popularity: 98,
  },
  { name: 'Sage Nomad', number: 9, price: '1.69', collection: 'arte-digital', network: 'ethereum', ageDays: 4, popularity: 91 },
  {
    name: 'Neon Vessel',
    number: 552,
    price: '1.99',
    compareAtPrice: '2.29',
    collection: 'colecionaveis',
    network: 'polygon',
    rare: true,
    ageDays: 6,
    popularity: 88,
  },
  { name: 'Cosmic Bloom', number: 118, price: '1.29', collection: 'arte-3d', network: 'ethereum', ageDays: 9, popularity: 84 },
  {
    name: 'Violet Nomad',
    number: 314,
    price: '1.39',
    collection: 'fotografia',
    network: 'ethereum',
    available: { '1-1': 1, '1-10': 8, '1-50': 12, aberta: 999 },
    ageDays: 12,
    popularity: 80,
  },
  {
    name: 'Ivory Baron',
    number: 88,
    price: '1.79',
    collection: 'generativa',
    network: 'solana',
    available: { '1-1': 1, '1-10': 3, '1-50': 20, aberta: 999 },
    ageDays: 15,
    popularity: 76,
  },
  { name: 'Golden Beat', number: 207, price: '0.99', collection: 'musica', network: 'polygon', ageDays: 18, popularity: 73 },
  { name: 'Golden Signal', number: 160, price: '0.39', collection: 'musica', network: 'ethereum', ageDays: 20, popularity: 70 },
  {
    name: 'Silent Monk',
    number: 777,
    price: '2.49',
    collection: 'jogos',
    network: 'ethereum',
    available: { '1-1': 0, '1-10': 0, '1-50': 0, aberta: 0 },
    ageDays: 40,
    popularity: 35,
  },
]

const GENERATED_COUNT = 39

const generateSeeds = (random: Random): NftSeed[] => {
  const usedNames = new Set(DESIGN_SEEDS.map((seed) => seed.name))
  const seeds: NftSeed[] = []
  while (seeds.length < GENERATED_COUNT) {
    const name = `${pick(random, ADJECTIVES)} ${pick(random, NOUNS)}`
    if (usedNames.has(name)) continue
    usedNames.add(name)
    const cents = between(random, 2, 1230)
    seeds.push({
      name,
      number: between(random, 1, 999),
      price: (cents / 100).toFixed(2),
      collection: COLLECTIONS[seeds.length % COLLECTIONS.length]?.id ?? 'arte-digital',
      network: pick(random, NETWORK_IDS),
      ...(random() < 0.15 ? { compareAtPrice: ((cents * 1.2) / 100).toFixed(2) } : {}),
      rare: random() < 0.2,
      ageDays: between(random, 1, 120),
      popularity: between(random, 5, 95),
    })
  }
  return seeds
}

const slugify = (name: string, number: number) => `${name.toLowerCase().replace(/\s+/g, '-')}-${String(number).padStart(3, '0')}`

const hexAddress = (random: Random) =>
  `0x${Array.from({ length: 40 }, () => Math.floor(random() * 16).toString(16)).join('').toUpperCase()}`

const buildRecord = (seed: NftSeed, random: Random): NftRecord => {
  const fullName = `${seed.name} #${String(seed.number).padStart(3, '0')}`
  const collectionLabel = COLLECTIONS.find((collection) => collection.id === seed.collection)?.label ?? 'Arte digital'
  const editions = EDITIONS.map((edition) => ({
    id: edition.id,
    label: edition.label,
    price: percentOfEth(seed.price, EDITION_PRICE_BASIS_POINTS[edition.id]),
    available:
      seed.available?.[edition.id] ??
      { '1-1': between(random, 0, 1), '1-10': between(random, 1, 10), '1-50': between(random, 5, 50), aberta: 999 }[edition.id],
  }))
  const defaultEdition =
    DEFAULT_EDITION_PREFERENCE.map((id) => editions.find((edition) => edition.id === id && edition.available > 0)).find(
      (edition) => edition !== undefined,
    ) ?? editions.find((edition) => edition.id === '1-50')
  const reviewCount = between(random, 3, 40)
  const creator = pick(random, CREATORS)
  const attributes = [...new Set([pick(random, ATTRIBUTE_POOL), pick(random, ATTRIBUTE_POOL), seed.rare ? 'Raro' : 'Comum'])]
  return {
    id: slugify(seed.name, seed.number),
    name: fullName,
    tokenId: `#${String(seed.number).padStart(4, '0')}`,
    collection: seed.collection,
    network: seed.network,
    defaultEditionId: defaultEdition?.id ?? '1-50',
    price: defaultEdition?.price ?? seed.price,
    compareAtPrice: seed.compareAtPrice ?? null,
    rare: seed.rare ?? false,
    soldOut: editions.every((edition) => edition.available === 0),
    image: imageFor(`Arte do NFT ${fullName}`),
    version: 1,
    description: `Um colecionável digital finalizado à mão da coleção Kurio ${collectionLabel}, verificado na rede, com arte desbloqueável e acesso para colecionadores.`,
    story: [
      `${fullName} é uma obra digital finalizada à mão da coleção Kurio ${collectionLabel}. Cada atributo fica armazenado nos metadados do token e verificado na rede.`,
      `A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência. ${creator} recebe 5% de direitos autorais nas vendas secundárias.`,
    ],
    attributes,
    collectionName: `Kurio ${collectionLabel}`,
    creator,
    contractAddress: hexAddress(random),
    royaltyPercent: 5,
    rating: Math.round((4 + random()) * 10) / 10,
    reviewCount,
    reviews: Array.from({ length: Math.min(reviewCount, 4) }, (_, index) => ({
      id: `${slugify(seed.name, seed.number)}-review-${index + 1}`,
      author: pick(random, REVIEWERS),
      rating: between(random, 4, 5),
      comment: pick(random, REVIEW_COMMENTS),
      createdAt: new Date(FIXTURE_REFERENCE_DATE - between(random, 1, 60) * DAY_MS).toISOString(),
    })),
    gallery: [1, 2, 3, 4].map((view) => imageFor(`Arte do NFT ${fullName}, vista ${view} de 4`)),
    editions,
    listedAt: new Date(FIXTURE_REFERENCE_DATE - seed.ageDays * DAY_MS).toISOString(),
    popularity: seed.popularity,
  }
}

export const seedNfts = (): NftRecord[] => {
  const random = createRandom(20261001)
  return [...DESIGN_SEEDS, ...generateSeeds(random)].map((seed) => buildRecord(seed, random))
}
