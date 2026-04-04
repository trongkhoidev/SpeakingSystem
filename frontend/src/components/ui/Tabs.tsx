import { createContext, useContext, useState, ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface TabsContextType {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export function Tabs({ 
  defaultValue, 
  value: controlledValue, 
  onValueChange, 
  children, 
  className 
}: { 
  defaultValue?: string; 
  value?: string; 
  onValueChange?: (value: string) => void; 
  children: ReactNode; 
  className?: string;
}) {
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  
  const handleValueChange = (newValue: string) => {
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
      <div className={cn("w-full", className)}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn(
      "flex items-center gap-1 overflow-x-auto scrollbar-hide flex-nowrap scroll-smooth",
      className
    )}>
      {children}
    </div>
  );
}

export function TabsTrigger({ 
  value, 
  children, 
  className 
}: { 
  value: string; 
  children: ReactNode; 
  className?: string;
}) {
  const context = useContext(TabsContext);
  if (!context) throw new Error("TabsTrigger must be used within Tabs");

  const isActive = context.value === value;

  return (
    <button
      onClick={() => context.onValueChange(value)}
      data-state={isActive ? "active" : "inactive"}
      className={cn(
        "transition-all duration-300",
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({ 
  value, 
  children, 
  className 
}: { 
  value: string; 
  children: ReactNode; 
  className?: string;
}) {
  const context = useContext(TabsContext);
  if (!context) throw new Error("TabsContent must be used within Tabs");

  if (context.value !== value) return null;

  return (
    <div className={cn("mt-2", className)}>
      {children}
    </div>
  );
}
