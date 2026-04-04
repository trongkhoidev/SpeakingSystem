import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface SkeletonProps {
  className?: string;
  count?: number;
}

export function Skeleton({ className, count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.1,
          }}
          className={cn(
            "rounded-md bg-white/5 border border-white/5",
            className
          )}
        />
      ))}
    </>
  );
}
