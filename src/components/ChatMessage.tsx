import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/src/lib/utils";
import { AIAvatar } from "./AIAvatar";
import { User, Copy, Check, Mail, BookOpen, ExternalLink } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { SearchResult } from "../types";

interface ChatMessageProps {
  role: "user" | "model";
  content: string;
  username?: string;
  intent?: string;
  reasoning?: string;
  isLast?: boolean;
  timestamp?: string;
  sources?: SearchResult[];
}

export function ChatMessage({ role, content, username, intent, reasoning, isLast, timestamp, sources }: ChatMessageProps) {
  const isAI = role === "model";
  const [displayedContent, setDisplayedContent] = useState(isAI && isLast ? "" : content);
  const [isTyping, setIsTyping] = useState(isAI && isLast);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const closeMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  useEffect(() => {
    if (contextMenu) {
      window.addEventListener('click', closeMenu);
      window.addEventListener('scroll', closeMenu);
      return () => {
        window.removeEventListener('click', closeMenu);
        window.removeEventListener('scroll', closeMenu);
      };
    }
  }, [contextMenu, closeMenu]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      closeMenu();
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  useEffect(() => {
    if (isAI && isLast) {
      let i = 0;
      const interval = setInterval(() => {
        setDisplayedContent(content.slice(0, i));
        i++;
        if (i > content.length) {
          clearInterval(interval);
          setIsTyping(false);
        }
      }, 15);
      return () => clearInterval(interval);
    } else {
      setDisplayedContent(content);
      setIsTyping(false);
    }
  }, [content, isAI, isLast]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      viewport={{ once: false, margin: "-10% 0px -10% 0px" }}
      transition={{ 
        duration: 0.6, 
        ease: [0.22, 1, 0.36, 1]
      }}
      className={cn(
        "flex w-full gap-4 mb-6",
        isAI ? "flex-row justify-start" : "flex-row-reverse justify-start"
      )}
    >
      <div className="flex-shrink-0 mt-1">
        {isAI ? (
          <AIAvatar />
        ) : (
          <div className="w-10 h-10 rounded-full bg-dominators-primary/20 border border-dominators-primary/30 flex items-center justify-center text-dominators-primary font-bold text-lg uppercase shadow-lg shadow-dominators-primary/10">
            {username ? username.charAt(0) : <User size={20} />}
          </div>
        )}
      </div>

      <div className={cn(
        "max-w-[80%] flex flex-col",
        isAI ? "items-start" : "items-end"
      )}>
        {isAI && intent && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              "flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-semibold mb-1 ml-1",
              intent === "Email Confirmation" ? "text-green-400" : "text-dominators-primary"
            )}
          >
            {intent === "Email Confirmation" && <Mail size={10} />}
            {intent}
          </motion.div>
        )}

        <motion.div 
          onContextMenu={handleContextMenu}
          whileHover={{ 
            scale: 1.02, 
            y: -3, 
            backgroundColor: isAI ? "rgba(255, 255, 255, 0.08)" : "rgba(249, 115, 22, 0.2)",
            boxShadow: isAI 
              ? "0 10px 30px -10px rgba(124, 58, 237, 0.3)" 
              : "0 10px 30px -10px rgba(249, 115, 22, 0.3)",
            borderColor: isAI ? "rgba(124, 58, 237, 0.4)" : "rgba(249, 115, 22, 0.4)"
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={cn(
            "px-5 py-4 rounded-2xl glass-panel relative overflow-hidden cursor-default border transition-colors",
            isAI 
              ? "rounded-tl-none text-white/90 border-white/10" 
              : "rounded-tr-none bg-dominators-primary/10 border-dominators-primary/20 text-white"
          )}
        >
          {/* Subtle glow for AI messages */}
          {isAI && (
            <div className="absolute top-0 left-0 w-1 h-full bg-dominators-primary/50" />
          )}

          <div className="markdown-body relative">
            <ReactMarkdown>{displayedContent}</ReactMarkdown>
            {isTyping && (
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="inline-block w-1.5 h-4 ml-1 bg-dominators-primary align-middle"
              />
            )}
          </div>

          {isAI && sources && sources.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-4 pt-4 border-t border-white/5"
            >
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/40 font-bold mb-3">
                <BookOpen size={12} className="text-dominators-primary" />
                Knowledge Sources
              </div>
              <div className="grid grid-cols-1 gap-2">
                {sources.map((source, sIdx) => (
                  <motion.div 
                    key={sIdx}
                    whileHover={{ x: 4, backgroundColor: "rgba(255, 255, 255, 0.03)" }}
                    className="p-2 rounded-lg bg-white/5 border border-white/5 group transition-all"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-dominators-primary uppercase tracking-tight">
                        {source.document.source}
                      </span>
                      <span className="text-[9px] text-white/20 font-mono">
                        Match: {(source.score * 100).toFixed(1)}%
                      </span>
                    </div>
                    <h4 className="text-xs font-semibold text-white/80 mb-1 group-hover:text-white transition-colors">
                      {source.document.title}
                    </h4>
                    <p className="text-[10px] text-white/40 line-clamp-2 leading-relaxed">
                      {source.document.content}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>

        {timestamp && (
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[9px] uppercase tracking-widest text-white/20 mt-1.5 px-1 font-medium"
          >
            {timestamp}
          </motion.span>
        )}
      </div>

      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 5 }}
            style={{ 
              position: 'fixed', 
              top: contextMenu.y, 
              left: contextMenu.x,
              zIndex: 1000
            }}
            className="glass-panel border border-white/10 p-1 rounded-xl shadow-2xl min-w-[160px] backdrop-blur-xl"
          >
            <button
              onClick={handleCopy}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-all text-sm group"
            >
              <div className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center group-hover:bg-dominators-primary/20 transition-colors">
                {isCopied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              </div>
              <span className="font-medium tracking-wide">Copy Message</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
