import { cn } from "cn"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        "animate-shimmer rounded-md bg-linear-to-r from-muted via-shimmer to-muted bg-size-[200%_100%] motion-reduce:animate-none",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
