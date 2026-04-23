import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModeCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  isSelected?: boolean;
  onClick?: () => void;
  iconColor?: string;
  accentColor?: string;
}

export function ModeCard({
  icon: Icon,
  title,
  description,
  isSelected = false,
  onClick,
  iconColor = '#4361EE',
  accentColor = '#4361EE',
}: ModeCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-6 rounded-2xl border-2 transition-all duration-300 text-left group',
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-200'
          : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className="p-3 rounded-xl flex-shrink-0"
          style={{ backgroundColor: `${accentColor}15` }}
        >
          <Icon
            className="w-6 h-6"
            style={{ color: iconColor }}
          />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-gray-600 mt-1 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </button>
  );
}
