import { useState } from 'react';
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';
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
    { id: 'female-uk', name: 'Emma (UK - British Accent)', icon: <User className="w-4 h-4" /> },
    { id: 'male-us', name: 'James (US - American Accent)', icon: <User className="w-4 h-4" /> },
    { id: 'female-au', name: 'Olivia (AU - Australian Accent)', icon: <User className="w-4 h-4" /> },
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
      <div className="space-y-8 py-4">
        {/* Mode selection */}
        <div className="space-y-4">
          <label className="text-sm font-bold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Chế độ thi
          </label>
          <div className="grid grid-cols-2 gap-3">
            {modes.map((m) => (
              <button
                key={m.id}
                onClick={() => setConfig({ ...config, mode: m.id as any })}
                className={cn(
                  "p-4 rounded-xl flex items-center gap-3 border transition-all text-sm font-medium",
                  config.mode === m.id 
                    ? "bg-primary/20 border-primary text-white shadow-lg shadow-primary/10" 
                    : "bg-white/5 border-white/5 text-text-secondary hover:bg-white/[0.08]"
                )}
              >
                <div className={cn(
                  "p-2 rounded-lg",
                  config.mode === m.id ? "bg-primary/20 text-primary" : "bg-white/5 text-text-muted"
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
          <label className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-secondary" />
            Giám khảo (Giọng đọc)
          </label>
          <div className="space-y-2">
            {voices.map((v) => (
              <button
                key={v.id}
                onClick={() => setConfig({ ...config, examinerVoice: v.id })}
                className={cn(
                  "w-full p-4 rounded-xl flex items-center justify-between border transition-all text-sm font-medium group",
                  config.examinerVoice === v.id 
                    ? "bg-secondary/20 border-secondary text-white shadow-lg shadow-secondary/10" 
                    : "bg-white/5 border-white/5 text-text-secondary hover:bg-white/[0.08]"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    config.examinerVoice === v.id ? "bg-secondary/20 text-secondary" : "bg-white/5 text-text-muted"
                  )}>
                    {v.icon}
                  </div>
                  {v.name}
                </div>
                {config.examinerVoice === v.id && (
                  <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="space-y-5 pt-2 border-t border-white/5">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-accent" />
                Số lượng câu hỏi (Part 1/3)
              </label>
              <p className="text-xs text-text-muted">Chọn từ 2 đến 9 câu hỏi cho mỗi phần.</p>
            </div>
            <div className="flex items-center gap-4">
              <input 
                type="range" 
                min="2" 
                max="9" 
                value={config.questionCount}
                onChange={(e) => setConfig({ ...config, questionCount: parseInt(e.target.value) })}
                className="w-32 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <span className="text-sm font-bold text-white bg-white/10 px-3 py-1 rounded-md min-w-[32px] text-center">
                {config.questionCount}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-bold text-white flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-emerald-400" />
                Câu hỏi tiếp nối (Follow-up)
              </label>
              <p className="text-xs text-text-muted">AI sẽ tự động hỏi thêm dựa trên câu trả lời của bạn.</p>
            </div>
            <button 
              onClick={() => setConfig({ ...config, followUpEnabled: !config.followUpEnabled })}
              className="text-text-muted hover:text-white transition-colors"
            >
              {config.followUpEnabled 
                ? <ToggleRight className="w-10 h-10 text-success" /> 
                : <ToggleLeft className="w-10 h-10" />
              }
            </button>
          </div>
        </div>

        {/* Start Button */}
        <div className="pt-4">
          <Button 
            onClick={() => onStart(config)}
            className="w-full h-14 text-lg font-bold bg-gradient-to-r from-primary to-secondary group gap-2"
          >
            Bắt đầu bài thi ngay
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          <p className="text-[10px] text-text-muted text-center mt-3 uppercase tracking-widest font-bold">
            Mic check: Đảm bảo bạn đang ở nơi yên tĩnh
          </p>
        </div>
      </div>
    </Modal>
  );
}
