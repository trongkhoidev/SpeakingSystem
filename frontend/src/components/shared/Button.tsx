import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'glass' | 'ghost' | 'error';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading, 
  className, 
  ...props 
}: ButtonProps) {
  const variants = {
    primary: "bg-primary text-white hover:bg-primary-hover shadow-[0_4px_20px_rgba(59,130,246,0.3)] hover:shadow-[0_8px_25px_rgba(59,130,246,0.4)] active:scale-[0.98]",
    secondary: "bg-secondary text-white hover:bg-secondary-hover shadow-[0_4px_20px_rgba(139,92,246,0.3)] hover:shadow-[0_8px_25px_rgba(139,92,246,0.4)] active:scale-[0.98]",
    glass: "glass text-white hover:bg-glass-bg-hover hover:border-glass-border-hover border-white/10 active:scale-[0.98]",
    ghost: "text-text-secondary hover:text-text-primary hover:bg-white/5",
    error: "bg-error/10 text-error border border-error/20 hover:bg-error/20",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded-lg",
    md: "px-5 py-2.5 text-sm rounded-xl",
    lg: "px-8 py-3.5 text-base rounded-2xl",
    icon: "p-2 rounded-lg",
  };

  return (
    <button 
      className={cn(
        "relative flex items-center justify-center font-semibold transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
      ) : null}
      {children}
    </button>
  );
}
