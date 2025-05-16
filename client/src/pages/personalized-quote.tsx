import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { Quote, defaultUser, cn } from "@/lib/utils";
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
  const relevantTopic = Array.isArray(userTopics) ? 
    userTopics.find(topic => 
      quote.category.toLowerCase().includes(topic.toLowerCase())
    ) || quote.category 
    : quote.category;

  return (
    <div className="flex flex-col h-[100vh] w-full bg-gradient-to-br from-purple-50 to-pink-50 overflow-hidden">
      {/* Minimal header as part of full-height layout */}
      <div className="fixed top-0 left-0 right-0 py-3 z-10 pointer-events-none">
        <div className="flex justify-center">
          <h1 className="text-sm font-heading text-purple-700 bg-white/80 px-3 py-1 rounded-full shadow-sm pointer-events-auto">
            Tu Cita Personalizada
          </h1>
        </div>
      </div>

      {/* Quote container that takes full height and width */}
      <div className="flex flex-col items-center justify-center h-full w-full px-5 gap-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md p-6 w-full">
          <p className="font-quote text-2xl leading-relaxed mb-6 text-gray-800">"{quote.text}"</p>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-quote text-lg text-gray-600">— {quote.author}</p>
              <span className="text-xs px-2 py-1 rounded-full inline-block mt-1 bg-purple-100 text-purple-800">
                Para ti
              </span>
            </div>
            
            <div className="flex space-x-4">
              <button
                className="text-gray-600 hover:text-primary transition-colors"
                onClick={() => saveQuoteMutation.mutate()}
                disabled={saveQuoteMutation.isPending || isSaved}
              >
                <Bookmark className={cn(
                  "h-5 w-5", 
                  isSaved ? "fill-current text-primary" : ""
                )} />
              </button>
              
              <button
                className="text-gray-600 hover:text-primary transition-colors"
                onClick={handleShare}
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Why this was selected for you - Simplified */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md p-5 w-full">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-purple-600 text-sm">
              ✨
            </div>
            <h2 className="text-sm font-medium text-purple-700">¿Por qué esta cita?</h2>
          </div>
          <p className="text-gray-700 text-sm mb-3">
            Basado en tu interés en {relevantTopic.toLowerCase()}, creemos que esta reflexión 
            resonará contigo hoy.
          </p>
          
          {/* Simple countdown */}
          <div className="flex justify-end items-center text-xs text-gray-500 mt-2">
            <Clock className="mr-1 h-3 w-3" />
            <span>Nueva cita en {getCountdownTime()}</span>
          </div>
        </div>
      </div>
      
      {/* Small indicator for swiping */}
      <div className="fixed bottom-4 left-0 right-0 flex justify-center">
        <div className="flex space-x-2">
          <div className="w-1 h-1 rounded-full bg-gray-300"></div>
          <div className="w-1 h-1 rounded-full bg-gray-300"></div>
          <div className="w-1 h-1 rounded-full bg-gray-300"></div>
          <div className="w-1 h-1 rounded-full bg-gray-600"></div>
          <div className="w-1 h-1 rounded-full bg-gray-300"></div>
        </div>
      </div>
    </div>
  );
};

export default PersonalizedQuoteScreen;
