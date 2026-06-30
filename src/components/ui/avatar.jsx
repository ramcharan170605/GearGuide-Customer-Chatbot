import * as React from "react"
import { cn } from "@/lib/utils"

function Avatar({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "relative flex size-8 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function AvatarImage({ className, src, alt, ...props }) {
  const [error, setError] = React.useState(false)
  if (error || !src) return null
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setError(true)}
      className={cn("aspect-square h-full w-full object-cover", className)}
      {...props}
    />
  )
}

function AvatarFallback({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "bg-muted flex h-full w-full items-center justify-center rounded-full text-xs font-semibold select-none",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export { Avatar, AvatarImage, AvatarFallback }
