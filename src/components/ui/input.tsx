import * as React from "react"
import { cn } from "@/lib/utils"

type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-9 w-full rounded-md border bg-white px-3 py-1.5 text-sm",
        "placeholder:text-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
)

Input.displayName = "Input"
