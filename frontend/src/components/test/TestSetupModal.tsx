import { useState } from 'react';
import { Modal } from '../shared/Modal';
import { Button } from '../ui/Button';
import { 
  Users, 
  Settings2, 
  FileText, 
  HelpCircle, 
  ToggleRight, 
  ToggleLeft,
  ChevronRight,
  User,
  Zap
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface TestSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (config: TestConfig) => void;
  initialMode?: 'full' | 'part1' | 'part2' | 'part3';
}

export interface TestConfig {
  mode: 'full' | 'part1' | 'part2' | 'part3';
  examinerVoice: string;
  questionCount: number;
  followUpEnabled: boolean;
}

export function TestSetupModal({ isOpen, onClose, onStart, initialMode = 'full' }: TestSetupModalProps) {
  const [config, setConfig] = useState<TestConfig>({
    mode: initialMode,
    examinerVoice: 'female-uk',
    questionCount: 5,
    followUpEnabled: true
  });

  const voices = [
    { id: 'female-uk', name: 'Emma (UK - British)', icon: <User className="w-4 h-4" /> },
    { id: 'male-us', name: 'James (US - American)', icon: <User className="w-4 h-4" /> },
    { id: 'female-au', name: 'Olivia (AU - Australian)', icon: <User className="w-4 h-4" /> },
  ];

  const modes = [
    { id: 'full', label: 'Full IELTS Test', icon: <Zap className="w-4 h-4" /> },
    { id: 'part1', label: 'Part 1 Only', icon: <FileText className="w-4 h-4" /> },
    { id: 'part2', label: 'Part 2 Only', icon: <FileText className="w-4 h-4" /> },
    { id: 'part3', label: 'Part 3 Only', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thiết lập bài thi"
      description="Tùy chỉnh trải nghiệm thi thử của bạn để đạt hiệu quả cao nhất."
      size="lg"
    >
      <div className="space-y-8 py-2">
        {/* Mode selection */}
        <div className="space-y-4">
          <label className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#4361EE]" />
            Chế độ thi
          </label>
          <div className="grid grid-cols-2 gap-3">
            {modes.map((m) => (
              <button
                key={m.id}
                onClick={() => setConfig({ ...config, mode: m.id as any })}
                className={cn(
                  "p-4 rounded-xl flex items-center gap-3 border transition-all text-[13.5px] font-medium",
                  config.mode === m.id 
                    ? "bg-[#EEF0FD] border-[#4361EE] text-[#4361EE] shadow-md shadow-indigo-100" 
                    : "bg-[#F8F9FB] border-[#E8ECF1] text-[#6B7280] hover:bg-[#F0F2F5]"
                )}
              >
                <div className={cn(
                  "p-2 rounded-lg",
                  config.mode === m.id ? "bg-[#4361EE] text-white" : "bg-white text-[#9CA3AF] border border-[#E8ECF1]"
                )}>
                  {m.icon}
                </div>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Examiner Voice */}
        <div className="space-y-4">
          <label className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-[#7C3AED]" />
            Giám khảo (Giọng đọc)
          </label>
          <div className="space-y-2">
            {voices.map((v) => (
              <button
                key={v.id}
                onClick={() => setConfig({ ...config, examinerVoice: v.id })}
                className={cn(
                  "w-full p-4 rounded-xl flex items-center justify-between border transition-all text-[13.5px] font-medium group",
                  config.examinerVoice === v.id 
                    ? "bg-[#F3F0FF] border-[#7C3AED] text-[#7C3AED]" 
                    : "bg-[#F8F9FB] border-[#E8ECF1] text-[#6B7280] hover:bg-[#F0F2F5]"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    config.examinerVoice === v.id ? "bg-[#7C3AED] text-white" : "bg-white text-[#9CA3AF] border border-[#E8ECF1]"
                  )}>
                    {v.icon}
                  </div>
                  {v.name}
                </div>
                {config.examinerVoice === v.id && (
                  <div className="w-2 h-2 rounded-full bg-[#7C3AED] animate-pulse" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="space-y-5 pt-6 border-t border-[#E8ECF1]">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-[13px] font-bold text-[#1A1D2B] flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#F59E0B]" />
                Số lượng câu hỏi
              </label>
              <p className="text-[11px] text-[#9CA3AF]">Chọn từ 2 đến 9 câu hỏi cho mỗi phần.</p>
            </div>
            <div className="flex items-center gap-4">
              <input 
                type="range" 
                min="2" 
                max="9" 
                value={config.questionCount}
                onChange={(e) => setConfig({ ...config, questionCount: parseInt(e.target.value) })}
                className="w-24 h-1.5 bg-[#E8ECF1] rounded-lg appearance-none cursor-pointer accent-[#4361EE]"
              />
              <span className="text-[13px] font-bold text-[#1A1D2B] bg-[#F0F2F5] px-3 py-1 rounded-lg min-w-[32px] text-center">
                {config.questionCount}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-[13px] font-bold text-[#1A1D2B] flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-[#1A8F5C]" />
                Câu hỏi tiếp nối (Follow-up)
              </label>
              <p className="text-[11px] text-[#9CA3AF]">AI sẽ hỏi thêm dựa trên câu trả lời của bạn.</p>
            </div>
            <button 
              onClick={() => setConfig({ ...config, followUpEnabled: !config.followUpEnabled })}
              className="text-[#D1D5DB] hover:text-[#4361EE] transition-all"
            >
              {config.followUpEnabled 
                ? <ToggleRight className="w-10 h-10 text-[#4361EE]" /> 
                : <ToggleLeft className="w-10 h-10" />
              }
            </button>
          </div>
        </div>

        {/* Start Button */}
        <div className="pt-4">
          <button 
            onClick={() => onStart(config)}
            className="btn btn-primary w-full py-4 text-[15px] shadow-indigo-100 flex items-center justify-center gap-2"
          >
            Bắt đầu bài thi ngay
            <ChevronRight className="w-4 h-4" />
          </button>
          <p className="text-[10px] text-[#9CA3AF] text-center mt-4 uppercase tracking-widest font-bold">
            Mic check: Đảm bảo bạn đang ở nơi yên tĩnh
          </p>
        </div>
      </div>
    </Modal>
  );
}
