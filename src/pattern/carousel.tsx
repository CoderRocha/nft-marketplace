import { cn } from 'cn'
import { useCallback, useState, type ReactNode } from 'react'

type CarouselProps = {
  label: string
  children: ReactNode
  className?: string
}

type CarouselPosition = { page: number; pages: number }

const readPosition = (element: HTMLElement): CarouselPosition => ({
  page: Math.round(element.scrollLeft / element.clientWidth),
  pages: Math.max(1, Math.ceil(element.scrollWidth / element.clientWidth - 0.05)),
})

export const Carousel = ({ label, children, className }: CarouselProps) => {
  const [track, setTrack] = useState<HTMLDivElement | null>(null)
  const [position, setPosition] = useState<CarouselPosition>({ page: 0, pages: 1 })

  const sync = useCallback((element: HTMLElement) => {
    const next = readPosition(element)
    setPosition((current) => (current.page === next.page && current.pages === next.pages ? current : next))
  }, [])

  const attach = useCallback(
    (element: HTMLDivElement | null) => {
      setTrack(element)
      if (!element) return
      sync(element)
      const observer = new ResizeObserver(() => {
        sync(element)
      })
      observer.observe(element)
      return () => {
        observer.disconnect()
      }
    },
    [sync],
  )

  return (
    <section aria-roledescription="carrossel" aria-label={label} className={cn('flex flex-col gap-6', className)}>
      <div
        ref={attach}
        onScroll={(event) => {
          sync(event.currentTarget)
        }}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth [scrollbar-width:none] motion-reduce:scroll-auto [&>*]:snap-start"
      >
        {children}
      </div>
      {position.pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: position.pages }, (_, page) => (
            <button
              key={page}
              type="button"
              aria-label={`Página ${page + 1} de ${position.pages}`}
              aria-current={page === position.page}
              className="size-2.5 rounded-full border border-primary aria-current:bg-primary"
              onClick={() => track?.scrollTo({ left: page * track.clientWidth })}
            />
          ))}
        </div>
      )}
    </section>
  )
}
