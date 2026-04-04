import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
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
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] animate-in fade-in duration-300" />
        <Dialog.Content className={cn(
          "fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] z-[101]",
          "w-full glass-card border border-white/10 p-8 focus:outline-none",
          "animate-in zoom-in-95 fade-in duration-300",
          sizeClasses[size]
        )}>
          <div className="flex items-center justify-between mb-6">
            <div>
              {title && (
                <Dialog.Title className="text-xl font-bold font-heading gradient-text">
                  {title}
                </Dialog.Title>
              )}
              {description && (
                <Dialog.Description className="text-sm text-text-secondary mt-1">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close asChild>
              <button 
                className="p-2 rounded-full hover:bg-white/5 text-text-secondary hover:text-text-primary transition-all active:scale-95"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>
          
          <div className="max-h-[calc(90vh-140px)] overflow-y-auto pr-2 custom-scrollbar">
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
