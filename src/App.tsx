import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Message, Ticket, Role } from "./types";
import { sendMessage } from "./services/gemini";
import { ChatMessage } from "./components/ChatMessage";
import { ChatInput } from "./components/ChatInput";
import { ThinkingIndicator } from "./components/ThinkingIndicator";
import { TicketDashboard } from "./components/TicketDashboard";
import { LoginModal } from "./components/LoginModal";
import { EmailCollector } from "./components/EmailCollector";
import { cn } from "./lib/utils";
import { Toaster, toast } from "sonner";
import { Shield, Sparkles, Zap, MessageSquare, ArrowDown, LayoutDashboard, MessageCircle, User as UserIcon, ShieldCheck, LogOut, Mail, Ticket as TicketIcon } from "lucide-react";
import { auraAudio } from "./services/audio";
import { ragService } from "./services/rag";
import { Settings } from "lucide-react";
import { db, auth } from "./firebase";
import { collection, addDoc, query, where, onSnapshot, orderBy, Timestamp, doc, setDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Email } from "./types";

const CURRENT_CUSTOMER_ID = "CUST-001";

const ConfigBanner = () => (
  <div className="bg-orange-50 border-b border-orange-200 p-4">
    <div className="max-w-7xl mx-auto flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-orange-100 p-2 rounded-full">
          <Settings className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-orange-900">Setup Required: Email Service Not Configured</h3>
          <p className="text-xs text-orange-700">To send real emails, you must add your <strong>RESEND_API_KEY</strong> in the Secrets panel. <span className="block mt-1 font-medium italic">Note: Resend trial accounts can only send to their own account email.</span></p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden md:block text-[10px] text-orange-600 font-mono bg-white/50 px-2 py-1 rounded border border-orange-100">
          Settings (Gear) → Secrets → Add "RESEND_API_KEY"
        </div>
        <a 
          href="https://resend.com/api-keys" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs font-medium text-orange-600 hover:text-orange-700 underline underline-offset-4"
        >
          Get API Key
        </a>
      </div>
    </div>
  </div>
);

