import * as React from "react"
import { cn } from "../../lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "outline" | "ghost"
  size?: "sm" | "md" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-primary text-white hover:bg-primary-hover": variant === "primary",
            "bg-gray-200 text-gray-900 hover:bg-gray-300": variant === "secondary",
            "bg-danger text-white hover:bg-danger-hover": variant === "danger",
            "border border-gray-300 bg-transparent hover:bg-gray-100 text-gray-900": variant === "outline",
            "hover:bg-gray-100 text-gray-700": variant === "ghost",
            "h-9 px-3": size === "sm",
            "h-10 px-4 py-2": size === "md",
            "h-11 px-8 text-base": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
