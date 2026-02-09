import React from 'react';
import { cn } from "../../utils/cn";

const Label = React.forwardRef(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1 block mb-1.5",
      className
    )}
    {...props}
  />
))
Label.displayName = "Label"

export { Label }
