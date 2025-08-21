import type { Express, RequestHandler } from "express";
import { storage } from "./storage-simple";

// Simple session middleware for demo purposes
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // For demo purposes, we'll create a simple auth system
  // In a real app, you'd use proper session management
  const userId = req.headers.authorization;
  
  console.log("Auth check - userId from header:", userId);
  console.log("Auth check - all headers:", req.headers);
  
  if (!userId) {
    console.log("Auth failed - no userId in header");
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const user = await storage.getUser(userId);
    console.log("Auth check - user found:", !!user);
    if (!user) {
      console.log("Auth failed - user not found");
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    (req as any).user = {
      ...user,
      claims: { sub: user.id } // Add claims.sub for compatibility with routes
    };
    console.log("Auth success - user:", user.id);
    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

// Login endpoint for demo purposes
export function setupAuth(app: Express) {
  app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password required" });
    }
    
    try {
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // In a real app, you'd create a proper session or JWT
      res.json({ 
        user: { 
          ...user, 
          password: undefined // Don't send password back
        },
        token: user.id // Simple token for demo
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post('/api/logout', (req, res) => {
    res.json({ message: "Logged out" });
  });
}