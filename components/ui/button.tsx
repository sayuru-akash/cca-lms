import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-mono font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terminal-green focus-visible:ring-offset-2 focus-visible:ring-offset-terminal-darker disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden group",
  {
    variants: {
      variant: {
        default:
          "bg-terminal-green text-terminal-dark hover:bg-terminal-green-light shadow-[0_0_10px_rgba(34,197,94,0.3)] hover:shadow-[0_0_20px_rgba(34,197,94,0.5)] border border-terminal-green",
        outline:
          "border border-terminal-green/50 text-terminal-green hover:bg-terminal-green/10 hover:border-terminal-green hover:shadow-[0_0_10px_rgba(34,197,94,0.2)]",
        ghost:
          "text-terminal-green hover:bg-terminal-green/10 hover:shadow-[0_0_10px_rgba(34,197,94,0.1)]",
        danger:
          "bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30 hover:border-red-500 hover:shadow-[0_0_10px_rgba(239,68,68,0.3)]",
        link: "text-terminal-green underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
