import React from 'react';
import { BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip, ResponsiveContainer } from 'recharts';

/**
 * InsightDashboard Component
 * 
 * Displays IELTS assessment results:
 * - Color-coded transcript (green = correct, red = errors)
 * - Radar chart for 4 IELTS criteria
 * - Band score breakdown
 */
interface BandScores {
  fluency_coherence: number;
  lexical_resource: number;
  grammatical_accuracy: number;
  pronunciation: number;
}

interface ColorCodedWord {
  word: string;
  color: string;
  phonetic_error?: boolean;
}

interface InsightDashboardProps {
  bandScores: BandScores;
  overallBand: number;
  colorCodedTranscript: ColorCodedWord[];
  feedback: string;
}

export const InsightDashboard: React.FC<InsightDashboardProps> = ({
  bandScores,
  overallBand,
  colorCodedTranscript,
  feedback,
}) => {
  // Prepare data for radar chart
  const radarData = [
    {
      name: 'Fluency',
      value: bandScores.fluency_coherence,
      fullMark: 9,
    },
    {
      name: 'Lexical',
      value: bandScores.lexical_resource,
      fullMark: 9,
    },
    {
      name: 'Grammar',
      value: bandScores.grammatical_accuracy,
      fullMark: 9,
    },
    {
      name: 'Pronunciation',
      value: bandScores.pronunciation,
      fullMark: 9,
    },
  ];

  // Count correct/incorrect words
  const correctCount = colorCodedTranscript.filter(w => w.color === 'green').length;
  const totalWords = colorCodedTranscript.length;
  const accuracyPercent = ((correctCount / totalWords) * 100).toFixed(1);

  const getBandColor = (band: number): string => {
    if (band >= 7.5) return '#10b981'; // emerald
    if (band >= 6.5) return '#3b82f6'; // blue
    if (band >= 5.5) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header - Overall Score */}
        <div className="mb-12 text-center">
          <div className="inline-block">
            <div
              className="w-32 h-32 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: getBandColor(overallBand) + '20' }}
            >
              <div
                className="text-5xl font-bold"
                style={{ color: getBandColor(overallBand) }}
              >
                {overallBand.toFixed(1)}
              </div>
            </div>
            <p className="text-slate-400">Overall IELTS Band</p>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Left: Radar Chart */}
          <div className="lg:col-span-1 bg-slate-800/50 rounded-lg p-6 border border-slate-700">
            <h3 className="text-white font-semibold mb-4">4 IELTS Criteria</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#475569" />
                <PolarAngleAxis dataKey="name" stroke="#cbd5e1" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 9]}
                  stroke="#475569"
                  tick={{ fontSize: 12 }}
                />
                <Radar
                  name="Score"
                  dataKey="value"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>

            {/* Score Details */}
            <div className="grid grid-cols-2 gap-3 mt-6 text-sm">
              {Object.entries(bandScores).map(([key, value]) => (
                <div key={key} className="bg-slate-700/50 p-2 rounded">
                  <div className="text-slate-400 capitalize">
                    {key.replace(/_/g, ' ')}
                  </div>
                  <div className="text-lg font-semibold text-white">
                    {value.toFixed(1)} / 9
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Color-Coded Transcript */}
          <div className="lg:col-span-2">
            {/* Accuracy Stats */}
            <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700 mb-6">
              <h3 className="text-white font-semibold mb-4">Pronunciation Accuracy</h3>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-sm text-slate-400 mb-2">
                    <span>Correct: {correctCount}/{totalWords}</span>
                    <span>{accuracyPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${accuracyPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Color-Coded Transcript */}
            <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
              <h3 className="text-white font-semibold mb-4">Transcript</h3>
              <div className="flex flex-wrap gap-2">
                {colorCodedTranscript.map((item, idx) => (
                  <span
                    key={idx}
                    className={`px-3 py-1 rounded text-sm font-medium cursor-pointer hover:opacity-75 transition-opacity ${
                      item.color === 'green'
                        ? 'bg-green-500/20 text-green-200'
                        : 'bg-red-500/20 text-red-200'
                    }`}
                    title={item.phonetic_error ? 'Pronunciation error detected' : 'Correct'}
                  >
                    {item.word}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Section */}
        <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-4">AI Feedback</h3>
          <p className="text-slate-300 leading-relaxed">{feedback}</p>
        </div>
      </div>
    </div>
  );
};
