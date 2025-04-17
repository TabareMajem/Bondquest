import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeGeminiAPI } from "./gemini";
import { initializeEmailTransporter } from "./services/emailService";
import session from "express-session";
import { nanoid } from "nanoid";
import MemoryStore from "memorystore";
import ConnectPgSimple from "connect-pg-simple";
import { pool } from "./db";

// Initialize Gemini API with environment variable if available
if (process.env.GEMINI_API_KEY) {
  try {
    initializeGeminiAPI(process.env.GEMINI_API_KEY);
  } catch (error) {
    console.error("Failed to initialize Gemini API:", error);
  }
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration
const MemoryStoreSession = MemoryStore(session);
const PgStore = ConnectPgSimple(session);

// Create a secure session secret if not provided
const SESSION_SECRET = process.env.SESSION_SECRET || nanoid(32);
console.log("Session initialized with secret");

// Configure session
app.use(session({
  store: process.env.NODE_ENV === 'production' 
    ? new PgStore({ 
        pool, 
        tableName: 'sessions',
        createTableIfMissing: true 
      }) 
    : new MemoryStoreSession({
        checkPeriod: 86400000 // Clear expired sessions every 24h
      }),
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    httpOnly: true,
    sameSite: 'lax'
  }
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize email transporter
  try {
    await initializeEmailTransporter();
    console.log("Email service initialized successfully");
  } catch (error) {
    console.error("Failed to initialize email service:", error);
  }
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Error:", err);
    
    // Check if it's a database connection error
    if (err.code && 
        (err.code === '57P01' || // terminating connection
         err.code === '08006' || // connection timeout
         err.code === '08001' || // unable to connect
         err.code === '08004')) { // rejected connection
      
      console.error("Database connection error detected. Attempting to recover...");
      
      // For database connection errors, we will try to reconnect on the next request
      res.status(503).json({ 
        message: "Service temporarily unavailable. Please try again in a few moments." 
      });
      return;
    }
    
    // For all other errors
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
