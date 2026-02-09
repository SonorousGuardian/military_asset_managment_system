import React from 'react';
import { motion } from 'framer-motion';
import { cn } from "../../utils/cn";

export function Button({ children, className, variant = 'primary', ...props }) {
  const MotionButton = motion.button;

  const variants = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all duration-200",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border shadow-sm",
    danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
    ghost: "hover:bg-accent hover:text-accent-foreground text-muted-foreground",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground text-foreground"
  };

  return (
    <MotionButton
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </MotionButton>
  );
}
