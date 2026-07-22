export type Role = "customer" | "agent";

export interface Message {
  role: "user" | "model";
  content: string;
  username?: string;
  intent?: string;
  reasoning?: string;
  timestamp?: string;
  ticketRaised?: boolean;
  ticketId?: string;
  needsEmail?: boolean;
  sources?: SearchResult[];
}

export interface Ticket {
  id: string;
  customerId: string;
  email?: string;
  subject: string;
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  priority: "Low" | "Medium" | "High" | "Urgent";
  createdAt: string;
  lastUpdate: string;
}

export interface Email {
  id: string;
  ticketId: string;
  customerId: string;
  to: string;
  subject: string;
  body: string;
  sentAt: string;
  status?: 'sent' | 'failed' | 'simulated';
  error?: string;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  source: string;
  category: "SOP" | "Documentation" | "Ticket" | "Wiki";
  embedding?: number[];
  metadata?: Record<string, any>;
}

export interface SearchResult {
  document: KnowledgeDocument;
  score: number;
}

export interface AgentTool {
  name: string;
  description: string;
  parameters: any;
}
