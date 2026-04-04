import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { MessageSquare, AlertCircle, Info } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
 } from '@/components/ui/Dialog';

interface Token {
  word: string;
  color: 'green' | 'orange' | 'red';
  error?: string;
  phonemes?: {
    phoneme: string;
    accuracy_score: number;
    errortype?: string;
  }[];
}

interface WordChipsProps {
  tokens: Token[];
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 10, scale: 0.9 },
  show: { opacity: 1, y: 0, scale: 1 }
};

export function WordChips({ tokens }: WordChipsProps) {
  return (
    <div className="space-y-10 group">
      <div className="flex items-center justify-between ml-1">
        <div className="flex items-center gap-3 text-white/40 font-black tracking-widest text-[11px] uppercase">
          <span className="w-8 h-[1px] bg-white/20" />
          Color-coded Transcript
        </div>
        <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-white/20">
          <div className="flex items-center gap-2 text-emerald-400">
            <div className="w-2 h-2 rounded-full bg-emerald-400" /> Great
          </div>
          <div className="flex items-center gap-2 text-amber-400">
            <div className="w-2 h-2 rounded-full bg-amber-400" /> Good
          </div>
          <div className="flex items-center gap-2 text-rose-400">
            <div className="w-2 h-2 rounded-full bg-rose-400" /> Needs Work
          </div>
        </div>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="flex flex-wrap gap-x-2 gap-y-4 p-10 py-14 rounded-[3rem] bg-white/[0.03] border border-white/5 relative glass-card group-hover:bg-white/[0.05] transition-all duration-700"
      >
        <div className="absolute top-6 left-8 text-primary/40">
          <MessageSquare className="w-6 h-6" />
        </div>
        
        {tokens.map((token, i) => (
          <Dialog key={i}>
            <DialogTrigger asChild>
              <motion.button 
                variants={item}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "px-4 py-2 rounded-xl text-lg md:text-xl font-bold transition-colors group/token relative inline-flex items-center gap-2",
                  token.color === 'green' ? "text-emerald-400 hover:bg-emerald-500/10" : 
                  token.color === 'orange' ? "text-amber-400 hover:bg-amber-500/10" : 
                  "text-rose-400 hover:bg-rose-500/10"
                )}
              >
                {token.word}
                {token.color !== 'green' && (
                  <AlertCircle className="w-3.5 h-3.5 opacity-0 group-hover/token:opacity-40 transition-opacity" />
                )}
              </motion.button>
            </DialogTrigger>
            
            {token.phonemes && token.phonemes.length > 0 && (
              <DialogContent className="max-w-md bg-background-primary border-white/10 rounded-[2rem] p-10 overflow-hidden shadow-2xl backdrop-blur-2xl ring-1 ring-white/10">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500/40 via-amber-500/40 to-rose-500/40" />
                
                <DialogHeader className="mb-10 text-center">
                  <div className="flex items-center justify-center gap-3 text-white/40 font-black tracking-widest text-[10px] uppercase mb-4">
                    Phoneme Detail
                    <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                    {token.word}
                  </div>
                  <DialogTitle className="text-4xl font-black text-white drop-shadow-md">
                    /{token.word}/
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-8">
                  <div className="flex flex-wrap justify-center gap-4">
                    {token.phonemes.map((ph, pi) => (
                      <motion.div 
                        key={pi} 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: pi * 0.05 }}
                        className={cn(
                          "flex flex-col items-center gap-3 p-4 rounded-2xl min-w-[70px] border transition-all duration-500 hover:scale-105 group/phoneme",
                          ph.accuracy_score >= 80 ? "bg-emerald-500/10 border-emerald-500/20" :
                          ph.accuracy_score >= 60 ? "bg-amber-500/10 border-amber-500/20" :
                          "bg-rose-500/10 border-rose-500/20"
                        )}
                      >
                        <span className={cn(
                          "text-2xl font-black transition-colors",
                          ph.accuracy_score >= 80 ? "text-emerald-400" :
                          ph.accuracy_score >= 60 ? "text-amber-400" :
                          "text-rose-400"
                        )}>{ph.phoneme}</span>
                        <div className="h-[1px] w-full bg-white/10" />
                        <span className="text-[10px] font-black tracking-widest text-white/40">{ph.accuracy_score.toFixed(0)}%</span>
                      </motion.div>
                    ))}
                  </div>

                  <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex items-start gap-4 transition-colors hover:bg-white/[0.08]">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                      <Info className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-black text-white uppercase tracking-widest">Phân tích</p>
                      <p className="text-white/60 text-sm font-medium leading-relaxed italic">
                        {token.error ? `Phát hiện lỗi: ${token.error}. Bạn cần chú ý vào các âm tiết hiện màu đỏ.` : "Phát hiện phát âm chính xác và ổn định."}
                      </p>
                    </div>
                  </div>
                </div>
              </DialogContent>
            )}
          </Dialog>
        ))}
      </motion.div>
    </div>
  );
}
