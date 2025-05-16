import { 
  users, quotes, userQuotes, 
  type User, type InsertUser, 
  type Quote, type InsertQuote,
  type UserQuote, type InsertUserQuote
} from "@shared/schema";

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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private quotes: Map<number, Quote>;
  private userQuotes: Map<number, UserQuote>;
  private currentUserId: number;
  private currentQuoteId: number;
  private currentUserQuoteId: number;
  private dailyGlobalQuoteId: number;

  constructor() {
    this.users = new Map();
    this.quotes = new Map();
    this.userQuotes = new Map();
    this.currentUserId = 1;
    this.currentQuoteId = 1;
    this.currentUserQuoteId = 1;
    
    // Initialize with sample quotes
    this.initializeQuotes();
    
    // Set a random quote as the daily global quote
    this.setDailyGlobalQuote();
  }

  private initializeQuotes() {
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

    sampleQuotes.forEach(quote => {
      this.createQuote(quote);
    });
  }

  private setDailyGlobalQuote() {
    const quotesArray = Array.from(this.quotes.values());
    if (quotesArray.length > 0) {
      // Select a random quote as the daily global quote
      const randomIndex = Math.floor(Math.random() * quotesArray.length);
      this.dailyGlobalQuoteId = quotesArray[randomIndex].id;
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      memberSince: insertUser.memberSince || new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserPreferences(id: number, preferences: User["preferences"]): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = {
      ...user,
      preferences: {
        ...user.preferences,
        ...preferences
      }
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Quote methods
  async getQuote(id: number): Promise<Quote | undefined> {
    return this.quotes.get(id);
  }

  async getAllQuotes(): Promise<Quote[]> {
    return Array.from(this.quotes.values());
  }

  async getQuotesByCategory(category: string): Promise<Quote[]> {
    return Array.from(this.quotes.values()).filter(
      (quote) => quote.category === category
    );
  }

  async createQuote(insertQuote: InsertQuote): Promise<Quote> {
    const id = this.currentQuoteId++;
    const quote: Quote = { ...insertQuote, id };
    this.quotes.set(id, quote);
    return quote;
  }

  async getRandomQuote(): Promise<Quote | undefined> {
    const quotes = Array.from(this.quotes.values());
    if (quotes.length === 0) return undefined;
    
    const randomIndex = Math.floor(Math.random() * quotes.length);
    return quotes[randomIndex];
  }

  async getRandomQuoteByCategory(category: string): Promise<Quote | undefined> {
    const quotesInCategory = await this.getQuotesByCategory(category);
    if (quotesInCategory.length === 0) return undefined;
    
    const randomIndex = Math.floor(Math.random() * quotesInCategory.length);
    return quotesInCategory[randomIndex];
  }

  async getDailyGlobalQuote(): Promise<Quote | undefined> {
    return this.quotes.get(this.dailyGlobalQuoteId);
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
    const userQuotesArray = Array.from(this.userQuotes.values()).filter(
      (userQuote) => userQuote.userId === userId
    );
    
    return userQuotesArray.map(userQuote => {
      const quote = this.quotes.get(userQuote.quoteId)!;
      return { ...userQuote, quote };
    });
  }

  async saveQuote(insertUserQuote: InsertUserQuote): Promise<UserQuote> {
    // Check if this quote is already saved by the user
    const existingUserQuote = Array.from(this.userQuotes.values()).find(
      (uq) => uq.userId === insertUserQuote.userId && uq.quoteId === insertUserQuote.quoteId
    );
    
    if (existingUserQuote) {
      // Update the existing entry
      const updatedUserQuote = {
        ...existingUserQuote,
        isFavorite: insertUserQuote.isFavorite ?? existingUserQuote.isFavorite,
        isMemorized: insertUserQuote.isMemorized ?? existingUserQuote.isMemorized
      };
      this.userQuotes.set(existingUserQuote.id, updatedUserQuote);
      return updatedUserQuote;
    } else {
      // Create a new entry
      const id = this.currentUserQuoteId++;
      const userQuote: UserQuote = { 
        ...insertUserQuote, 
        id,
        savedAt: new Date()
      };
      this.userQuotes.set(id, userQuote);
      return userQuote;
    }
  }

  async toggleFavorite(userId: number, quoteId: number): Promise<UserQuote | undefined> {
    // Find the user quote
    const userQuote = Array.from(this.userQuotes.values()).find(
      (uq) => uq.userId === userId && uq.quoteId === quoteId
    );
    
    if (!userQuote) {
      // If not found, create a new one with favorite set to true
      return this.saveQuote({
        userId,
        quoteId,
        isFavorite: true,
        isMemorized: false
      });
    }
    
    // Toggle the favorite status
    const updatedUserQuote = {
      ...userQuote,
      isFavorite: !userQuote.isFavorite
    };
    this.userQuotes.set(userQuote.id, updatedUserQuote);
    return updatedUserQuote;
  }

  async toggleMemorized(userId: number, quoteId: number): Promise<UserQuote | undefined> {
    // Find the user quote
    const userQuote = Array.from(this.userQuotes.values()).find(
      (uq) => uq.userId === userId && uq.quoteId === quoteId
    );
    
    if (!userQuote) {
      // If not found, create a new one with memorized set to true
      return this.saveQuote({
        userId,
        quoteId,
        isFavorite: false,
        isMemorized: true
      });
    }
    
    // Toggle the memorized status
    const updatedUserQuote = {
      ...userQuote,
      isMemorized: !userQuote.isMemorized
    };
    this.userQuotes.set(userQuote.id, updatedUserQuote);
    return updatedUserQuote;
  }

  async getUserQuotesFiltered(userId: number, filter: 'all' | 'favorites' | 'memorized'): Promise<(UserQuote & { quote: Quote })[]> {
    const userQuotes = await this.getUserQuotes(userId);
    
    if (filter === 'all') {
      return userQuotes;
    } else if (filter === 'favorites') {
      return userQuotes.filter(uq => uq.isFavorite);
    } else if (filter === 'memorized') {
      return userQuotes.filter(uq => uq.isMemorized);
    }
    
    return userQuotes;
  }
}

export const storage = new MemStorage();
