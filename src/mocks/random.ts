export const createRandom = (seed: number) => {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

export type Random = ReturnType<typeof createRandom>

export const pick = <T>(random: Random, items: readonly T[]): T => {
  const item = items[Math.floor(random() * items.length)]
  if (item === undefined) throw new Error('Lista vazia')
  return item
}

export const between = (random: Random, min: number, max: number) => Math.floor(min + random() * (max - min + 1))