export default function App() {
  const [view, setView] = useState<"chat" | "tickets">("chat");
  const [role, setRole] = useState<Role>("customer");
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginDefaultRole, setLoginDefaultRole] = useState<Role>("customer");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      content: "Greetings. I am **Dominator Intelligence**, your premium knowledge copilot. I can help you search internal SOPs, documentation, and track IT support tickets. How may I assist you today?",
      intent: "Greeting",
      reasoning: "Initial user contact. Establishing professional and helpful persona as Dominator Intelligence.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const stopRef = useRef<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [tickets, setTickets] = useState<Ticket[]>([
    {
      id: "TK-8421",
      customerId: "CUST-001",
      subject: "Inquiry regarding Dominators Premium features",
      status: "In Progress",
      priority: "High",
      createdAt: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      lastUpdate: "2 hours ago"
    },
    {
      id: "TK-3152",
      customerId: "CUST-002",
      subject: "Access issue with Secure Core dashboard",
      status: "Open",
      priority: "Urgent",
      createdAt: new Date(Date.now() - 172800000).toISOString().split('T')[0],
      lastUpdate: "1 day ago"
    },
    {
      id: "TK-9941",
      customerId: "CUST-001",
      subject: "Billing clarification for annual subscription",
      status: "Resolved",
      priority: "Medium",
      createdAt: new Date(Date.now() - 432000000).toISOString().split('T')[0],
      lastUpdate: "3 days ago"
    }
  ]);

  const [isResendConfigured, setIsResendConfigured] = useState<boolean | null>(null);
  const [isMockMode, setIsMockMode] = useState<boolean | null>(null);
  const [fromEmail, setFromEmail] = useState<string | null>(null);
  const [isStaffMode, setIsStaffMode] = useState(false);
  const [emailHistory, setEmailHistory] = useState<Email[]>([]);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [simulatedUsername, setSimulatedUsername] = useState<string | null>(null);

  useEffect(() => {
    // Seed mock data for knowledge base
    ragService.seedMockData().catch(err => console.error("Failed to seed mock data:", err));
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Check for staff mode in URL
    const params = new URLSearchParams(window.location.search);
    if (params.get("staff") === "true") {
      setIsStaffMode(true);
    }

    const checkConfig = async () => {
      try {
        const response = await fetch("/api/config-status");
        const data = await response.json();
        setIsResendConfigured(data.isResendConfigured);
        setIsMockMode(data.isMockMode);
        setFromEmail(data.fromEmail);
      } catch (err) {
        console.error("Failed to check config status:", err);
      }
    };
    checkConfig();
  }, []);

  // Listen for email history
  useEffect(() => {
    if (!firebaseUser) {
      setEmailHistory([]);
      return;
    }
    
    // Only fetch if user is authenticated
    const q = query(collection(db, "emails"), orderBy("sentAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const history = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Email[];
      setEmailHistory(history);
    }, (error) => {
      console.error("Error fetching email history:", error);
    });
    return () => unsubscribe();
  }, [firebaseUser]);

  const handleUpdateTicket = (id: string, updates: Partial<Ticket>) => {
    if (role !== "agent") return; // Strict Admin-only modification
    
    setTickets(prev => prev.map(t => t.id === id ? { ...t, ...updates, lastUpdate: "Just now" } : t));
    
    // Persist to Firestore
    const ticket = tickets.find(t => t.id === id);
    if (ticket) {
      const ticketRef = doc(db, "tickets", id);
      setDoc(ticketRef, { ...ticket, ...updates, lastUpdate: "Just now" }, { merge: true })
        .catch(err => console.error("Failed to update ticket in Firestore:", err));
    }
    
    // Notify customer in chat if ticket is resolved
    if (updates.status === "Resolved") {
      const ticket = tickets.find(t => t.id === id);
      const notification: Message = {
        role: "model",
        content: `**System Notification:** Ticket **${id}** (${ticket?.subject}) has been marked as **Resolved** by our support team.`,
        intent: "System Notification",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, notification]);
      
      // Send real email if an email was provided
      if (ticket?.email) {
        const sendEmail = async () => {
          try {
            const response = await fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: ticket.email,
              subject: `Ticket Resolved: ${ticket.subject} (${ticket.id})`,
              html: `
                <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; padding: 20px;">
                  <h2 style="color: #f97316;">Ticket Resolved</h2>
                  <p>Hello,</p>
                  <p>Your support ticket <strong>${ticket.id}</strong> has been marked as <strong>Resolved</strong> by our team.</p>
                  <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                  <p style="font-size: 14px; color: #666;">
                    <strong>Subject:</strong> ${ticket.subject}<br>
                    <strong>Status:</strong> Resolved<br>
                    <strong>Date:</strong> ${new Date().toLocaleDateString()}
                  </p>
                  <p>Thank you for choosing Dominators Support.</p>
                </div>
              `
            })
          });

          if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData.error || "Failed to send email";
            
            // Provide specific guidance for Resend trial account limitations
            if (errorMessage.includes("To address must be verified") || errorMessage.includes("onboarding@resend.dev")) {
              throw new Error("Resend Trial Limit: You can only send emails to your own account email until you verify a domain or add the recipient as a 'Single Recipient' in Resend.");
            }
            
            throw new Error(errorMessage);
          }
          
          const result = await response.json();

          // Save to email history in Firestore
          await addDoc(collection(db, "emails"), {
            ticketId: ticket.id,
            customerId: ticket.customerId,
            to: ticket.email,
            subject: `Ticket Resolved: ${ticket.subject} (${ticket.id})`,
            body: `
                <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; padding: 20px;">
                  <h2 style="color: #f97316;">Ticket Resolved</h2>
                  <p>Hello,</p>
                  <p>Your support ticket <strong>${ticket.id}</strong> has been marked as <strong>Resolved</strong> by our team.</p>
                  <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                  <p style="font-size: 14px; color: #666;">
                    <strong>Subject:</strong> ${ticket.subject}<br>
                    <strong>Status:</strong> Resolved<br>
                    <strong>Date:</strong> ${new Date().toLocaleDateString()}
                  </p>
                  <p>Thank you for choosing Dominators Support.</p>
                </div>
              `,
            sentAt: new Date().toISOString(),
            status: result.simulated ? 'simulated' : 'sent'
          });

          return result;
        } catch (error: any) {
          // Even if it fails, we record the failure in history for visibility
          try {
            await addDoc(collection(db, "emails"), {
              ticketId: ticket.id,
              customerId: ticket.customerId,
              to: ticket.email,
              subject: `Ticket Resolved: ${ticket.subject} (${ticket.id})`,
              body: `
                  <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; padding: 20px;">
                    <h2 style="color: #f97316;">Ticket Resolved (FAILED TO SEND)</h2>
                    <p>Hello,</p>
                    <p>Your support ticket <strong>${ticket.id}</strong> has been marked as <strong>Resolved</strong> by our team.</p>
                    <p style="color: #ef4444; font-weight: bold;">Note: This email failed to send via Resend due to trial limits or configuration issues.</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="font-size: 14px; color: #666;">
                      <strong>Subject:</strong> ${ticket.subject}<br>
                      <strong>Status:</strong> Resolved<br>
                      <strong>Date:</strong> ${new Date().toLocaleDateString()}
                    </p>
                    <p>Thank you for choosing Dominators Support.</p>
                  </div>
                `,
              sentAt: new Date().toISOString(),
              status: 'failed',
              error: error.message
            });
          } catch (historyError) {
            console.error("Failed to save failed email to history:", historyError);
          }
          throw error;
        }
      };
        
        toast.promise(sendEmail(), {
          loading: `Sending real resolution summary to ${ticket.email}...`,
          success: (result) => {
            const isSimulated = result?.simulated;
            // Add email sent confirmation to chat after success
            setMessages(prev => [...prev, {
              role: "model",
              content: isSimulated 
                ? `**Email Simulation:** A mock resolution summary has been recorded for **${ticket.email}** (Mock Mode is ON).`
                : `**Email Confirmation:** A real resolution summary has been sent to **${ticket.email}**.`,
              intent: "Email Confirmation",
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
            return isSimulated 
              ? `Email simulation successful for ${ticket.email}`
              : `Real email successfully sent to ${ticket.email}. Please check your spam folder. (Note: Resend trial accounts can only send to your own account email)`;
          },
          error: (err) => {
            console.error("Email send error:", err);
            return `Failed to send email: ${err.message}`;
          },
        });
      }

      auraAudio.playIncoming();
    }
  };

  const handleAddTicket = (subject: string, priority: Ticket['priority']) => {
    if (role !== "agent") return; // Strict Admin-only manual creation
    
    // Check for duplicate tickets (same customer, similar subject, and open/in-progress)
    const subjectPrefix = subject.slice(0, 30).toLowerCase();
    const existingTicket = tickets.find(t => 
      t.customerId === CURRENT_CUSTOMER_ID && 
      (t.status === "Open" || t.status === "In Progress") &&
      t.subject.toLowerCase().includes(subjectPrefix)
    );

    if (existingTicket) {
      toast.warning("Duplicate Ticket Detected", {
        description: `A similar ticket (${existingTicket.id}) already exists for this customer.`,
      });
      return;
    }

    const ticketId = `TK-${Math.floor(1000 + Math.random() * 9000)}`;
    const newTicket: Ticket = {
      id: ticketId,
      customerId: CURRENT_CUSTOMER_ID, // Default for simulation
      subject,
      status: "Open",
      priority,
      createdAt: new Date().toISOString().split('T')[0],
      lastUpdate: "Just now"
    };
    setTickets(prev => [newTicket, ...prev]);

    // Persist to Firestore
    setDoc(doc(db, "tickets", ticketId), newTicket)
      .catch(err => console.error("Failed to save manual ticket to Firestore:", err));
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isScrolledUp = scrollHeight - scrollTop - clientHeight > 300;
      setShowScrollButton(isScrolledUp);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  };

  const handleSendMessage = async (content: string) => {
    auraAudio.playOutgoing();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const username = simulatedUsername || firebaseUser?.displayName || firebaseUser?.email?.split('@')[0] || "User";
    const userMessage: Message = { role: "user", content, timestamp, username };
    setMessages(prev => [...prev, userMessage]);
    setIsThinking(true);
    stopRef.current = false;
    auraAudio.startThinking();

    try {
      const response = await sendMessage(messages, content);
      
      // Check if generation was stopped
      if (stopRef.current) return;

      const aiResponse = { 
        ...response, 
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      };
      
      setMessages(prev => [...prev, aiResponse]);

      if (aiResponse.ticketRaised) {
        // Check for duplicate tickets (same customer, similar subject, and open/in-progress)
        const subjectPrefix = content.slice(0, 30).toLowerCase();
        const existingTicket = tickets.find(t => 
          t.customerId === CURRENT_CUSTOMER_ID && 
          (t.status === "Open" || t.status === "In Progress") &&
          t.subject.toLowerCase().includes(subjectPrefix)
        );

        if (existingTicket) {
          toast.info("Existing Ticket Found", {
            description: `We are already tracking this issue in Ticket ${existingTicket.id}.`,
            icon: <TicketIcon className="w-4 h-4 text-dominators-primary" />
          });
          
          setMessages(prev => [...prev, {
            role: "model",
            content: `I've found an existing open ticket for this issue: **${existingTicket.id}**. Our team is already working on it.`,
            intent: "Duplicate Prevention",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]);
          return;
        }

        const ticketId = `TK-${Math.floor(1000 + Math.random() * 9000)}`;
        const newTicket: Ticket = {
          id: ticketId,
          customerId: CURRENT_CUSTOMER_ID,
          subject: `Unresolved: ${content.slice(0, 50)}...`,
          status: "Open",
          priority: "Medium",
          createdAt: new Date().toISOString().split('T')[0],
          lastUpdate: "Just now"
        };
        setTickets(prev => [newTicket, ...prev]);

        // Persist to Firestore
        setDoc(doc(db, "tickets", ticketId), newTicket)
          .catch(err => console.error("Failed to save new ticket to Firestore:", err));

        toast.info("Support Ticket Raised", {
          description: `ID: ${ticketId} - Our team will review this shortly.`,
          icon: <TicketIcon className="w-4 h-4 text-dominators-primary" />
        });

        // Add email collection prompt
        setMessages(prev => [...prev, {
          role: "model",
          content: "To keep you updated on this ticket, could you please provide your email address?",
          needsEmail: true,
          ticketId: ticketId,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsThinking(false);
      auraAudio.stopThinking();
      if (!stopRef.current) {
        auraAudio.playIncoming();
      }
    }
  };

  const handleEmailSubmit = (ticketId: string, email: string) => {
    // Propagate email to ALL tickets for this customer so it "exists on agent side" for all their issues
    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket) {
      setTickets(prev => prev.map(t => 
        t.customerId === ticket.customerId ? { ...t, email } : t
      ));
      
      // Persist email update to Firestore for all tickets of this customer
      tickets.forEach(t => {
        if (t.customerId === ticket.customerId) {
          setDoc(doc(db, "tickets", t.id), { email }, { merge: true })
            .catch(err => console.error(`Failed to update email for ticket ${t.id}:`, err));
        }
      });
    }
    auraAudio.playIncoming();
  };

  const handleStopGeneration = () => {
    stopRef.current = true;
    setIsThinking(false);
    auraAudio.stopThinking();
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setRole("customer");
      setSimulatedUsername(null);
      setIsLoggedIn(false);
      setView("chat");
      setIsLoginModalOpen(true);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleLoginSuccess = (role: Role, username?: string) => {
    setRole(role);
    if (username) setSimulatedUsername(username);
    setIsLoggedIn(true);
    if (role === "agent") {
      setView("tickets");
    } else {
      setView("chat");
    }
  };

  const handleTestEmail = async (to: string) => {
    const testEmail = async () => {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          subject: "Dominators Support: Test Connection",
          html: `
            <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; padding: 20px;">
              <h2 style="color: #f97316;">Test Connection Successful</h2>
              <p>Hello,</p>
              <p>This is a test email to verify your Resend configuration for <strong>Dominators Support</strong>.</p>
              <p>If you received this, your email service is working correctly.</p>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 14px; color: #666;">
                <strong>Sent At:</strong> ${new Date().toLocaleString()}
              </p>
            </div>
          `
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send test email");
      }
      return await response.json();
    };

    toast.promise(testEmail(), {
      loading: `Sending test email to ${to}...`,
      success: (result) => {
        return result.simulated 
          ? `Test simulation successful for ${to}`
          : `Test email successfully sent to ${to}. Please check your inbox and spam folder.`;
      },
      error: (err) => `Test failed: ${err.message}`,
    });
  };

  // Auto-scroll to bottom and RBAC enforcement
  useEffect(() => {
    if (scrollRef.current && view === "chat") {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    
    // Enforce RBAC: If customer tries to access tickets, force back to chat
    if (role === "customer" && view === "tickets") {
      setView("chat");
    }
  }, [messages, isThinking, view, role]);

  return (
    <div className="relative h-screen w-full flex flex-col overflow-hidden">
      <Toaster position="top-right" theme="dark" />
      {isResendConfigured === false && isStaffMode && <ConfigBanner />}
      {/* Background Atmosphere */}
      <div className="atmosphere" />

      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-50 px-8 py-6 flex items-center justify-between glass-panel border-t-0 border-x-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Zap size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2 text-orange-500">
              DOMINATOR <span className="text-xs font-normal text-white/40 tracking-[0.3em]">INTELLIGENCE</span>
            </h1>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] text-white/40 uppercase tracking-widest font-medium">Core Online</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Role Status & Login */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
            {isLoggedIn ? (
              <div className="flex items-center gap-2 px-3 py-1.5">
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full animate-pulse",
                  role === "agent" ? "bg-orange-500" : "bg-blue-500"
                )} />
                <span className="text-[10px] text-white/60 uppercase tracking-widest font-bold">
                  {role === "agent" ? "Agent Active" : "Customer Mode"}
                </span>
                <button 
                  onClick={handleLogout}
                  className="ml-2 p-1.5 rounded-lg text-white/20 hover:text-white/60 hover:bg-white/5 transition-all"
                  title="Logout"
                >
                  <LogOut size={12} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => {
                  setLoginDefaultRole("agent");
                  setIsLoginModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] uppercase tracking-widest font-bold text-white/40 hover:text-white/60 transition-all"
              >
                <ShieldCheck size={12} />
                Staff Login
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 p-1 rounded-xl bg-white/5 border border-white/10">
            <button 
              onClick={() => setView("chat")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs uppercase tracking-widest font-bold transition-all",
                view === "chat" ? "bg-orange-500 text-white" : "text-white/40 hover:text-white/60"
              )}
            >
              <MessageCircle size={14} />
              Chat
            </button>
            <button 
              onClick={() => {
                if (role === "agent") {
                  setView("tickets");
                } else {
                  setLoginDefaultRole("agent");
                  setIsLoginModalOpen(true);
                }
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs uppercase tracking-widest font-bold transition-all",
                view === "tickets" ? "bg-orange-500 text-white" : "text-white/40 hover:text-white/60"
              )}
            >
              <LayoutDashboard size={14} />
              Tickets
            </button>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-6">
          <div className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-widest">
            <Shield size={14} />
            <span>Secure Core</span>
          </div>
          <div className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-widest">
            <MessageSquare size={14} />
            <span>24/7 Support</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {view === "chat" || role === "customer" ? (
            <motion.main 
              key="chat"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="h-full overflow-y-auto pt-32 pb-40 px-4 md:px-0 scroll-smooth" 
              ref={scrollRef}
              onScroll={handleScroll}
            >
              <div className="max-w-3xl mx-auto">
                {/* Welcome Banner */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-12 text-center"
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/40 uppercase tracking-widest mb-4">
                    <Sparkles size={12} className="text-orange-500" />
                    Next-Gen Customer Experience
                  </div>
                  <h2 className="text-4xl font-light tracking-tighter text-white mb-2">
                    Dominator <span className="text-orange-500 italic">Intelligence</span>
                  </h2>
                  <p className="text-white/30 text-sm max-w-md mx-auto">
                    Search internal documentation, SOPs, and IT tickets with AI-powered RAG and Agentic workflows.
                  </p>
                </motion.div>

                {/* Messages */}
                <div className="space-y-2">
                  {messages.map((msg, idx) => (
                    <div key={idx}>
                      <ChatMessage 
                        {...msg} 
                        isLast={idx === messages.length - 1}
                      />
                      {msg.needsEmail && msg.ticketId && (
                        <EmailCollector 
                          ticketId={msg.ticketId} 
                          onEmailSubmit={(email) => handleEmailSubmit(msg.ticketId!, email)} 
                        />
                      )}
                    </div>
                  ))}
                  
                  <AnimatePresence>
                    {isThinking && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <ThinkingIndicator onStop={handleStopGeneration} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.main>
          ) : (
            <motion.div
              key="tickets"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="h-full overflow-y-auto pt-32 pb-20"
            >
              <TicketDashboard 
                tickets={role === "agent" ? tickets : tickets.filter(t => t.customerId === CURRENT_CUSTOMER_ID)} 
                emailHistory={emailHistory}
                onUpdateTicket={handleUpdateTicket} 
                onAddTicket={handleAddTicket}
                role={role} 
                isResendConfigured={isResendConfigured ?? undefined}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scroll to Bottom Button (Chat only) */}
        {view === "chat" && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50">
            <AnimatePresence>
              {showScrollButton && (
                <motion.button
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.8 }}
                  whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                  whileTap={{ scale: 0.9 }}
                  onClick={scrollToBottom}
                  className="p-3 rounded-full glass-panel border-white/10 text-white/60 shadow-xl backdrop-blur-md flex items-center justify-center group"
                >
                  <ArrowDown size={18} className="group-hover:animate-bounce" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Chat Input (Chat only) */}
        {view === "chat" && (
          <ChatInput onSend={handleSendMessage} disabled={isThinking} />
        )}
      </div>

      {/* Decorative Elements */}
      <div className="fixed bottom-0 left-0 w-full h-32 bg-gradient-to-t from-dominators-bg to-transparent pointer-events-none z-10" />

      {/* Login Modal */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onLogin={handleLoginSuccess} 
        defaultRole={loginDefaultRole}
      />
    </div>
  );
}
