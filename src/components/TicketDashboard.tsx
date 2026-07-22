import { motion, AnimatePresence } from "motion/react";
import { Ticket, Role, Email } from "../types";
import { cn } from "../lib/utils";
import { Search, Filter, Plus, Clock, CheckCircle2, AlertCircle, MoreVertical, X, Archive, Ticket as TicketIcon, Trash2, Mail, History, ExternalLink } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

function StatusBadge({ status }: { status: Ticket['status'] }) {
  const config: Record<Ticket['status'], { 
    icon: any, 
    color: string, 
    bg: string, 
    border: string, 
    animate?: any, 
    transition?: any 
  }> = {
    "Open": {
      icon: AlertCircle,
      color: "text-dominators-primary",
      bg: "bg-dominators-primary/10",
      border: "border-dominators-primary/20",
      animate: { 
        scale: [1, 1.1, 1],
        opacity: [0.7, 1, 0.7]
      },
      transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
    },
    "In Progress": {
      icon: Clock,
      color: "text-dominators-secondary",
      bg: "bg-dominators-secondary/10",
      border: "border-dominators-secondary/20",
      animate: { rotate: 360 },
      transition: { duration: 12, repeat: Infinity, ease: "linear" }
    },
    "Resolved": {
      icon: CheckCircle2,
      color: "text-green-400",
      bg: "bg-green-500/10",
      border: "border-green-500/20",
      animate: { y: [0, -2, 0] },
      transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
    },
    "Closed": {
      icon: Archive,
      color: "text-white/40",
      bg: "bg-white/5",
      border: "border-white/10",
    }
  };

  const { icon: Icon, color, bg, border, animate, transition } = config[status];

  return (
    <motion.div 
      whileHover={{ y: -2 }}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-500",
        bg, color, border
      )}
    >
      <motion.div
        animate={animate}
        transition={transition}
        className="flex items-center justify-center"
      >
        <Icon size={12} strokeWidth={2.5} />
      </motion.div>
      <span className="leading-none">{status}</span>
    </motion.div>
  );
}

interface TicketDashboardProps {
  tickets: Ticket[];
  emailHistory: Email[];
  onUpdateTicket: (id: string, updates: Partial<Ticket>) => void;
  onAddTicket: (subject: string, priority: Ticket['priority']) => void;
  role: Role;
  isResendConfigured?: boolean;
}

