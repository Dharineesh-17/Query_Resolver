import { useState } from "react";
import { motion } from "motion/react";
import { Mail, Check, ArrowRight } from "lucide-react";

interface EmailCollectorProps {
  onEmailSubmit: (email: string) => void;
  ticketId: string;
}

export function EmailCollector({ onEmailSubmit, ticketId }: EmailCollectorProps) {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && email.includes("@")) {
      onEmailSubmit(email.trim());
      setIsSubmitted(true);
    }
  };

  if (isSubmitted) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 p-4 rounded-2xl bg-dominators-primary/10 border border-dominators-primary/20 mb-6 ml-12"
      >
        <div className="w-8 h-8 rounded-full bg-dominators-primary/20 flex items-center justify-center text-dominators-primary">
          <Check size={16} />
        </div>
        <p className="text-xs text-dominators-primary/80 font-medium">
          Email linked: <span className="text-white font-bold">{email}</span>. You'll receive updates for ticket <span className="text-white font-bold">{ticketId}</span>.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-2xl glass-panel border-white/10 mb-6 ml-12 max-w-md shadow-xl"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-dominators-primary/20 flex items-center justify-center text-dominators-primary">
          <Mail size={20} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white tracking-tight">Email Updates</h4>
          <p className="text-[10px] text-white/40 uppercase tracking-widest font-medium">Ticket {ticketId}</p>
        </div>
      </div>

      <p className="text-xs text-white/60 mb-4 leading-relaxed">
        Please provide your email address so we can keep you updated on the status of your support ticket.
      </p>

      <form onSubmit={handleSubmit} className="relative">
        <input 
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-dominators-primary/50 transition-all pr-12"
        />
        <button 
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-dominators-primary text-white hover:bg-dominators-secondary transition-all shadow-lg shadow-dominators-primary/20"
        >
          <ArrowRight size={16} />
        </button>
      </form>
    </motion.div>
  );
}
