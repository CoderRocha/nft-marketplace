import { createQueryKeys, mergeQueryKeys } from '@lukemorales/query-key-factory'
import type { NftListParams } from '@contracts/nft'

const mocks = createQueryKeys('mocks', {
  state: null,
})

const nfts = createQueryKeys('nfts', {
  list: (params: NftListParams) => [params],
  highlights: null,
  detail: (id: string) => [id],
  related: (id: string) => [id],
})

export const keys = mergeQueryKeys(mocks, nfts)
