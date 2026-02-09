import React from 'react';
import { motion } from 'framer-motion';
import { cn } from "../../utils/cn";

export function Card({ children, className, ...props }) {
  const MotionDiv = motion.div;

  return (
    <MotionDiv 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-card text-card-foreground rounded-xl border border-border/50 shadow-xl shadow-black/20 overflow-hidden backdrop-blur-sm",
        className
      )}
      {...props}
    >
      {children}
    </MotionDiv>
  );
}

export function CardHeader({ children, className }) {
  return <div className={cn("p-6 border-b border-border/50 bg-muted/5", className)}>{children}</div>;
}

export function CardTitle({ children, className }) {
  return <h3 className={cn("text-lg font-semibold text-foreground tracking-tight", className)}>{children}</h3>;
}

export function CardContent({ children, className }) {
  return <div className={cn("p-6", className)}>{children}</div>;
}
