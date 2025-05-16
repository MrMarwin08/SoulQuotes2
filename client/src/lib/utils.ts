import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Quote = {
  id: number;
  text: string;
  author: string;
  category: string;
  backgroundImageUrl: string | null;
};

export type UserQuote = {
  id: number;
  userId: number;
  quoteId: number;
  isFavorite: boolean;
  isMemorized: boolean;
  savedAt: Date;
  quote: Quote;
};

export type User = {
  id: number;
  username: string;
  fullName?: string;
  profilePicture?: string;
  memberSince: Date;
  preferences?: {
    topics: string[];
    authors: string[];
    notificationTime: string;
    darkMode: boolean;
    language: string;
  };
};

export const defaultUser: User = {
  id: 1,
  username: "mariagarcia",
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
};

export const availableTopics = [
  "Motivación",
  "Filosofía",
  "Amor",
  "Religión",
  "Mindfulness",
  "Reflexión",
  "Superación",
  "Éxito"
];

export const availableAuthors = [
  "Platón",
  "Aristóteles",
  "Séneca",
  "Marco Aurelio",
  "Confucio",
  "Buda",
  "Cervantes",
  "Fernando Pessoa",
  "Nietzsche",
  "Baltasar Gracián"
];

export function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long"
  });
}

export function shareQuote(quote: Quote): void {
  if (navigator.share) {
    navigator
      .share({
        title: `Cita de ${quote.author}`,
        text: `"${quote.text}" — ${quote.author}`,
        url: window.location.href,
      })
      .catch((error) => console.log("Error sharing:", error));
  } else {
    // Fallback for browsers that don't support Web Share API
    const shareText = `"${quote.text}" — ${quote.author}`;
    navigator.clipboard.writeText(shareText).then(
      () => {
        alert("Cita copiada al portapapeles");
      },
      () => {
        alert("No se pudo copiar la cita");
      }
    );
  }
}
