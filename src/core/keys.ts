import { createQueryKeys, mergeQueryKeys } from '@lukemorales/query-key-factory'

const mocks = createQueryKeys('mocks', {
  state: null,
})

export const keys = mergeQueryKeys(mocks)
