import React from 'react';
import { Volume2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface QuestionDisplayProps {
  questionText: string;
  part: number;
  currentIndex: number;
  totalQuestions: number;
  onNext: () => void;
  onPrev: () => void;
  onSpeak: () => void;
  isSponsoring?: boolean;
}

const PART_TITLES: Record<number, string> = {
  1: 'Part 1: Introduction & Interview',
  2: 'Part 2: Long Turn',
  3: 'Part 3: Discussion',
};

const PART_TIPS: Record<number, string> = {
  1: 'Answer briefly and naturally (2-3 sentences). Maintain eye contact and speak clearly.',
  2: 'You have 1 minute to prepare. Speak for 1-2 minutes. Use connectors for fluency.',
  3: 'Engage in deeper discussion. Provide reasons and examples to support your answers.',
};

export function QuestionDisplay({
  questionText,
  part,
  currentIndex,
  totalQuestions,
  onNext,
  onPrev,
  onSpeak,
  isSponsoring = false,
}: QuestionDisplayProps) {
  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-gray-700">
            Question {currentIndex + 1} of {totalQuestions}
          </span>
          <span className="text-xs font-medium text-gray-500">
            {Math.round(((currentIndex + 1) / totalQuestions) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Part Info */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4">
        <p className="text-sm font-semibold text-blue-900">{PART_TITLES[part]}</p>
        <p className="text-sm text-blue-700 mt-1">{PART_TIPS[part]}</p>
      </div>

      {/* Question Card */}
      <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 space-y-6">
        <div>
          <p className="text-lg font-semibold text-gray-900 leading-relaxed">
            {questionText}
          </p>
        </div>

        {/* Speaker Button */}
        <button
          onClick={onSpeak}
          disabled={isSponsoring}
          className={cn(
            'w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all',
            isSponsoring
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 active:scale-95'
          )}
        >
          <Volume2 className="w-5 h-5" />
          {isSponsoring ? 'Playing...' : 'Listen to Question'}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={onPrev}
          disabled={currentIndex === 0}
          className={cn(
            'flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all border-2',
            currentIndex === 0
              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 active:scale-95'
          )}
        >
          <ChevronLeft className="w-5 h-5" />
          Previous
        </button>
        <button
          onClick={onNext}
          disabled={currentIndex === totalQuestions - 1}
          className={cn(
            'flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all border-2',
            currentIndex === totalQuestions - 1
              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
              : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 active:scale-95'
          )}
        >
          Next
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
