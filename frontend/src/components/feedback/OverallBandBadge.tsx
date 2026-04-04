import { useEffect, useState } from 'react';
import { motion, animate } from 'framer-motion';
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';

interface OverallBandBadgeProps {
  band: number;
}

export function OverallBandBadge({ band }: OverallBandBadgeProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, band, {
      duration: 2,
      ease: [0.16, 1, 0.3, 1], // Custom cubic-bezier
      onUpdate: (value) => setDisplayValue(value),
    });

    if (band >= 7.5) {
      const timer = setTimeout(() => {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#34d399', '#6ee7b7', '#ffffff'],
          zIndex: 100
        });
      }, 1000);
      return () => {
        controls.stop();
        clearTimeout(timer);
      };
    }
    
    return () => controls.stop();
  }, [band]);

  const getBadgeStyles = (val: number) => {
    if (val >= 7.5) {
      return { 
        bg: "from-emerald-500/20 to-emerald-400/5", 
        border: "border-emerald-500/30", 
        text: "text-emerald-400", 
        shadow: "shadow-emerald-500/10",
        pulse: "bg-emerald-400/20"
      };
    } else if (val >= 6.0) {
      return { 
        bg: "from-amber-500/20 to-amber-400/5", 
        border: "border-amber-500/30", 
        text: "text-amber-400", 
        shadow: "shadow-amber-500/10",
        pulse: "bg-amber-400/20"
      };
    } else {
      return { 
        bg: "from-rose-500/20 to-rose-400/5", 
        border: "border-rose-500/30", 
        text: "text-rose-400", 
        shadow: "shadow-rose-500/10",
        pulse: "bg-rose-400/20"
      };
    }
  };

  const styles = getBadgeStyles(band);

  return (
    <motion.div 
      initial={{ scale: 0, rotate: -20, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ 
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: 0.2
      }}
      className="relative group perspective-1000"
    >
      {/* Background Pulse Effect */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.3, 0.1]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className={cn(
          "absolute -inset-4 rounded-full transition-all duration-1000 blur-3xl opacity-20 group-hover:opacity-40",
          styles.pulse
        )} 
      />
      
      <div className={cn(
        "relative w-36 h-36 md:w-48 md:h-48 rounded-full flex flex-col items-center justify-center border-4 backdrop-blur-3xl transition-all duration-700 hover-lift transform-gpu group-hover:rotate-6 bg-gradient-to-br shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]",
        styles.bg,
        styles.border,
        styles.shadow
      )}>
        <p className="text-white/40 font-black tracking-widest text-[10px] md:text-[12px] uppercase mb-1 md:mb-2 drop-shadow-sm">Estimated Band</p>
        <motion.div 
          className={cn(
            "text-6xl md:text-8xl font-black font-heading tracking-tighter leading-none drop-shadow-lg",
            styles.text
          )}
        >
          {displayValue.toFixed(1)}
        </motion.div>
        
        {/* Shine Overlay Effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none" />
      </div>
    </motion.div>
  );
}
