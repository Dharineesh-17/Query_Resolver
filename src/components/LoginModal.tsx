import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ShieldCheck, Lock, ArrowRight, Mail } from "lucide-react";
import { cn } from "../lib/utils";
import { auth } from "../firebase";
import { signInWithPopup, GoogleAuthProvider, signInAnonymously } from "firebase/auth";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (role: "customer" | "agent", username?: string) => void;
  defaultRole?: "customer" | "agent";
}

export function LoginModal({ isOpen, onClose, onLogin, defaultRole = "customer" }: LoginModalProps) {
  const [loginRole, setLoginRole] = useState<"customer" | "agent">(defaultRole);
  
  useEffect(() => {
    setLoginRole(defaultRole);
  }, [defaultRole, isOpen]);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleGoogleLogin = async () => {
    setError("");
    setIsLoggingIn(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        // For this demo, we'll assume the agent is the one with the specific email
        const isAgent = result.user.email === "dharineeshvengatesan@gmail.com";
        onLogin(isAgent ? "agent" : "customer", result.user.displayName || result.user.email?.split('@')[0]);
        onClose();
      }
    } catch (err: any) {
      console.error("Google login error:", err);
      setError(err.message || "Failed to sign in with Google.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoggingIn(true);

    try {
      // Simulated authentication logic
      setTimeout(() => {
        if (loginRole === "agent") {
          if (username === "admin" && password === "admin") {
            onLogin("agent", "Admin");
            onClose();
            setUsername("");
            setPassword("");
          } else {
            setError("Invalid agent credentials.");
          }
        } else {
          // Customer login - any username/password for demo, or specific ones
          if (username && password) {
            onLogin("customer", username);
            onClose();
            setUsername("");
            setPassword("");
          } else {
            setError("Please enter both username and password.");
          }
        }
        setIsLoggingIn(false);
      }, 800);
    } catch (err: any) {
      console.error("Anonymous sign-in error:", err);
      setError("Failed to initialize secure session.");
      setIsLoggingIn(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#050505]/90 backdrop-blur-xl"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm glass-panel p-8 rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden"
          >
            {/* Decorative background glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-orange-500/20 blur-[80px] rounded-full" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                  <ShieldCheck size={24} className="text-orange-500" />
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mb-8">
                <h3 className="text-2xl font-light tracking-tight text-white mb-2">
                  {loginRole === "agent" ? "Agent" : "Customer"} <span className="text-orange-500 italic">Authentication</span>
                </h3>
                <p className="text-white/30 text-xs uppercase tracking-[0.2em] font-medium">
                  Secure Access Required
                </p>
              </div>

              {/* Role Toggle */}
              <div className="flex p-1 rounded-xl bg-white/5 border border-white/10 mb-6">
                <button
                  onClick={() => setLoginRole("customer")}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-[10px] uppercase tracking-widest font-bold transition-all",
                    loginRole === "customer" ? "bg-white/10 text-white" : "text-white/20 hover:text-white/40"
                  )}
                >
                  Customer
                </button>
                <button
                  onClick={() => setLoginRole("agent")}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-[10px] uppercase tracking-widest font-bold transition-all",
                    loginRole === "agent" ? "bg-orange-500/20 text-orange-500" : "text-white/20 hover:text-white/40"
                  )}
                >
                  Agent
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Username</label>
                  <div className="relative">
                    <input 
                      autoFocus
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={loginRole === "agent" ? "admin" : "your name"}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-white placeholder-white/10 focus:outline-none focus:border-orange-500/50 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Password</label>
                  <div className="relative">
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-white placeholder-white/10 focus:outline-none focus:border-orange-500/50 transition-all"
                    />
                    <Lock size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/10" />
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.p 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-red-400 text-[10px] font-bold uppercase tracking-widest text-center"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <div className="pt-4 space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isLoggingIn}
                    type="submit"
                    className={cn(
                      "w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white/40 font-bold tracking-widest uppercase text-[10px] flex items-center justify-center gap-2 transition-all hover:bg-white/10 hover:text-white",
                      isLoggingIn && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {isLoggingIn ? (
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Simulate Login
                        <ArrowRight size={14} />
                      </>
                    )}
                  </motion.button>

                  <div className="flex items-center gap-4 py-2">
                    <div className="flex-1 h-px bg-white/5" />
                    <span className="text-[8px] text-white/20 uppercase tracking-widest">OR</span>
                    <div className="flex-1 h-px bg-white/5" />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isLoggingIn}
                    type="button"
                    onClick={handleGoogleLogin}
                    className={cn(
                      "w-full py-4 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white font-bold tracking-widest uppercase text-[10px] shadow-xl shadow-orange-500/20 flex items-center justify-center gap-2 transition-all",
                      isLoggingIn && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <Mail size={14} />
                    Sign in with Google
                  </motion.button>
                </div>
              </form>
              
              <p className="mt-8 text-center text-[9px] text-white/20 uppercase tracking-widest leading-relaxed">
                Unauthorized access attempts are logged and monitored by Dominators Secure Core.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
