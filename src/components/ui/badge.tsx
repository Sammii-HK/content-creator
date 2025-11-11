import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border px-3 py-1 text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-soft hover:bg-primary-hover",
        secondary:
          "border-transparent bg-background-secondary text-foreground hover:bg-background-tertiary",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-soft hover:bg-destructive/90",
        outline: "text-foreground border-border hover:bg-background-secondary",
        success: "border-transparent bg-success text-success-foreground shadow-soft hover:bg-success/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
