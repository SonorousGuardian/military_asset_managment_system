import React from 'react';
import { cn } from "../../utils/cn";
import { AlertCircle, ChevronDown } from 'lucide-react';

const Select = React.forwardRef(({ className, children, error, label, icon: Icon, ...props }, ref) => {
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">
          {label}
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <Icon 
            className={cn(
              "absolute left-3 top-3 transition-colors duration-200", 
              error ? "text-destructive" : "text-muted-foreground group-focus-within:text-primary"
            )} 
            size={18} 
          />
        )}
        <select
          className={cn(
            "w-full bg-secondary/30 border text-foreground rounded-lg p-3 appearance-none transition-all outline-none text-sm placeholder:text-muted-foreground/50 cursor-pointer",
            Icon ? "pl-10 mr-12" : "px-4",
            error 
              ? "border-destructive/50 focus:ring-2 focus:ring-destructive/20 focus:border-destructive" 
              : "border-border focus:ring-2 focus:ring-primary/20 focus:border-primary",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <ChevronDown 
            className={cn(
                "absolute right-3 top-3 pointer-events-none transition-colors",
                error ? "text-destructive" : "text-muted-foreground"
            )}
            size={18} 
        />
      </div>
      {error && (
        <div className="flex items-center gap-1.5 ml-1 text-xs text-destructive animate-in slide-in-from-top-1 fade-in duration-200">
          <AlertCircle size={12} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
});

Select.displayName = "Select";

export { Select };
