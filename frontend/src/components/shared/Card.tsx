import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps {
  children: React.ReactNode;
  variant?: 'glass' | 'solid' | 'elevated' | 'glow';
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export function Card({ 
  children, 
  variant = 'glass', 
  className, 
  onClick, 
  hoverable = true 
}: CardProps) {
  const variants = {
    glass: "glass-card",
    solid: "bg-bg-surface border border-white/5 shadow-xl",
    elevated: "bg-bg-elevated border border-white/10 shadow-2xl",
    glow: "glass-card border-primary/20 shadow-[0_0_40px_rgba(59,130,246,0.1)]",
  };

  return (
    <div 
      onClick={onClick}
      className={cn(
        "rounded-3xl p-6",
        variants[variant],
        hoverable ? "cursor-pointer hover:shadow-2xl hover:scale-[1.01] transition-all duration-300 active:scale-[0.99]" : "",
        className
      )}
    >
      {children}
    </div>
  );
}
