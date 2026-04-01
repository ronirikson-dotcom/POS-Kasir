import * as React from "react"
import { cn } from "../../lib/utils"

export interface BadgeProps extends React.ComponentProps<"div"> {
  variant?: "default" | "success" | "warning" | "danger" | "entityA" | "entityB" | "entityC";
  children?: React.ReactNode;
  className?: string;
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-gray-100 text-gray-900": variant === "default",
          "border-transparent bg-success/10 text-success": variant === "success",
          "border-transparent bg-warning/20 text-yellow-800": variant === "warning",
          "border-transparent bg-danger/10 text-danger": variant === "danger",
          "border-transparent bg-blue-100 text-blue-800": variant === "entityA",
          "border-transparent bg-purple-100 text-purple-800": variant === "entityB",
          "border-transparent bg-orange-100 text-orange-800": variant === "entityC",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
