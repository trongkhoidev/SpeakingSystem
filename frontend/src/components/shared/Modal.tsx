import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/Dialog';
import { cn } from '../../lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  description, 
  children,
  size = 'md' 
}: ModalProps) {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-[90vw] h-[90vh]',
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(
        "glass-card border border-white/10 p-8 focus:outline-none z-[110]",
        sizeClasses[size]
      )}>
        <DialogHeader className="mb-6">
          {title && (
            <DialogTitle className="text-xl font-bold font-heading gradient-text">
              {title}
            </DialogTitle>
          )}
          {description && (
            <DialogDescription className="text-sm text-text-secondary mt-1">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        
        <div className="max-h-[calc(90vh-140px)] overflow-y-auto pr-2 custom-scrollbar">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
