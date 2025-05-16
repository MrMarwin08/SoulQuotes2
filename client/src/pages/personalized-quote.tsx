import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { Quote, defaultUser } from "@/lib/utils";
import { Bookmark, Brain, Share2, Clock } from "lucide-react";

interface PersonalizedQuoteScreenProps {
  userId: number;
}

const PersonalizedQuoteScreen: React.FC<PersonalizedQuoteScreenProps> = ({ userId }) => {
  const queryClient = useQueryClient();

  const { data: quote, isLoading } = useQuery<Quote>({
    queryKey: [`/api/quotes/personalized/${userId}`],
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

  const toggleMemorizedMutation = useMutation({
    mutationFn: async () => {
      if (!quote) return null;
      const res = await apiRequest(
        "POST",
        `/api/users/${userId}/quotes/${quote.id}/memorize`,
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
          title: `Cita personalizada de ${quote.author}`,
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

  // Generate a countdown time (22 hours from now)
  const getCountdownTime = () => {
    const now = new Date();
    const hours = 22 - now.getHours();
    const minutes = 59 - now.getMinutes();
    const seconds = 59 - now.getSeconds();
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const userQuote = quote 
    ? userQuotes?.find((uq: any) => uq.quoteId === quote.id) 
    : undefined;
  
  const isSaved = !!userQuote;
  const isMemorized = userQuote?.isMemorized || false;

  if (isLoading) {
    return (
      <div className="flex flex-col h-full p-5 items-center justify-center">
        <p>Cargando tu cita personalizada...</p>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="flex flex-col h-full p-5 items-center justify-center">
        <p>No se pudo cargar la cita personalizada</p>
      </div>
    );
  }

  // Find user's preferred topics for explanation
  const userTopics = defaultUser.preferences?.topics || [];
  const relevantTopic = userTopics.find(topic => 
    quote.category.toLowerCase().includes(topic.toLowerCase())
  ) || quote.category;

  return (
    <div className="flex flex-col h-full p-5">
      <h1 className="text-2xl font-heading font-bold mb-2">Tu Cita Personalizada</h1>
      <p className="text-sm text-gray-500 mb-6">Seleccionada especialmente para ti</p>
      
      {/* Personalized quote card with gradient background */}
      <div className="bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl p-6 mb-6 shadow-md">
        <div className="bg-white/90 rounded-lg p-5 shadow-sm">
          <p className="font-quote text-xl mb-3">"{quote.text}"</p>
          <p className="font-quote text-sm text-gray-600">— {quote.author}</p>
        </div>
      </div>
      
      {/* Why this was selected for you */}
      <div className="bg-gray-50 rounded-xl p-5 mb-6">
        <h2 className="text-lg font-medium mb-2">¿Por qué esta cita?</h2>
        <p className="text-gray-700 text-sm">
          Basado en tu interés en {relevantTopic.toLowerCase()}, creemos que esta reflexión 
          resonará contigo hoy.
        </p>
      </div>
      
      {/* Daily advice */}
      <div className="mb-6">
        <h2 className="text-lg font-medium mb-2">Consejo diario</h2>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex gap-3">
            <div className="text-primary text-xl">
              💡
            </div>
            <div>
              <p className="text-gray-800 mb-1">Práctica de mindfulness</p>
              <p className="text-sm text-gray-600">
                Dedica 5 minutos hoy a observar tu respiración sin juzgar, simplemente 
                notando cada inhalación y exhalación.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Interaction buttons */}
      <div className="flex justify-around mb-4">
        <button
          className="flex flex-col items-center"
          onClick={() => saveQuoteMutation.mutate()}
          disabled={saveQuoteMutation.isPending || isSaved}
        >
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-1">
            <Bookmark className={isSaved ? "text-primary fill-current" : "text-primary"} />
          </div>
          <span className="text-xs text-gray-600">Guardar</span>
        </button>
        
        <button
          className="flex flex-col items-center"
          onClick={() => toggleMemorizedMutation.mutate()}
          disabled={toggleMemorizedMutation.isPending}
        >
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-1">
            <Brain className={isMemorized ? "text-primary fill-current" : "text-primary"} />
          </div>
          <span className="text-xs text-gray-600">Memorizar</span>
        </button>
        
        <button
          className="flex flex-col items-center"
          onClick={handleShare}
        >
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-1">
            <Share2 className="text-primary" />
          </div>
          <span className="text-xs text-gray-600">Compartir</span>
        </button>
      </div>
      
      {/* Next quote countdown */}
      <div className="flex justify-center items-center text-sm text-gray-500">
        <Clock className="mr-2 h-4 w-4" />
        <span>Nueva cita personalizada en {getCountdownTime()}</span>
      </div>
    </div>
  );
};

export default PersonalizedQuoteScreen;
