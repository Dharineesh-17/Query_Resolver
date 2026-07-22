import { GoogleGenAI } from "@google/genai";
import { KnowledgeDocument, SearchResult } from "../types";
import { db } from "../firebase";
import { collection, getDocs, addDoc, query, where } from "firebase/firestore";

const EMBEDDING_MODEL = "gemini-embedding-2-preview";

export class RAGService {
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing");
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const result = await this.ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: [text],
    });
    return result.embeddings[0].values;
  }

  async addDocument(doc: Omit<KnowledgeDocument, "id" | "embedding">) {
    const embedding = await this.generateEmbedding(`${doc.title}\n${doc.content}`);
    const docRef = await addDoc(collection(db, "knowledge_base"), {
      ...doc,
      embedding,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async search(queryText: string, limit: number = 5): Promise<SearchResult[]> {
    const queryEmbedding = await this.generateEmbedding(queryText);
    const snapshot = await getDocs(collection(db, "knowledge_base"));
    
    const results: SearchResult[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data() as KnowledgeDocument;
      if (data.embedding) {
        const score = this.cosineSimilarity(queryEmbedding, data.embedding);
        results.push({ document: { ...data, id: doc.id }, score });
      }
    });

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async seedMockData() {
    const mockDocs: Omit<KnowledgeDocument, "id" | "embedding">[] = [
      {
        title: "Apache Kafka Introduction",
        content: "Apache Kafka is a distributed event store and stream-processing platform. It is an open-source system developed by the Apache Software Foundation written in Java and Scala.",
        source: "Apache Kafka Docs",
        category: "Documentation"
      },
      {
        title: "Kubernetes Basics",
        content: "Kubernetes is an open-source container-orchestration system for automating software deployment, scaling, and management. It was originally designed by Google.",
        source: "Kubernetes Docs",
        category: "Documentation"
      },
      {
        title: "SOP: IT Support Escalation",
        content: "When a ticket cannot be resolved by Level 1 support within 4 hours, it must be escalated to Level 2. Level 2 support has 24 hours to provide a resolution or escalate to Level 3.",
        source: "Internal SOP",
        category: "SOP"
      },
      {
        title: "Docker Containerization",
        content: "Docker is a set of platform as a service products that use OS-level virtualization to deliver software in packages called containers.",
        source: "Docker Docs",
        category: "Documentation"
      },
      {
        title: "Python Official Docs: Data Structures",
        content: "Python's data structures include lists, tuples, sets, and dictionaries. Lists are mutable sequences, while tuples are immutable. Sets are unordered collections of unique elements.",
        source: "Python Official Docs",
        category: "Documentation"
      },
      {
        title: "SOP: New Engineer Onboarding",
        content: "All new engineers must complete the security training within their first week. They should also be assigned a mentor from their team to help with environment setup and codebase walkthrough.",
        source: "Internal SOP",
        category: "SOP"
      },
      {
        title: "Wiki: Project Dominators Overview",
        content: "Project Dominators is our internal initiative to build a next-generation customer support platform using AI and multi-agent reasoning.",
        source: "Internal Wiki",
        category: "Wiki"
      },
      {
        title: "Sample IT Ticket: VPN Access Issue",
        content: "Customer CUST-005 reported that they cannot connect to the corporate VPN from their home network. Error: 'Authentication failed'. Resolution: Reset user password and updated MFA settings.",
        source: "Ticket System",
        category: "Ticket"
      }
    ];

    const existing = await getDocs(collection(db, "knowledge_base"));
    if (existing.empty) {
      console.log("Seeding mock knowledge base data...");
      for (const doc of mockDocs) {
        await this.addDocument(doc);
      }
    }
  }
}

export const ragService = new RAGService();
