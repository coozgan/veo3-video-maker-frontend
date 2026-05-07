import { HTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/cn";

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl border border-border bg-surface shadow-sm",
        className
      )}
      {...rest}
    />
  )
);
Card.displayName = "Card";
