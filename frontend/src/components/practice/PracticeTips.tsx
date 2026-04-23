import { Lightbulb } from 'lucide-react';

interface PracticeTipsProps {
  part?: number;
}

const TIPS: Record<number, string[]> = {
  1: [
    'Keep answers brief and natural (2-3 sentences)',
    'Maintain steady eye contact and speak clearly',
    'Avoid very long pauses before answering',
    'Use simple, conversational language',
    'Try to expand on your answers with reasons',
  ],
  2: [
    'Use the 1-minute preparation time wisely',
    'Write down key points on the cue card',
    'Aim to speak for the full 1-2 minutes',
    'Use connectors (however, also, for example)',
    'Remember to address all points on the cue card',
  ],
  3: [
    'Engage actively in the discussion',
    'Always provide reasons and examples',
    'Don\'t be afraid to disagree respectfully',
    'Ask clarifying questions if needed',
    'Build on the examiner\'s topics naturally',
  ],
};

export function PracticeTips({ part = 1 }: PracticeTipsProps) {
  const tips = TIPS[part] || TIPS[1];

  return (
    <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6">
      <div className="flex items-start gap-3">
        <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-amber-900 mb-3">Tips for Part {part}</h4>
          <ul className="space-y-2">
            {tips.map((tip, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-sm text-amber-800"
              >
                <span className="font-semibold text-amber-600 mt-0.5">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
