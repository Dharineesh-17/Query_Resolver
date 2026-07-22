import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Sparkles } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const isEnter = e.key === "Enter";
    const isModEnter = (e.ctrlKey || e.metaKey) && isEnter;
    
    if (isModEnter || (isEnter && !e.shiftKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 150)}px`;
    }
  }, [message]);

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4 z-50 perspective-1000 preserve-3d">
      <motion.form
        initial={{ y: 50, opacity: 0, rotateX: 20, translateZ: -200 }}
        animate={{ y: 0, opacity: 1, rotateX: 0, translateZ: 0 }}
        whileHover={{ 
          rotateX: 5, 
          translateZ: 20,
          boxShadow: "0 30px 60px -12px rgba(0, 0, 0, 0.7)"
        }}
        transition={{ 
          y: { delay: 0.5, duration: 0.8, ease: [0.23, 1, 0.32, 1] },
          rotateX: { type: "spring", stiffness: 200, damping: 20 }
        }}
        onSubmit={handleSubmit}
        className="relative flex items-end gap-2 p-2 rounded-2xl glass-panel shadow-2xl shadow-black/50 preserve-3d border-white/10"
      >
        <div className="flex-1 relative translate-z-20">
          <textarea
            ref={inputRef}
            rows={1}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Dominators anything..."
            disabled={disabled}
            className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-white/30 py-3 px-4 resize-none min-h-[48px] max-h-[150px] transition-all"
          />
          
          <AnimatePresence>
            {message.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, translateZ: 10 }}
                animate={{ 
                  opacity: [0.1, 0.3, 0.1],
                  scale: [0.98, 1.02, 0.98],
                  translateZ: [10, 20, 10]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                exit={{ opacity: 0 }}
                className="absolute left-4 top-3 pointer-events-none flex items-center gap-2 text-white/20"
              >
                <Sparkles size={16} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.button
          whileHover={{ scale: 1.1, translateZ: 40, rotateY: 10 }}
          whileTap={{ scale: 0.9, translateZ: 0 }}
          type="submit"
          disabled={!message.trim() || disabled}
          className="p-3 rounded-xl bg-gradient-to-br from-dominators-primary to-dominators-secondary text-white shadow-lg shadow-dominators-primary/20 disabled:opacity-30 disabled:grayscale transition-all preserve-3d"
        >
          <Send size={20} className="translate-z-10" />
        </motion.button>
      </motion.form>
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="translate-z-10"
      >
        <p className="text-[10px] text-center mt-3 text-white/20 uppercase tracking-[0.2em] font-medium">
          Press <span className="text-white/40">Enter</span> or <span className="text-white/40">Ctrl+Enter</span> to send • <span className="text-white/40">Shift+Enter</span> for new line
        </p>
        <p className="text-[10px] text-center mt-1 text-white/10 uppercase tracking-[0.1em] font-medium">
          Powered by Dominators Intelligence Core
        </p>
      </motion.div>
    </div>
  );
}
