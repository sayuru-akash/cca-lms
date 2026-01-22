import * as React from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-terminal-green/30 bg-terminal-darker px-3 py-2 text-sm font-mono text-terminal-text placeholder:text-terminal-text-muted focus:border-terminal-green focus:shadow-[0_0_10px_rgba(34,197,94,0.3)] focus:outline-none focus:ring-2 focus:ring-terminal-green/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
