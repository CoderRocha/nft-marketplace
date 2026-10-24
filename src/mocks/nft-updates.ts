import type { EditionId } from '@contracts/nft'
import { mutate } from '@mocks/db'
import type { NftRecord } from '@mocks/fixtures/nfts'

const DEFAULT_EDITION_PREFERENCE: EditionId[] = ['1-50', 'aberta', '1-10', '1-1']

export type EditionChange = { price?: string; available?: number }

const refreshDerived = (nft: NftRecord) => {
  const defaultEdition =
    DEFAULT_EDITION_PREFERENCE.map((id) => nft.editions.find((edition) => edition.id === id && edition.available > 0)).find(
      (edition) => edition !== undefined,
    ) ?? nft.editions.find((edition) => edition.id === nft.defaultEditionId)
  if (defaultEdition) {
    nft.defaultEditionId = defaultEdition.id
    nft.price = defaultEdition.price
  }
  nft.soldOut = nft.editions.every((edition) => edition.available === 0)
  nft.version += 1
}

export const updateNftEdition = (nftId: string, editionId: EditionId, change: EditionChange) =>
  mutate((current) => {
    const nft = current.nfts.find((candidate) => candidate.id === nftId)
    const edition = nft?.editions.find((candidate) => candidate.id === editionId)
    if (!nft || !edition) return undefined
    if (change.price !== undefined) edition.price = change.price
    if (change.available !== undefined) edition.available = Math.max(0, change.available)
    refreshDerived(nft)
    return nft
  })
