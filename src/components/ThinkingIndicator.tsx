import { motion } from "motion/react";
import { Square } from "lucide-react";

interface ThinkingIndicatorProps {
  onStop?: () => void;
}

export function ThinkingIndicator({ onStop }: ThinkingIndicatorProps) {
  return (
    <div className="flex items-center gap-4 mb-6 ml-1 group">
      <div className="relative w-10 h-10 flex items-center justify-center">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-dominators-primary/30 border-t-dominators-primary"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="w-2 h-2 rounded-full bg-dominators-primary"
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-dominators-primary/40"
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
          
          {onStop && (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.1, color: "#ef4444" }}
              whileTap={{ scale: 0.9 }}
              onClick={onStop}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[9px] uppercase tracking-widest text-white/40 hover:text-red-400 transition-colors"
            >
              <Square size={8} fill="currentColor" />
              Stop
            </motion.button>
          )}
        </div>
        <span className="text-[10px] uppercase tracking-widest text-white/30 font-medium">
          Dominators is reasoning...
        </span>
      </div>
    </div>
  );
}
