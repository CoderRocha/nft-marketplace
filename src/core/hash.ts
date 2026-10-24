export const hashText = (text: string) => {
  let hash = 5381
  for (let index = 0; index < text.length; index += 1) hash = (Math.imul(hash, 33) ^ text.charCodeAt(index)) >>> 0
  return hash.toString(16).padStart(8, '0')
}
