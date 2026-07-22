import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config({ override: true });

// Initialize Resend on the server
let resendClient: Resend | null = null;

function getResend() {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(key);
  }
  return resendClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get("/api/config-status", (req, res) => {
    res.json({ 
      isResendConfigured: !!getResend(),
      isMockMode: process.env.MOCK_EMAIL === "true",
      fromEmail: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      serverTime: new Date().toISOString()
    });
  });

  // API Route for sending real emails via Resend
  app.post("/api/send-email", async (req, res) => {
    const { to, subject, html } = req.body;
    const resend = getResend();
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const isMockMode = process.env.MOCK_EMAIL === "true";

    if (isMockMode) {
      console.log(`[MOCK MODE] Simulating email success to: "${to}"`);
      return res.json({ success: true, simulated: true, data: { id: "mock_id_" + Date.now() } });
    }
    // Robust fromEmail logic with format validation
    const rawFromEmail = process.env.RESEND_FROM_EMAIL?.trim();
    const FROM_EMAIL_REGEX = /^([^<]+ <[^>]+>|[^@]+@[^@]+)$/;
    
    let fromEmail = "onboarding@resend.dev"; // Simplest safe default
    
    if (rawFromEmail && FROM_EMAIL_REGEX.test(rawFromEmail)) {
      fromEmail = rawFromEmail;
    } else if (rawFromEmail) {
      console.warn(`Invalid RESEND_FROM_EMAIL format: "${rawFromEmail}". Falling back to default.`);
    }

    console.log(`Attempting to send email from: "${fromEmail}" to: "${to}"`);

    if (!to || !subject || !html) {
      return res.status(400).json({ error: "Missing required fields: to, subject, or html." });
    }

    const EMAIL_REGEX = /^[^@]+@[^@]+$/;
    if (!EMAIL_REGEX.test(to)) {
      return res.status(400).json({ error: `Invalid recipient email format: "${to}". Please provide a valid email address.` });
    }

    if (!resend) {
      const similarKeys = Object.keys(process.env).filter(k => k.toUpperCase().includes("RESEND"));
      return res.status(500).json({ 
        error: `RESEND_API_KEY is missing. Found similar keys: [${similarKeys.join(", ") || "None"}]. Please ensure the secret is named exactly RESEND_API_KEY in the AI Studio Settings (Gear icon) > Secrets panel and that you clicked 'Save'.` 
      });
    }

    try {
      const finalHtml = `
        ${html}
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999;">
          <p>This is an automated notification from <a href="${appUrl}" style="color: #f97316;">Dominators Support</a>.</p>
        </div>
      `;

      console.log(`[EMAIL] Attempting to send from: "${fromEmail}" to: "${to}"`);
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: [to],
        subject: subject,
        html: finalHtml,
      });

      if (error) {
        console.error("[EMAIL ERROR] Resend error details:", JSON.stringify(error, null, 2));
        // Provide more specific feedback based on common Resend error names
        let userMessage = error.message || "Failed to send email via Resend";
        if (error.name === "validation_error") {
          userMessage = `Validation Error: ${error.message}`;
          if (error.message.toLowerCase().includes("from")) {
            userMessage += ". Ensure your RESEND_FROM_EMAIL secret is in 'Name <email@example.com>' or 'email@example.com' format. If you are on a trial account, it MUST be 'onboarding@resend.dev'.";
          } else {
            userMessage += ". Check if the recipient email is valid.";
          }
        } else if (error.name === "rate_limit_exceeded") {
          userMessage = "Rate limit exceeded. Please try again later.";
        } else if (error.name === "missing_api_key") {
          userMessage = "The Resend API key is invalid or missing.";
        }
        
        if (error.message.toLowerCase().includes("verified") || error.message.toLowerCase().includes("domain") || error.message.toLowerCase().includes("single recipient")) {
          userMessage = `Email Sending Error: You can only send testing emails to your own email address (dharineeshvengatesan@gmail.com). To send emails to other recipients, please verify a domain at resend.com/domains, and change the 'from' address to an email using this domain.. Note: Resend trial accounts can only send from 'onboarding@resend.dev' to their own account email. Please check your Resend dashboard settings.`;
        }
        
        return res.status(400).json({ error: userMessage, details: error });
      }

      console.log("[EMAIL SUCCESS] Resend response:", JSON.stringify(data, null, 2));
      res.json({ success: true, data });
    } catch (err: any) {
      console.error("Unexpected Resend error:", err);
      res.status(500).json({ 
        error: "An unexpected error occurred while sending the email.",
        message: err.message || "Internal server error"
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
