import 'react'

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- module augmentation needs interface merging
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined
  }
}
