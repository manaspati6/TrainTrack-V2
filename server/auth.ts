import type { Express, RequestHandler } from "express";
import { storage } from "./storage-simple";

// Simple session middleware for demo purposes
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // For demo purposes, we'll create a simple auth system
  // In a real app, you'd use proper session management
  const userId = req.headers.authorization;
  
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    (req as any).user = user;
    next();
  } catch (error) {
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