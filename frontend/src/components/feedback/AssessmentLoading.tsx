import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Mic2, Brain, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const STAGES = [
  { id: 'gatekeeper', label: 'Bảo vệ đầu vào', description: 'Đang xác thực nội dung câu trả lời...', icon: Shield, color: 'text-blue-400' },
  { id: 'azure', label: 'Phân tích âm học', description: 'Azure AI đang chấm điểm phát âm...', icon: Mic2, color: 'text-emerald-400' },
  { id: 'llm', label: 'Đánh giá ngôn ngữ', description: 'DeepSeek đang phân tích ngữ pháp & từ vựng...', icon: Brain, color: 'text-indigo-400' }
];

export function AssessmentLoading() {
  const [currentStage, setCurrentStage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStage((prev) => (prev < STAGES.length - 1 ? prev + 1 : prev));
    }, 2000); // Simulate stage progress every 2s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-12 md:p-20 space-y-12 text-center">
      <div className="relative">
        {/* Pulsing ring background */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute inset-0 -m-8 bg-primary/20 rounded-full blur-3xl"
        />
        
        <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full bg-white/[0.03] border border-white/5 flex items-center justify-center shadow-2xl backdrop-blur-3xl overflow-hidden group">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStage}
              initial={{ y: 20, opacity: 0, scale: 0.8 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -20, opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={cn("p-6", STAGES[currentStage].color)}
            >
              {STAGES[currentStage].icon === Shield && <Shield className="w-16 h-16 md:w-20 md:h-20" />}
              {STAGES[currentStage].icon === Mic2 && <Mic2 className="w-16 h-16 md:w-20 md:h-20" />}
              {STAGES[currentStage].icon === Brain && <Brain className="w-16 h-16 md:w-20 md:h-20" />}
            </motion.div>
          </AnimatePresence>
          
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full"
          />
        </div>
      </div>

      <div className="space-y-6 max-w-sm">
        <div className="space-y-2">
          <h3 className="text-2xl font-black text-white font-heading">
            {STAGES[currentStage].label}
          </h3>
          <p className="text-text-secondary font-medium text-sm leading-relaxed opacity-60">
            {STAGES[currentStage].description}
          </p>
        </div>

        <div className="flex gap-2 justify-center">
          {STAGES.map((_, i) => (
            <div 
              key={i} 
              className={cn(
                "h-1.5 rounded-full transition-all duration-700",
                i === currentStage ? "w-10 bg-primary shadow-[0_0_15px_rgba(124,58,237,0.5)]" : 
                i < currentStage ? "w-6 bg-emerald-500/40" : "w-6 bg-white/10"
              )} 
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 w-full">
        {STAGES.map((stage, i) => (
          <div 
            key={stage.id}
            className={cn(
              "flex items-center gap-4 p-5 rounded-2xl border transition-all duration-500",
              i === currentStage ? "bg-white/5 border-white/10 scale-105 shadow-xl" :
              i < currentStage ? "bg-emerald-500/5 border-emerald-500/10 opacity-60" :
              "bg-transparent border-transparent opacity-20"
            )}
          >
            <div className={cn(
              "p-2 rounded-xl",
              i === currentStage ? "bg-primary/20 text-primary" :
              i < currentStage ? "bg-emerald-500/20 text-emerald-400" :
              "bg-white/5 text-white/20"
            )}>
              {i < currentStage ? <Check className="w-5 h-5" /> : (i === currentStage ? <Loader2 className="w-5 h-5 animate-spin" /> : <stage.icon className="w-5 h-5" />)}
            </div>
            <div className="text-left">
              <p className={cn(
                "text-xs font-black uppercase tracking-widest mb-0.5",
                i === currentStage ? "text-white" : "text-white/40"
              )}>{stage.label}</p>
              {i === currentStage && (
                <p className="text-[10px] text-text-tertiary font-bold">{stage.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
