import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Clock, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ExamModeCardProps {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  duration: string;
  isSelected?: boolean;
  onClick?: () => void;
  iconColor?: string;
  accentColor?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

const DIFFICULTY_COLORS = {
  easy: { bg: '#EFF6FF', text: '#0369A1', label: 'Easy' },
  medium: { bg: '#FEF3C7', text: '#B45309', label: 'Medium' },
  hard: { bg: '#FECACA', text: '#DC2626', label: 'Hard' },
};

export function ExamModeCard({
  id,
  icon: Icon,
  title,
  description,
  duration,
  isSelected = false,
  onClick,
  iconColor = '#4361EE',
  accentColor = '#4361EE',
  difficulty,
}: ExamModeCardProps) {
  const diffColors = difficulty ? DIFFICULTY_COLORS[difficulty] : null;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-6 rounded-2xl border-2 transition-all duration-300 text-left group hover:shadow-lg',
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-200'
          : 'border-gray-200 bg-white hover:border-blue-300'
      )}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div
            className="p-3 rounded-xl flex-shrink-0"
            style={{ backgroundColor: `${accentColor}15` }}
          >
            <Icon
              className="w-6 h-6"
              style={{ color: iconColor }}
            />
          </div>
          {diffColors && (
            <span
              className="px-2 py-1 rounded-lg text-xs font-semibold"
              style={{
                backgroundColor: diffColors.bg,
                color: diffColors.text,
              }}
            >
              {diffColors.label}
            </span>
          )}
        </div>

        {/* Content */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-gray-600 mt-2 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Duration */}
        <div className="flex items-center gap-2 text-sm text-gray-600 pt-2 border-t border-gray-100">
          <Clock className="w-4 h-4" />
          <span className="font-medium">{duration}</span>
          <Zap className="w-4 h-4 ml-auto text-blue-500" />
        </div>
      </div>
    </button>
  );
}
