import { GoogleGenAI, GenerateContentResponse, FunctionDeclaration, Type } from "@google/genai";
import { Message, Ticket } from "../types";
import { ragService } from "./rag";
import { db } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

const SYSTEM_INSTRUCTION = `
You are Dominator Intelligence, a premium AI copilot for large IT services companies.
Your goal is to help employees by answering queries, retrieving relevant documents, and summarizing content.

CORE CAPABILITIES:
- Answer internal employee queries using the knowledge base.
- Retrieve and cite relevant documents (SOPs, documentation, wiki).
- Summarize complex information.
- Lookup and analyze IT support tickets.
- Escalate to a human expert when unsure or when a specific ticket needs manual intervention.

AGENTIC WORKFLOW (ReAct):
1. THOUGHT: Analyze the user's request and determine which tool(s) to use.
2. ACTION: Call the appropriate tool (searchDocuments, lookupTickets, summarize).
3. OBSERVATION: Review the tool's output.
4. REPEAT: If more information is needed, repeat steps 1-3.
5. FINAL RESPONSE: Provide a clear, accurate, and cited response to the user.

GUARDRAILS:
- Always cite your sources (e.g., [Source: Kubernetes Docs]).
- If you cannot find the answer in the knowledge base, state that you are unsure and offer to raise a support ticket.
- Avoid hallucinations. Only provide information found in the retrieved documents or ticket system.
- Be professional, helpful, and concise.

RESPONSE FORMAT:
You MUST respond in a valid JSON format with the following structure:
{
  "reasoning": "Your internal thought process and tool selection logic",
  "intent": "The detected intent (e.g., 'Document Search', 'Ticket Inquiry', 'General Question')",
  "response": "Your final, human-like response to the user (Markdown supported, include citations)",
  "ticketRaised": true/false (Set to true ONLY if you cannot resolve the query or if the user explicitly asks for escalation)
}
`;

const searchDocumentsTool: FunctionDeclaration = {
  name: "searchDocuments",
  description: "Search the enterprise knowledge base for SOPs, documentation, and wiki pages.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: "The search query to find relevant documents.",
      },
    },
    required: ["query"],
  },
};

const lookupTicketsTool: FunctionDeclaration = {
  name: "lookupTickets",
  description: "Lookup IT support tickets by customer ID or subject keywords.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      customerId: {
        type: Type.STRING,
        description: "Optional customer ID to filter tickets.",
      },
      keyword: {
        type: Type.STRING,
        description: "Optional keyword to search in ticket subjects.",
      },
    },
  },
};

const summarizeTool: FunctionDeclaration = {
  name: "summarize",
  description: "Summarize a long piece of text or a set of search results.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      text: {
        type: Type.STRING,
        description: "The text to summarize.",
      },
    },
    required: ["text"],
  },
};

export async function sendMessage(history: Message[], message: string) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing.");
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Initial call to the model to get the first thought/action
    let response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...history.map((m) => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.content }],
        })),
        { role: "user", parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ functionDeclarations: [searchDocumentsTool, lookupTicketsTool, summarizeTool] }],
        responseMimeType: "application/json",
      },
    });

    // Handle function calls (ReAct loop)
    let functionCalls = response.functionCalls;
    let toolOutputs: any[] = [];
    let allSearchResults: any[] = [];

    if (functionCalls) {
      for (const call of functionCalls) {
        let result: any;
        if (call.name === "searchDocuments") {
          const { query } = call.args as { query: string };
          const searchResults = await ragService.search(query);
          allSearchResults = [...allSearchResults, ...searchResults];
          result = searchResults.map(r => ({
            title: r.document.title,
            content: r.document.content,
            source: r.document.source,
            score: r.score
          }));
        } else if (call.name === "lookupTickets") {
          const { customerId, keyword } = call.args as { customerId?: string, keyword?: string };
          let q = collection(db, "tickets");
          const snapshot = await getDocs(q);
          result = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Ticket))
            .filter(t => {
              let match = true;
              if (customerId && t.customerId !== customerId) match = false;
              if (keyword && (!t.subject || !t.subject.toLowerCase().includes(keyword.toLowerCase()))) match = false;
              return match;
            });
        } else if (call.name === "summarize") {
          const { text } = call.args as { text: string };
          // For summarization, we can just pass it back to the model in the next turn
          result = { summaryRequested: true, textToSummarize: text };
        }

        toolOutputs.push({
          callId: call.id,
          output: result
        });
      }

      // Final call with tool outputs to get the human response
      response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          ...history.map((m) => ({
            role: m.role === "user" ? "user" : "model",
            parts: [{ text: m.content }],
          })),
          { role: "user", parts: [{ text: message }] },
          {
            role: "model",
            parts: response.candidates[0].content.parts
          },
          {
            role: "user",
            parts: toolOutputs.map(out => ({
              functionResponse: {
                name: functionCalls!.find(c => c.id === out.callId)!.name,
                response: { result: out.output },
                id: out.callId
              }
            }))
          }
        ],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
        },
      });
    }

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response from Gemini");
    }

    const data = JSON.parse(responseText);
    
    return {
      role: "model" as const,
      content: data.response || "I apologize, but I encountered an error processing your request.",
      reasoning: data.reasoning,
      intent: data.intent,
      ticketRaised: data.ticketRaised === true,
      sources: allSearchResults.length > 0 ? allSearchResults : undefined
    };
  } catch (error: any) {
    console.error("Chat API Error:", error);
    let errorMessage = error.message || "Unknown connection error";
    
    return {
      role: "model" as const,
      content: `I'm sorry, I'm having trouble connecting to my intelligence core. Error: ${errorMessage}.`,
      reasoning: "API Connection Failure",
      intent: "Error"
    };
  }
}
