import { 
  users, quotes, userQuotes, 
  type User, type InsertUser, 
  type Quote, type InsertQuote,
  type UserQuote, type InsertUserQuote
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPreferences(id: number, preferences: User["preferences"]): Promise<User | undefined>;
  
  // Quote methods
  getQuote(id: number): Promise<Quote | undefined>;
  getAllQuotes(): Promise<Quote[]>;
  getQuotesByCategory(category: string): Promise<Quote[]>;
  createQuote(quote: InsertQuote): Promise<Quote>;
  getRandomQuote(): Promise<Quote | undefined>;
  getRandomQuoteByCategory(category: string): Promise<Quote | undefined>;
  getDailyGlobalQuote(): Promise<Quote | undefined>;
  getPersonalizedQuote(userId: number): Promise<Quote | undefined>;
  
  // UserQuote methods
  getUserQuotes(userId: number): Promise<(UserQuote & { quote: Quote })[]>;
  saveQuote(userQuote: InsertUserQuote): Promise<UserQuote>;
  toggleFavorite(userId: number, quoteId: number): Promise<UserQuote | undefined>;
  toggleMemorized(userId: number, quoteId: number): Promise<UserQuote | undefined>;
  getUserQuotesFiltered(userId: number, filter: 'all' | 'favorites' | 'memorized'): Promise<(UserQuote & { quote: Quote })[]>;
  
  // Setup methods
  initializeData(): Promise<void>;
}

// This will be used to store the daily global quote ID
let dailyGlobalQuoteId: number | null = null;

export class DatabaseStorage implements IStorage {
  constructor() {
    // Initialize the daily global quote ID
    this.setDailyGlobalQuote();
  }

  private async setDailyGlobalQuote() {
    // Check if we have any quotes
    const allQuotes = await db.select().from(quotes).limit(1);
    
    if (allQuotes.length > 0) {
      // Get a random quote
      const randomQuote = await db.select()
        .from(quotes)
        .orderBy(sql`RANDOM()`)
        .limit(1);
      
      if (randomQuote.length > 0) {
        dailyGlobalQuoteId = randomQuote[0].id;
      }
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Convert the object to a plain object before inserting
    const userToInsert = {
      username: insertUser.username,
      password: insertUser.password,
      fullName: insertUser.fullName || null,
      profilePicture: insertUser.profilePicture || null,
      preferences: insertUser.preferences || {
        topics: [],
        authors: [],
        notificationTime: "08:00",
        darkMode: false,
        language: "Español"
      }
    };
    
    const [user] = await db.insert(users).values(userToInsert).returning();
    return user;
  }

  async updateUserPreferences(id: number, preferences: User["preferences"]): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const mergedPreferences = {
      topics: [...(user.preferences?.topics || []), ...(preferences?.topics || [])],
      authors: [...(user.preferences?.authors || []), ...(preferences?.authors || [])],
      notificationTime: preferences?.notificationTime || user.preferences?.notificationTime || "08:00",
      darkMode: preferences?.darkMode !== undefined ? preferences.darkMode : (user.preferences?.darkMode || false),
      language: preferences?.language || user.preferences?.language || "Español"
    };
    
    const [updatedUser] = await db.update(users)
      .set({ preferences: mergedPreferences })
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }

