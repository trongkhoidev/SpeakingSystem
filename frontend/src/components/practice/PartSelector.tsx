import React from 'react';
import { cn } from '../../lib/utils';

interface PartSelectorProps {
  selectedPart: number;
  onPartChange: (part: number) => void;
  partCount?: number;
}

const PART_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  1: { bg: '#EEF0FD', text: '#4361EE', border: '#D1D5F0' },
  2: { bg: '#FFF7E6', text: '#B45309', border: '#FFE8B6' },
  3: { bg: '#F3F0FF', text: '#7C3AED', border: '#E9D5FF' },
};

export function PartSelector({ selectedPart, onPartChange, partCount = 3 }: PartSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: partCount }).map((_, i) => {
        const part = i + 1;
        const colors = PART_COLORS[part];
        return (
          <button
            key={part}
            onClick={() => onPartChange(part)}
            className={cn(
              'px-4 py-2 rounded-lg font-semibold text-sm transition-all',
              selectedPart === part
                ? 'border-2'
                : 'border-2 border-gray-200 hover:border-gray-300'
            )}
            style={
              selectedPart === part
                ? {
                    backgroundColor: colors.bg,
                    color: colors.text,
                    borderColor: colors.border,
                    boxShadow: `0 0 0 3px ${colors.bg}80`,
                  }
                : {
                    borderColor: '#E5E7EB',
                    color: '#6B7280',
                  }
            }
          >
            Part {part}
          </button>
        );
      })}
    </div>
  );
}
