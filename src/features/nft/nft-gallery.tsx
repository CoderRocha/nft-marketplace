import { ZoomInIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import type { NftImage } from '@contracts/nft'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@ui/dialog'

type NftGalleryProps = {
  name: string
  images: NftImage[]
  overlay?: ReactNode
}

export const NftGallery = ({ name, images, overlay }: NftGalleryProps) => {
  const [active, setActive] = useState(0)
  const current = images[active] ?? images[0]
  if (!current) return null
  return (
    <div className="flex gap-4">
      <ul aria-label="Imagens do NFT" className="hidden w-17 shrink-0 flex-col gap-3 md:flex">
        {images.map((image, index) => (
          <li key={image.alt}>
            <button
              type="button"
              aria-label={`Ver imagem ${index + 1} de ${images.length}`}
              aria-pressed={index === active}
              onClick={() => {
                setActive(index)
              }}
              className="block overflow-hidden rounded-md border-2 border-transparent transition-colors hover:border-primary/60 aria-pressed:border-primary"
            >
              <img
                src={image.src}
                srcSet={image.srcSet}
                sizes="4.25rem"
                alt=""
                width={320}
                height={320}
                loading="lazy"
                className="aspect-square w-full object-cover"
              />
            </button>
          </li>
        ))}
      </ul>
      <div className="relative flex-1 bg-card md:p-3">
        <img
          src={current.src}
          srcSet={current.srcSet}
          sizes="(min-width: 768px) 30rem, 100vw"
          alt={current.alt}
          width={640}
          height={640}
          fetchPriority="high"
          className="aspect-square w-full rounded-b-3xl object-cover md:rounded-2xl"
        />
        {overlay}
        <Dialog>
          <DialogTrigger
            aria-label={`Ampliar imagem de ${name}`}
            className="absolute top-5 right-5 hidden size-8 items-center justify-center rounded-full bg-background/70 text-foreground hover:text-primary md:flex"
          >
            <ZoomInIcon className="size-5" />
          </DialogTrigger>
          <DialogContent closeLabel="Fechar imagem ampliada" className="p-2 sm:max-w-3xl">
            <DialogTitle className="sr-only">{name}</DialogTitle>
            <img
              src={current.src}
              srcSet={current.srcSet}
              sizes="(min-width: 768px) 48rem, 100vw"
              alt={current.alt}
              width={1024}
              height={1024}
              className="aspect-square w-full rounded-lg object-cover"
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