export function TicketDashboard({ tickets, emailHistory, onUpdateTicket, onAddTicket, role, isResendConfigured }: TicketDashboardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"tickets" | "history">("tickets");
  const [newSubject, setNewSubject] = useState("");
  const [newPriority, setNewPriority] = useState<Ticket['priority']>("Medium");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Ticket['status'] | "All">("All");
  const [hideDuplicates, setHideDuplicates] = useState(true);

  const filteredTickets = useMemo(() => {
    let result = [...tickets];

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.id.toLowerCase().includes(q) || 
        t.subject.toLowerCase().includes(q) || 
        t.customerId.toLowerCase().includes(q) ||
        t.email?.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== "All") {
      result = result.filter(t => t.status === statusFilter);
    }

    // Duplicate removal (same customer, same subject prefix)
    if (hideDuplicates) {
      const seen = new Set<string>();
      result = result.filter(t => {
        const key = `${t.customerId}-${t.subject.slice(0, 30).toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    return result;
  }, [tickets, searchQuery, statusFilter, hideDuplicates]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubject.trim()) {
      onAddTicket(newSubject, newPriority);
      
      toast.success("Ticket Created Successfully", {
        description: `Subject: ${newSubject}`,
        icon: <TicketIcon className="w-4 h-4 text-dominators-primary" />
      });

      setNewSubject("");
      setNewPriority("Medium");
      setIsModalOpen(false);
    }
  };

  const filteredHistory = useMemo(() => {
    let result = [...emailHistory];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e => 
        e.ticketId.toLowerCase().includes(q) || 
        e.to.toLowerCase().includes(q) || 
        e.subject.toLowerCase().includes(q)
      );
    }
    return result;
  }, [emailHistory, searchQuery]);

  return (
    <div className="max-w-6xl mx-auto px-8 py-12">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h2 className="text-4xl font-light tracking-tighter text-white mb-2">
            Support <span className="text-dominators-primary italic">{viewMode === "tickets" ? "Tickets" : "Email History"}</span>
          </h2>
          <p className="text-white/30 text-sm">
            {viewMode === "tickets" ? "Manage your active inquiries and support history." : "Review all sent communications and ticket updates."}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 p-1 rounded-xl bg-white/5 border border-white/10">
            <button 
              onClick={() => setViewMode("tickets")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] uppercase tracking-widest font-bold transition-all",
                viewMode === "tickets" ? "bg-dominators-primary text-white" : "text-white/40 hover:text-white/60"
              )}
            >
              <TicketIcon size={12} />
              Tickets
            </button>
            <button 
              onClick={() => setViewMode("history")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] uppercase tracking-widest font-bold transition-all",
                viewMode === "history" ? "bg-dominators-primary text-white" : "text-white/40 hover:text-white/60"
              )}
            >
              <History size={12} />
              History
            </button>
          </div>

          {viewMode === "tickets" && (
            <motion.button
              whileHover={{ 
                scale: 1.05,
                boxShadow: role === "agent" ? "0 20px 40px -10px rgba(249, 115, 22, 0.4)" : "0 20px 40px -10px rgba(255, 255, 255, 0.1)"
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsModalOpen(true)}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl font-medium tracking-wide relative overflow-hidden group",
                role === "agent" 
                  ? "bg-gradient-to-br from-dominators-primary to-dominators-secondary text-white" 
                  : "bg-white/5 border border-white/10 text-white/60 hover:text-white"
              )}
            >
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Plus size={18} className="relative z-10" />
              <span className="relative z-10">New Ticket</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-dominators-bg/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-light tracking-tight text-white">
                  Create <span className="text-dominators-primary italic">New Ticket</span>
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-full hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2">Subject</label>
                  <input 
                    autoFocus
                    type="text" 
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="Brief description of the issue..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-white/20 focus:outline-none focus:border-dominators-primary/50 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2">Priority</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(["Low", "Medium", "High", "Urgent"] as Ticket['priority'][]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setNewPriority(p)}
                        className={cn(
                          "py-2 rounded-lg text-[10px] uppercase tracking-widest font-bold border transition-all",
                          newPriority === p 
                            ? "bg-dominators-primary/20 border-dominators-primary text-dominators-primary shadow-lg shadow-dominators-primary/10" 
                            : "bg-white/5 border-white/10 text-white/40 hover:text-white/60"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="w-full py-4 rounded-xl bg-gradient-to-br from-dominators-primary to-dominators-secondary text-white font-bold tracking-widest uppercase text-xs shadow-xl shadow-dominators-primary/20"
                  >
                    Create Ticket
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Email History Detail Modal */}
      <AnimatePresence>
        {isHistoryModalOpen && selectedTicketId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryModalOpen(false)}
              className="absolute inset-0 bg-dominators-bg/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-light tracking-tight text-white">
                  Email History for <span className="text-dominators-primary italic">{selectedTicketId}</span>
                </h3>
                <button 
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="p-2 rounded-full hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                {emailHistory.filter(e => e.ticketId === selectedTicketId).length === 0 ? (
                  <div className="text-center py-12">
                    <Mail size={40} className="mx-auto text-white/10 mb-4" />
                    <p className="text-white/40">No emails sent for this ticket yet.</p>
                  </div>
                ) : (
                  emailHistory.filter(e => e.ticketId === selectedTicketId).map((email) => (
                    <div key={email.id} className="p-6 rounded-2xl bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-dominators-primary/20 flex items-center justify-center">
                            <Mail size={14} className="text-dominators-primary" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">{email.subject}</div>
                            <div className="text-[10px] text-white/40 uppercase tracking-widest">Sent to: {email.to}</div>
                          </div>
                        </div>
                        <div className="text-[10px] text-white/20 font-mono">
                          {new Date(email.sentAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-black/20 border border-white/5 text-xs text-white/60 leading-relaxed overflow-hidden">
                        <div dangerouslySetInnerHTML={{ __html: email.body }} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Resend Configuration Warning */}
      {role === "agent" && isResendConfigured === false && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <AlertCircle size={20} className="text-orange-500" />
            </div>
            <div>
              <div className="text-sm font-bold text-white tracking-tight">Resend API Not Configured</div>
              <div className="text-xs text-white/40">Real emails will not be sent. Add <code className="text-orange-500/80 px-1 py-0.5 bg-orange-500/5 rounded">RESEND_API_KEY</code> to the AI Studio Secrets panel. <span className="block mt-1 font-medium italic text-orange-500/60">Note: Resend trial accounts can only send to their own account email.</span></div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a 
              href="https://resend.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest font-bold text-white/60 hover:text-white hover:bg-white/10 transition-all"
            >
              Get API Key
              <ExternalLink size={12} />
            </a>
          </div>
        </motion.div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
        {[
          { label: "Total Tickets", value: tickets.length, icon: Search },
          { label: "Open", value: tickets.filter(t => t.status === "Open").length, icon: AlertCircle, color: "text-dominators-primary" },
          { label: "In Progress", value: tickets.filter(t => t.status === "In Progress").length, icon: Clock, color: "text-dominators-secondary" },
          { label: "Resolved", value: tickets.filter(t => t.status === "Resolved").length, icon: CheckCircle2, color: "text-green-400" },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5, borderColor: "rgba(255, 255, 255, 0.1)" }}
            transition={{ delay: idx * 0.1 }}
            className={cn(
              "glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden group transition-all duration-300",
              stat.color === "text-dominators-primary" && "hover:border-dominators-primary/30",
              stat.color === "text-dominators-secondary" && "hover:border-dominators-secondary/30",
              stat.color === "text-green-400" && "hover:border-green-400/30",
            )}
          >
            <div className={cn(
              "absolute -right-4 -top-4 w-16 h-16 blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500",
              stat.color === "text-dominators-primary" && "bg-dominators-primary",
              stat.color === "text-dominators-secondary" && "bg-dominators-secondary",
              stat.color === "text-green-400" && "bg-green-400",
              !stat.color && "bg-white"
            )} />
            <div className="flex items-center justify-between mb-4 relative z-10">
              <stat.icon size={20} className={cn("opacity-40 group-hover:opacity-100 transition-opacity duration-300", stat.color)} />
              <span className="text-[10px] uppercase tracking-widest text-white/20 font-bold">Overview</span>
            </div>
            <div className="text-3xl font-light text-white mb-1 relative z-10">{stat.value}</div>
            <div className="text-[10px] uppercase tracking-widest text-white/40 font-medium relative z-10">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, subject, customer or email..." 
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-white/20 focus:outline-none focus:border-dominators-primary/50 transition-colors"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative group">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="appearance-none flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all text-sm pr-10 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
            <Filter size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
          </div>
          
          <button 
            onClick={() => setHideDuplicates(!hideDuplicates)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 rounded-xl border transition-all text-sm",
              hideDuplicates 
                ? "bg-dominators-primary/20 border-dominators-primary text-dominators-primary" 
                : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10"
            )}
          >
            <Trash2 size={16} />
            {hideDuplicates ? "Duplicates Hidden" : "Show Duplicates"}
          </button>
        </div>
      </div>

      {/* Resend Configuration Warning */}
      {isResendConfigured === false && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="mb-8 overflow-hidden"
        >
          <div className="p-6 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-start gap-6">
            <div className="p-3 rounded-xl bg-orange-500/20 text-orange-400 shrink-0">
              <AlertCircle size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-bold text-orange-400 uppercase tracking-widest mb-2">Resend API Not Configured</h4>
              <p className="text-sm text-orange-400/60 leading-relaxed max-w-2xl">
                Real email sending is currently disabled. Please configure your <code className="px-1.5 py-0.5 rounded bg-orange-500/10 font-mono text-orange-300">RESEND_API_KEY</code> in the AI Studio Secrets panel to enable this feature.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Ticket Grid */}
      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
        {viewMode === "tickets" ? (
          <>
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 border-bottom border-white/10 bg-white/5">
              <div className="col-span-1 text-[10px] uppercase tracking-widest text-white/20 font-bold">ID</div>
              <div className={cn(role === "agent" ? "col-span-3" : "col-span-5", "text-[10px] uppercase tracking-widest text-white/20 font-bold")}>Subject</div>
              {role === "agent" && <div className="col-span-2 text-[10px] uppercase tracking-widest text-white/20 font-bold">Contact</div>}
              <div className="col-span-2 text-[10px] uppercase tracking-widest text-white/20 font-bold">Status</div>
              <div className="col-span-2 text-[10px] uppercase tracking-widest text-white/20 font-bold">Priority</div>
              <div className="col-span-2 text-[10px] uppercase tracking-widest text-white/20 font-bold text-right">Created</div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-white/5">
              {filteredTickets.length === 0 ? (
                <div className="px-6 py-20 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 text-white/20 mb-4">
                    <Search size={24} />
                  </div>
                  <h4 className="text-white/60 font-medium mb-1">No tickets found</h4>
                  <p className="text-white/20 text-xs">There are no active inquiries matching your criteria.</p>
                </div>
              ) : (
                filteredTickets.map((ticket, idx) => (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => {
                      setSelectedTicketId(ticket.id);
                      setIsHistoryModalOpen(true);
                    }}
                    className="grid grid-cols-12 gap-4 px-6 py-5 hover:bg-white/5 transition-colors group cursor-pointer"
                  >
                    <div className="col-span-1 font-mono text-xs text-white/40">{ticket.id}</div>
                    <div className={cn(role === "agent" ? "col-span-3" : "col-span-5", "text-sm text-white/90 font-medium group-hover:text-dominators-primary transition-colors truncate")}>{ticket.subject}</div>
                    {role === "agent" && (
                      <div className="col-span-2 flex flex-col gap-1">
                        <div className="text-xs text-white/40 font-mono">{ticket.customerId}</div>
                        {ticket.email && <div className="text-[10px] text-dominators-primary/60 truncate">{ticket.email}</div>}
                      </div>
                    )}
                    <div className="col-span-2">
                      <StatusBadge status={ticket.status} />
                    </div>
                    <div className="col-span-2 flex items-center gap-2">
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        ticket.priority === "Urgent" && "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.6)]",
                        ticket.priority === "High" && "bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.6)]",
                        ticket.priority === "Medium" && "bg-dominators-secondary shadow-[0_0_8px_rgba(249,115,22,0.6)]",
                        ticket.priority === "Low" && "bg-white/20",
                      )} />
                      <span className={cn(
                        "text-[10px] uppercase tracking-widest font-bold",
                        ticket.priority === "Urgent" && "text-red-400",
                        ticket.priority === "High" && "text-orange-400",
                        ticket.priority === "Medium" && "text-dominators-secondary",
                        ticket.priority === "Low" && "text-white/40",
                      )}>
                        {ticket.priority}
                      </span>
                    </div>
                    <div className="col-span-2 text-right text-xs text-white/20 flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        {emailHistory.some(e => e.ticketId === ticket.id) && (
                          <Mail size={12} className="text-dominators-primary/60" />
                        )}
                        <span>{ticket.createdAt}</span>
                      </div>
                      {role === "agent" && ticket.status !== "Resolved" && ticket.status !== "Closed" && (
                        <div className="flex flex-wrap justify-end gap-1">
                          {ticket.status !== "In Progress" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateTicket(ticket.id, { status: "In Progress" });
                              }}
                              className="px-2 py-1 rounded bg-dominators-secondary/20 text-dominators-secondary text-[9px] uppercase tracking-widest font-bold hover:bg-dominators-secondary/30 transition-colors"
                            >
                              Pending
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateTicket(ticket.id, { status: "Resolved" });
                            }}
                            className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-[9px] uppercase tracking-widest font-bold hover:bg-green-500/30 transition-colors"
                          >
                            Resolve
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            {/* History Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 border-bottom border-white/10 bg-white/5">
              <div className="col-span-2 text-[10px] uppercase tracking-widest text-white/20 font-bold">Ticket ID</div>
              <div className="col-span-3 text-[10px] uppercase tracking-widest text-white/20 font-bold">Recipient</div>
              <div className="col-span-4 text-[10px] uppercase tracking-widest text-white/20 font-bold">Subject</div>
              <div className="col-span-3 text-[10px] uppercase tracking-widest text-white/20 font-bold text-right">Sent At</div>
            </div>

            {/* History Rows */}
            <div className="divide-y divide-white/5">
              {filteredHistory.length === 0 ? (
                <div className="px-6 py-20 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 text-white/20 mb-4">
                    <Mail size={24} />
                  </div>
                  <h4 className="text-white/60 font-medium mb-1">No email history</h4>
                  <p className="text-white/20 text-xs">No emails have been sent yet.</p>
                </div>
              ) : (
                filteredHistory.map((email, idx) => (
                  <motion.div
                    key={email.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => {
                      setSelectedTicketId(email.ticketId);
                      setIsHistoryModalOpen(true);
                    }}
                    className="grid grid-cols-12 gap-4 px-6 py-5 hover:bg-white/5 transition-colors group cursor-pointer items-center"
                  >
                    <div className="col-span-2 font-mono text-xs text-white/40">{email.ticketId}</div>
                    <div className="col-span-3 text-sm text-white/60 truncate flex items-center gap-2">
                      {email.to}
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-tighter ${
                        email.status === 'sent' ? 'bg-green-500/20 text-green-400' : 
                        email.status === 'failed' ? 'bg-red-500/20 text-red-400' : 
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {email.status || 'sent'}
                      </span>
                    </div>
                    <div className="col-span-4 text-sm text-white/90 font-medium truncate group-hover:text-dominators-primary transition-colors flex flex-col">
                      <span>{email.subject}</span>
                      {email.error && (
                        <span className="text-[10px] text-red-400/60 truncate" title={email.error}>
                          {email.error}
                        </span>
                      )}
                    </div>
                    <div className="col-span-3 text-right text-xs text-white/20">
                      {new Date(email.sentAt).toLocaleString()}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
