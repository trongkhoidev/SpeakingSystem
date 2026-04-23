import React, { useState } from 'react';
import { Modal } from '../shared/Modal';
import { Button } from '../ui/Button';
import {
  User,
  Zap,
  FileText,
  ToggleRight,
  ToggleLeft,
  ChevronRight,
  ChevronLeft,
  Check,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface TestWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (config: TestWizardConfig) => void;
  initialMode?: 'full' | 'part1' | 'part2' | 'part3';
}

export interface TestWizardConfig {
  mode: 'full' | 'part1' | 'part2' | 'part3';
  examinerVoice: string;
  questionCount: number;
  followUpEnabled: boolean;
}

export function TestWizardModal({
  isOpen,
  onClose,
  onStart,
  initialMode = 'full',
}: TestWizardModalProps) {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<TestWizardConfig>({
    mode: initialMode,
    examinerVoice: 'female-uk',
    questionCount: 5,
    followUpEnabled: true,
  });

  const voices = [
    { id: 'female-uk', name: 'Emma (UK)', accent: 'British' },
    { id: 'male-us', name: 'James (US)', accent: 'American' },
    { id: 'female-au', name: 'Olivia (AU)', accent: 'Australian' },
  ];

  const modes = [
    { id: 'full', label: 'Full Test', duration: '11-14 min' },
    { id: 'part1', label: 'Part 1', duration: '4-5 min' },
    { id: 'part2', label: 'Part 2', duration: '3-4 min' },
    { id: 'part3', label: 'Part 3', duration: '4-5 min' },
  ];

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else {
      onStart(config);
      setStep(1);
      onClose();
    }
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-6">Select the test mode you want to practice</p>
            <div className="grid grid-cols-2 gap-3">
              {modes.map((m) => (
                <button
                  key={m.id}
                  onClick={() =>
                    setConfig({
                      ...config,
                      mode: m.id as any,
                    })
                  }
                  className={cn(
                    'p-4 rounded-xl border-2 transition-all text-center',
                    config.mode === m.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-blue-300'
                  )}
                >
                  <p className="font-semibold text-gray-900">{m.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{m.duration}</p>
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-6">Choose your examiner&apos;s voice</p>
            <div className="space-y-3">
              {voices.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setConfig({ ...config, examinerVoice: v.id })}
                  className={cn(
                    'w-full p-4 rounded-xl border-2 transition-all text-left flex items-center justify-between',
                    config.examinerVoice === v.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-blue-300'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{v.name}</p>
                      <p className="text-xs text-gray-500">{v.accent} accent</p>
                    </div>
                  </div>
                  {config.examinerVoice === v.id && (
                    <Check className="w-5 h-5 text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-900">
                Number of Questions: {config.questionCount}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={config.questionCount}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    questionCount: parseInt(e.target.value),
                  })
                }
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>1 question</span>
                <span>10 questions</span>
              </div>
            </div>

            <div className="border-t pt-4">
              <button
                onClick={() =>
                  setConfig({
                    ...config,
                    followUpEnabled: !config.followUpEnabled,
                  })
                }
                className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all"
              >
                <span className="font-medium text-gray-900">Follow-up Questions</span>
                {config.followUpEnabled ? (
                  <ToggleRight className="w-5 h-5 text-blue-600" />
                ) : (
                  <ToggleLeft className="w-5 h-5 text-gray-400" />
                )}
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Get additional follow-up questions to better simulate real exam
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configure Your Test"
      description={`Step ${step} of 3: ${
        step === 1 ? 'Test Mode' : step === 2 ? 'Examiner Voice' : 'Advanced Options'
      }`}
      size="lg"
    >
      <div className="py-6">
        {/* Step Indicator */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                'flex-1 h-1 rounded-full transition-all',
                s <= step ? 'bg-blue-600' : 'bg-gray-200'
              )}
            />
          ))}
        </div>

        {/* Content */}
        {renderStep()}

        {/* Navigation */}
        <div className="flex gap-3 mt-8 pt-6 border-t">
          <button
            onClick={handlePrev}
            disabled={step === 1}
            className={cn(
              'flex-1 py-3 rounded-xl font-semibold border-2 transition-all flex items-center justify-center gap-2',
              step === 1
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            )}
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <button
            onClick={handleNext}
            className="flex-1 py-3 rounded-xl font-semibold bg-blue-600 text-white border-2 border-blue-600 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
          >
            {step === 3 ? (
              <>
                <Check className="w-4 h-4" />
                Start Test
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