  // Quote methods
  async getQuote(id: number): Promise<Quote | undefined> {
    const result = await db.select().from(quotes).where(eq(quotes.id, id)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  async getAllQuotes(): Promise<Quote[]> {
    return db.select().from(quotes);
  }

  async getQuotesByCategory(category: string): Promise<Quote[]> {
    return db.select().from(quotes).where(eq(quotes.category, category));
  }

  async createQuote(insertQuote: InsertQuote): Promise<Quote> {
    const [quote] = await db.insert(quotes).values(insertQuote).returning();
    return quote;
  }

  async getRandomQuote(): Promise<Quote | undefined> {
    const result = await db.select()
      .from(quotes)
      .orderBy(sql`RANDOM()`)
      .limit(1);
    
    return result.length > 0 ? result[0] : undefined;
  }

  async getRandomQuoteByCategory(category: string): Promise<Quote | undefined> {
    const result = await db.select()
      .from(quotes)
      .where(eq(quotes.category, category))
      .orderBy(sql`RANDOM()`)
      .limit(1);
    
    return result.length > 0 ? result[0] : undefined;
  }

  async getDailyGlobalQuote(): Promise<Quote | undefined> {
    // If we don't have a daily global quote ID, set one
    if (dailyGlobalQuoteId === null) {
      await this.setDailyGlobalQuote();
    }
    
    // If we still don't have a daily global quote ID, return a random quote
    if (dailyGlobalQuoteId === null) {
      return this.getRandomQuote();
    }
    
    return this.getQuote(dailyGlobalQuoteId);
  }

  async getPersonalizedQuote(userId: number): Promise<Quote | undefined> {
    const user = await this.getUser(userId);
    if (!user || !user.preferences?.topics || user.preferences.topics.length === 0) {
      return this.getRandomQuote();
    }
    
    // Get a random preferred category
    const preferredTopics = user.preferences.topics;
    const randomTopic = preferredTopics[Math.floor(Math.random() * preferredTopics.length)];
    
    // Try to get a quote from the preferred category
    const quote = await this.getRandomQuoteByCategory(randomTopic);
    
    // Fallback to any random quote if no quote in the preferred category
    return quote || this.getRandomQuote();
  }

  // UserQuote methods
  async getUserQuotes(userId: number): Promise<(UserQuote & { quote: Quote })[]> {
    const result = await db.select({
        userQuote: userQuotes,
        quote: quotes
      })
      .from(userQuotes)
      .leftJoin(quotes, eq(userQuotes.quoteId, quotes.id))
      .where(eq(userQuotes.userId, userId));
    
    // Filter out any results where quote is null and cast the types properly
    return result
      .filter(item => item.quote !== null)
      .map(item => ({
        ...item.userQuote,
        quote: item.quote as Quote
      }));
  }

  async saveQuote(insertUserQuote: InsertUserQuote): Promise<UserQuote> {
    // Check if this quote is already saved by the user
    const existingUserQuote = await db.select()
      .from(userQuotes)
      .where(
        and(
          eq(userQuotes.userId, insertUserQuote.userId),
          eq(userQuotes.quoteId, insertUserQuote.quoteId)
        )
      )
      .limit(1);
    
    if (existingUserQuote.length > 0) {
      // Update the existing entry
      const [updatedUserQuote] = await db.update(userQuotes)
        .set({
          isFavorite: insertUserQuote.isFavorite ?? existingUserQuote[0].isFavorite,
          isMemorized: insertUserQuote.isMemorized ?? existingUserQuote[0].isMemorized
        })
        .where(eq(userQuotes.id, existingUserQuote[0].id))
        .returning();
      
      return updatedUserQuote;
    } else {
      // Create a new entry
      const [newUserQuote] = await db.insert(userQuotes)
        .values({
          ...insertUserQuote,
          savedAt: new Date()
        })
        .returning();
      
      return newUserQuote;
    }
  }

  async toggleFavorite(userId: number, quoteId: number): Promise<UserQuote | undefined> {
    // Find the user quote
    const existingUserQuote = await db.select()
      .from(userQuotes)
      .where(
        and(
          eq(userQuotes.userId, userId),
          eq(userQuotes.quoteId, quoteId)
        )
      )
      .limit(1);
    
    if (existingUserQuote.length === 0) {
      // If not found, create a new one with favorite set to true
      return this.saveQuote({
        userId,
        quoteId,
        isFavorite: true,
        isMemorized: false
      });
    }
    
    // Toggle the favorite status
    const [updatedUserQuote] = await db.update(userQuotes)
      .set({
        isFavorite: !existingUserQuote[0].isFavorite
      })
      .where(eq(userQuotes.id, existingUserQuote[0].id))
      .returning();
    
    return updatedUserQuote;
  }

  async toggleMemorized(userId: number, quoteId: number): Promise<UserQuote | undefined> {
    // Find the user quote
    const existingUserQuote = await db.select()
      .from(userQuotes)
      .where(
        and(
          eq(userQuotes.userId, userId),
          eq(userQuotes.quoteId, quoteId)
        )
      )
      .limit(1);
    
    if (existingUserQuote.length === 0) {
      // If not found, create a new one with memorized set to true
      return this.saveQuote({
        userId,
        quoteId,
        isFavorite: false,
        isMemorized: true
      });
    }
    
    // Toggle the memorized status
    const [updatedUserQuote] = await db.update(userQuotes)
      .set({
        isMemorized: !existingUserQuote[0].isMemorized
      })
      .where(eq(userQuotes.id, existingUserQuote[0].id))
      .returning();
    
    return updatedUserQuote;
  }

  async getUserQuotesFiltered(userId: number, filter: 'all' | 'favorites' | 'memorized'): Promise<(UserQuote & { quote: Quote })[]> {
    // Build the base query
    let baseQuery = db.select({
        userQuote: userQuotes,
        quote: quotes
      })
      .from(userQuotes)
      .leftJoin(quotes, eq(userQuotes.quoteId, quotes.id))
      .where(eq(userQuotes.userId, userId));
    
    // Get all results first
    const allResults = await baseQuery;
    
    // Then filter in memory based on the filter type
    let filteredResults;
    if (filter === 'favorites') {
      filteredResults = allResults.filter(item => item.userQuote.isFavorite === true);
    } else if (filter === 'memorized') {
      filteredResults = allResults.filter(item => item.userQuote.isMemorized === true);
    } else {
      filteredResults = allResults;
    }
    
    // Filter out any results where quote is null and cast the types properly
    return filteredResults
      .filter(item => item.quote !== null)
      .map(item => ({
        ...item.userQuote,
        quote: item.quote as Quote
      }));
  }

  // Initialize data
  async initializeData(): Promise<void> {
    // Check if we already have quotes
    const existingQuotes = await db.select().from(quotes).limit(1);
    
    if (existingQuotes.length === 0) {
      // Add sample quotes
      const sampleQuotes: InsertQuote[] = [
        {
          text: "La vida es lo que hacemos de ella. Los viajes son los viajeros. Lo que vemos no es lo que vemos, sino lo que somos.",
          author: "Fernando Pessoa",
          category: "Filosofía",
          backgroundImageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?ixlib=rb-4.0.3&auto=format&fit=crop"
        },
        {
          text: "No hay viento favorable para el que no sabe a dónde va.",
          author: "Séneca",
          category: "Motivación",
          backgroundImageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop"
        },
        {
          text: "La felicidad de tu vida depende de la calidad de tus pensamientos.",
          author: "Marco Aurelio",
          category: "Reflexión",
          backgroundImageUrl: "https://images.unsplash.com/photo-1517960413843-0aee8e2b3285?ixlib=rb-4.0.3&auto=format&fit=crop"
        },
        {
          text: "Nunca sabes lo fuerte que eres, hasta que ser fuerte es la única opción que te queda.",
          author: "Bob Marley",
          category: "Motivación",
          backgroundImageUrl: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?ixlib=rb-4.0.3&auto=format&fit=crop"
        },
        {
          text: "La vida es realmente simple, pero insistimos en hacerla complicada.",
          author: "Confucio",
          category: "Filosofía",
          backgroundImageUrl: null
        },
        {
          text: "El verdadero viaje de descubrimiento no consiste en buscar nuevos territorios, sino en tener nuevos ojos.",
          author: "Marcel Proust",
          category: "Reflexión",
          backgroundImageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop"
        },
        {
          text: "El secreto de salir adelante es comenzar.",
          author: "Mark Twain",
          category: "Motivación",
          backgroundImageUrl: null
        },
        {
          text: "La felicidad no es algo prefabricado. Viene de tus propias acciones.",
          author: "Dalai Lama",
          category: "Reflexión",
          backgroundImageUrl: "https://pixabay.com/get/gf9b201fa108ca8db3a70aec9091838460de66dbf8990c121aa953f6ea8245fa81545a081dcc027b628fba5b1256f8a5d53c94d2954e38de39cd1d4137dec575e_1280.jpg"
        },
        {
          text: "No te quedes en el pasado, no sueñes con el futuro, concentra la mente en el momento presente.",
          author: "Buda",
          category: "Mindfulness",
          backgroundImageUrl: null
        }
      ];
      
      // Insert all quotes
      await db.insert(quotes).values(sampleQuotes);
    }
    
    // Check if we have a default user
    const existingUser = await db.select().from(users).where(eq(users.id, 1)).limit(1);
    
    if (existingUser.length === 0) {
      // Create the default user
      await db.insert(users).values({
        id: 1,
        username: "mariagarcia",
        password: "password123", // In a real app, this would be hashed
        fullName: "María García",
        profilePicture: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
        memberSince: new Date(2023, 9, 1), // October 2023
        preferences: {
          topics: ["Motivación", "Filosofía", "Mindfulness"],
          authors: ["Buda", "Séneca", "Cervantes"],
          notificationTime: "08:00",
          darkMode: false,
          language: "Español"
        }
      });
      
      console.log("Default user created");
    }
    
    // Set the daily global quote
    await this.setDailyGlobalQuote();
  }
}

export const storage = new DatabaseStorage();
