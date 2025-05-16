import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { Quote, cn } from "@/lib/utils";
import { Bookmark, Star, Share2, Users, Heart } from "lucide-react";

interface GlobalQuoteScreenProps {
  userId: number;
}

const GlobalQuoteScreen: React.FC<GlobalQuoteScreenProps> = ({ userId }) => {
  const queryClient = useQueryClient();

  const { data: quote, isLoading } = useQuery<Quote>({
    queryKey: ["/api/quotes/daily"],
  });

  const { data: userQuotes } = useQuery({
    queryKey: [`/api/users/${userId}/quotes`],
  });

  const saveQuoteMutation = useMutation({
    mutationFn: async () => {
      if (!quote) return null;
      const res = await apiRequest("POST", `/api/users/${userId}/quotes`, {
        quoteId: quote.id,
        isFavorite: false,
        isMemorized: false,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/quotes`] });
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (!quote) return null;
      const res = await apiRequest(
        "POST",
        `/api/users/${userId}/quotes/${quote.id}/favorite`,
        {}
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/quotes`] });
    },
  });

  const handleShare = () => {
    if (!quote) return;
    
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
  };

  const isSaved = Array.isArray(userQuotes) ? userQuotes.some((uq: any) => uq.quoteId === quote?.id) : false;
  const isFavorite = Array.isArray(userQuotes) ? userQuotes.some((uq: any) => uq.quoteId === quote?.id && uq.isFavorite) : false;

  if (isLoading) {
    return (
      <div className="flex flex-col h-full p-5 items-center justify-center">
        <p>Cargando cita global del día...</p>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="flex flex-col h-full p-5 items-center justify-center">
        <p>No se pudo cargar la cita global</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full max-w-lg mx-auto bg-gradient-to-br from-indigo-50 to-blue-50">
      {/* Minimal header as part of full-height layout */}
      <div className="absolute top-0 left-0 right-0 py-3 px-4 z-10">
        <div className="flex justify-center">
          <h1 className="text-base font-heading text-indigo-700 bg-white/80 px-3 py-1 rounded-full">Cita Global del Día</h1>
        </div>
      </div>

      {/* Quote container that takes full height and width */}
      <div className="flex flex-col items-center justify-center h-full w-full px-5">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 w-full max-w-sm mb-4">
          <p className="font-quote text-2xl leading-relaxed mb-6 text-gray-800">"{quote.text}"</p>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-quote text-lg text-gray-600">— {quote.author}</p>
              <span className="text-xs px-3 py-1 rounded-full inline-block mt-1 bg-indigo-100 text-indigo-800">
                Cita Global
              </span>
            </div>
            
            <div className="flex space-x-4">
              <button
                className="text-gray-600 hover:text-primary transition-colors"
                onClick={() => saveQuoteMutation.mutate()}
                disabled={saveQuoteMutation.isPending || isSaved}
              >
                <Bookmark className={cn(
                  "h-6 w-6", 
                  isSaved ? "fill-current text-primary" : ""
                )} />
              </button>
              
              <button
                className="text-gray-600 hover:text-primary transition-colors"
                onClick={handleShare}
              >
                <Share2 className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Daily Lesson - Simplified */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 w-full max-w-sm">
          <h2 className="text-base font-heading font-medium mb-2 text-indigo-700">Reflexión del día</h2>
          <p className="text-gray-700 text-sm mb-3">
            Tómate un momento hoy para reflexionar sobre una acción que puedas realizar 
            para cultivar felicidad genuina en tu vida.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-indigo-600">💡</span>
            <span className="text-sm text-indigo-600 font-medium">
              Practica la gratitud consciente
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalQuoteScreen;
