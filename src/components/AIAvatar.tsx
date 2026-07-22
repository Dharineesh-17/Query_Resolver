import { motion } from "motion/react";

export function AIAvatar() {
  return (
    <div className="relative w-10 h-10 flex items-center justify-center perspective-1000 preserve-3d">
      {/* Pulse Rings */}
      <motion.div
        className="absolute inset-0 rounded-full bg-dominators-primary/20"
        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5], translateZ: [-20, 20, -20] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute inset-0 rounded-full bg-dominators-secondary/20"
        animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3], translateZ: [20, -20, 20] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      
      {/* Core Avatar */}
      <motion.div 
        animate={{ 
          rotateY: [0, 360],
          y: [0, -5, 0]
        }}
        transition={{ 
          rotateY: { duration: 10, repeat: Infinity, ease: "linear" },
          y: { duration: 3, repeat: Infinity, ease: "easeInOut" }
        }}
        className="relative w-full h-full rounded-full bg-gradient-to-br from-dominators-primary to-dominators-secondary flex items-center justify-center overflow-hidden border border-white/20 shadow-lg shadow-dominators-primary/40 preserve-3d"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.3),transparent_70%)]" />
        <motion.svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6 text-white translate-z-50"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d="M12 8V4H8" />
          <rect width="16" height="12" x="4" y="8" rx="2" />
          <path d="M2 14h2" />
          <path d="M20 14h2" />
          <path d="M15 13v2" />
          <path d="M9 13v2" />
        </motion.svg>
      </motion.div>
    </div>
  );
}
