import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertQuoteSchema, insertUserQuoteSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // User routes
  app.get("/api/users/:id", async (req, res) => {
    const user = await storage.getUser(Number(req.params.id));
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  });

  app.post("/api/users", async (req, res) => {
    try {
      const validatedUser = insertUserSchema.parse(req.body);
      const user = await storage.createUser(validatedUser);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/users/:id/preferences", async (req, res) => {
    const userId = Number(req.params.id);
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const updatedUser = await storage.updateUserPreferences(userId, req.body);
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Quote routes
  app.get("/api/quotes", async (req, res) => {
    const { category } = req.query;
    let quotes;
    
    if (category) {
      quotes = await storage.getQuotesByCategory(category as string);
    } else {
      quotes = await storage.getAllQuotes();
    }
    
    res.json(quotes);
  });

  app.get("/api/quotes/random", async (req, res) => {
    const { category } = req.query;
    let quote;
    
    if (category) {
      quote = await storage.getRandomQuoteByCategory(category as string);
    } else {
      quote = await storage.getRandomQuote();
    }
    
    if (!quote) {
      return res.status(404).json({ message: "No quotes found" });
    }
    
    res.json(quote);
  });

  app.get("/api/quotes/daily", async (req, res) => {
    const quote = await storage.getDailyGlobalQuote();
    if (!quote) {
      return res.status(404).json({ message: "Daily quote not found" });
    }
    res.json(quote);
  });

  app.get("/api/quotes/personalized/:userId", async (req, res) => {
    const userId = Number(req.params.userId);
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const quote = await storage.getPersonalizedQuote(userId);
    if (!quote) {
      return res.status(404).json({ message: "No personalized quote found" });
    }
    
    res.json(quote);
  });

  // UserQuote routes
  app.get("/api/users/:id/quotes", async (req, res) => {
    const userId = Number(req.params.id);
    const filter = req.query.filter as 'all' | 'favorites' | 'memorized' || 'all';
    
    const userQuotes = await storage.getUserQuotesFiltered(userId, filter);
    res.json(userQuotes);
  });

  app.post("/api/users/:id/quotes", async (req, res) => {
    const userId = Number(req.params.id);
    
    try {
      const validatedUserQuote = insertUserQuoteSchema.parse({
        ...req.body,
        userId
      });
      
      const userQuote = await storage.saveQuote(validatedUserQuote);
      res.status(201).json(userQuote);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/users/:userId/quotes/:quoteId/favorite", async (req, res) => {
    const userId = Number(req.params.userId);
    const quoteId = Number(req.params.quoteId);
    
    const userQuote = await storage.toggleFavorite(userId, quoteId);
    res.json(userQuote);
  });

  app.post("/api/users/:userId/quotes/:quoteId/memorize", async (req, res) => {
    const userId = Number(req.params.userId);
    const quoteId = Number(req.params.quoteId);
    
    const userQuote = await storage.toggleMemorized(userId, quoteId);
    res.json(userQuote);
  });

  const httpServer = createServer(app);
  return httpServer;
}
