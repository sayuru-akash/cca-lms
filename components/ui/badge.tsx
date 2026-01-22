import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-mono font-semibold transition-all",
  {
    variants: {
      variant: {
        default:
          "border-terminal-green/50 bg-terminal-green/10 text-terminal-green shadow-[0_0_5px_rgba(34,197,94,0.2)]",
        success:
          "border-terminal-green bg-terminal-green/20 text-terminal-green shadow-[0_0_8px_rgba(34,197,94,0.3)]",
        warning:
          "border-yellow-500/50 bg-yellow-500/10 text-yellow-400 shadow-[0_0_5px_rgba(234,179,8,0.2)]",
        danger:
          "border-red-500/50 bg-red-500/10 text-red-400 shadow-[0_0_5px_rgba(239,68,68,0.2)]",
        info: "border-blue-500/50 bg-blue-500/10 text-blue-400 shadow-[0_0_5px_rgba(59,130,246,0.2)]",
        outline: "border-terminal-green/30 text-terminal-text-muted",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
