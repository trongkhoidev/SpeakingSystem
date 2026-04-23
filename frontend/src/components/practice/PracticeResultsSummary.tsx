import React from 'react';
import { CheckCircle2, TrendingUp, BarChart3, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PracticeResult {
  questionId: string;
  questionText: string;
  part: number;
  overallBand?: number;
  fluency?: number;
  coherence?: number;
  grammar?: number;
  vocabulary?: number;
}

interface PracticeResultsSummaryProps {
  results: PracticeResult[];
  sessionTitle: string;
  onContinue: () => void;
  onDownload?: () => void;
}

export function PracticeResultsSummary({
  results,
  sessionTitle,
  onContinue,
  onDownload,
}: PracticeResultsSummaryProps) {
  const averageBand = results.reduce((sum, r) => sum + (r.overallBand || 0), 0) / results.length;
  const partBreakdown = [1, 2, 3].map((part) => {
    const partResults = results.filter((r) => r.part === part);
    const avgBand = partResults.reduce((sum, r) => sum + (r.overallBand || 0), 0) / (partResults.length || 1);
    return { part, count: partResults.length, avgBand };
  });

  const bandColor = (band?: number) => {
    if (!band) return 'bg-gray-100 text-gray-700';
    if (band >= 7.5) return 'bg-emerald-100 text-emerald-700';
    if (band >= 6.5) return 'bg-blue-100 text-blue-700';
    if (band >= 5.5) return 'bg-amber-100 text-amber-700';
    return 'bg-orange-100 text-orange-700';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Practice Session Complete</h2>
        <p className="text-gray-600">{sessionTitle}</p>
      </div>

      {/* Overall Score */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-8 text-center">
        <p className="text-sm font-semibold text-gray-700 mb-2">OVERALL BAND</p>
        <div className="text-5xl font-bold text-blue-600 mb-2">
          {averageBand.toFixed(1)}
        </div>
        <p className="text-gray-600">Based on {results.length} questions</p>
      </div>

      {/* Part Breakdown */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Performance by Part
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {partBreakdown.map((pb) => (
            <div
              key={pb.part}
              className="border-2 border-gray-200 rounded-xl p-4 text-center hover:border-blue-300 transition-all"
            >
              <p className="text-xs font-bold text-gray-600 uppercase mb-2">Part {pb.part}</p>
              <p className={cn('text-2xl font-bold mb-1', bandColor(pb.avgBand))}>
                {pb.avgBand.toFixed(1)}
              </p>
              <p className="text-xs text-gray-500">{pb.count} questions</p>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Results */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Detailed Results
        </h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {results.map((result, idx) => (
            <div
              key={result.questionId}
              className="border border-gray-200 rounded-lg p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 line-clamp-2">
                    {result.questionText}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Part {result.part}</p>
                </div>
                <div
                  className={cn(
                    'px-3 py-1 rounded-lg font-bold text-sm flex-shrink-0',
                    bandColor(result.overallBand)
                  )}
                >
                  {result.overallBand?.toFixed(1) || '-'}
                </div>
              </div>

              {/* Score Breakdown */}
              {(result.fluency ||
                result.coherence ||
                result.grammar ||
                result.vocabulary) && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {result.fluency && (
                    <div className="bg-gray-50 p-2 rounded">
                      <span className="text-gray-600">Fluency:</span>
                      <span className="ml-1 font-semibold">{result.fluency.toFixed(1)}</span>
                    </div>
                  )}
                  {result.coherence && (
                    <div className="bg-gray-50 p-2 rounded">
                      <span className="text-gray-600">Coherence:</span>
                      <span className="ml-1 font-semibold">{result.coherence.toFixed(1)}</span>
                    </div>
                  )}
                  {result.grammar && (
                    <div className="bg-gray-50 p-2 rounded">
                      <span className="text-gray-600">Grammar:</span>
                      <span className="ml-1 font-semibold">{result.grammar.toFixed(1)}</span>
                    </div>
                  )}
                  {result.vocabulary && (
                    <div className="bg-gray-50 p-2 rounded">
                      <span className="text-gray-600">Vocabulary:</span>
                      <span className="ml-1 font-semibold">{result.vocabulary.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onDownload}
          className="flex-1 py-3 rounded-xl font-semibold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 active:scale-95 transition-all"
        >
          <TrendingUp className="w-4 h-4 inline mr-2" />
          Export Report
        </button>
        <button
          onClick={onContinue}
          className="flex-1 py-3 rounded-xl font-semibold bg-blue-600 text-white border-2 border-blue-600 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
