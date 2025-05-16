import React, { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Quote, shareQuote } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Bookmark, Star, Share2, Brain } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface DailyQuotesScreenProps {
  userId: number;
}

const DailyQuotesScreen: React.FC<DailyQuotesScreenProps> = ({ userId }) => {
  const queryClient = useQueryClient();
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);

  const { data: quotes, isLoading } = useQuery<Quote[]>({
    queryKey: ["/api/quotes"],
  });

  const { data: userQuotes } = useQuery({
    queryKey: [`/api/users/${userId}/quotes`],
  });

  const saveQuoteMutation = useMutation({
    mutationFn: async (quoteId: number) => {
      const res = await apiRequest("POST", `/api/users/${userId}/quotes`, {
        quoteId,
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
    mutationFn: async (quoteId: number) => {
      const res = await apiRequest(
        "POST",
        `/api/users/${userId}/quotes/${quoteId}/favorite`,
        {}
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/quotes`] });
    },
  });

  const toggleMemorizedMutation = useMutation({
    mutationFn: async (quoteId: number) => {
      const res = await apiRequest(
        "POST",
        `/api/users/${userId}/quotes/${quoteId}/memorize`,
        {}
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/quotes`] });
    },
  });

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    setIsSwiping(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY.current === null) return;
    
    const currentY = e.touches[0].clientY;
    const diffY = startY.current - currentY;
    
    // Only set swiping if there's a significant move
    if (Math.abs(diffY) > 10) {
      setIsSwiping(true);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (startY.current === null || !isSwiping) return;
    
    const currentY = e.changedTouches[0].clientY;
    const diffY = startY.current - currentY;
    
    if (diffY > 50 && quotes) {  // Swipe up
      // Go to next quote
      setCurrentQuoteIndex((prevIndex) => 
        prevIndex + 1 >= quotes.length ? 0 : prevIndex + 1
      );
    } else if (diffY < -50 && quotes) {  // Swipe down
      // Go to previous quote
      setCurrentQuoteIndex((prevIndex) => 
        prevIndex - 1 < 0 ? quotes.length - 1 : prevIndex - 1
      );
    }
    
    startY.current = null;
    setIsSwiping(false);
  };

  const getCategoryColor = (category: string) => {
    const categoryColors: Record<string, string> = {
      Motivación: "bg-yellow-100 text-yellow-800",
      Filosofía: "bg-blue-100 text-blue-800",
      Reflexión: "bg-green-100 text-green-800",
      Mindfulness: "bg-purple-100 text-purple-800",
      Amor: "bg-pink-100 text-pink-800",
      Religión: "bg-indigo-100 text-indigo-800",
      Superación: "bg-orange-100 text-orange-800",
      Éxito: "bg-teal-100 text-teal-800",
    };

    return categoryColors[category] || "bg-primary/10 text-primary";
  };

  // Check loading and empty states
  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <p className="text-lg">Cargando citas...</p>
      </div>
    );
  }

  if (!quotes || quotes.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <p className="text-lg">No hay citas disponibles</p>
      </div>
    );
  }

  // Get current quote and its saved status
  const currentQuote = quotes[currentQuoteIndex];
  const userQuote = Array.isArray(userQuotes) 
    ? userQuotes.find((uq: any) => uq.quoteId === currentQuote.id)
    : undefined;
  const isSaved = !!userQuote;
  const isFavorite = userQuote?.isFavorite || false;
  const isMemorized = userQuote?.isMemorized || false;

  return (
    <div className="flex flex-col h-full">
      {/* Small header */}
      <div className="p-4">
        <h1 className="text-2xl font-heading font-bold">Citas del Día</h1>
      </div>
      
      {/* Full height quote container */}
      <div 
        ref={containerRef} 
        className="flex-1 overflow-hidden touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="h-full flex flex-col relative">
          {/* Quote background */}
          {currentQuote.backgroundImageUrl && (
            <div className="absolute inset-0 z-0">
              <img 
                src={currentQuote.backgroundImageUrl} 
                alt="" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
            </div>
          )}
          
          {/* Quote content */}
          <div className={cn(
            "flex-1 flex flex-col justify-center items-center px-6 z-10",
            currentQuote.backgroundImageUrl ? "text-white" : "text-foreground"
          )}>
            <div className="max-w-md text-center">
              <p className="font-quote text-2xl leading-relaxed mb-4">"{currentQuote.text}"</p>
              <p className="font-quote text-lg opacity-90 mb-3">— {currentQuote.author}</p>
              <span className={cn(
                "text-xs px-3 py-1 rounded-full inline-block", 
                currentQuote.backgroundImageUrl 
                  ? "bg-white/20 text-white" 
                  : getCategoryColor(currentQuote.category)
              )}>
                {currentQuote.category}
              </span>
            </div>
          </div>
          
          {/* Interaction buttons */}
          <div className={cn(
            "pb-6 pt-4 flex justify-center gap-8 z-10",
            currentQuote.backgroundImageUrl ? "text-white" : "text-foreground"
          )}>
            <button
              className="flex flex-col items-center"
              onClick={() => {
                if (!isSaved) {
                  saveQuoteMutation.mutate(currentQuote.id);
                }
              }}
              disabled={saveQuoteMutation.isPending || isSaved}
            >
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center mb-1",
                currentQuote.backgroundImageUrl ? "bg-white/10" : "bg-gray-100"
              )}>
                <Bookmark className={cn(
                  "h-6 w-6", 
                  isSaved ? "fill-current" : "",
                  currentQuote.backgroundImageUrl ? "text-white" : "text-gray-600"
                )} />
              </div>
              <span className="text-xs opacity-90">Guardar</span>
            </button>
            
            <button
              className="flex flex-col items-center"
              onClick={() => toggleFavoriteMutation.mutate(currentQuote.id)}
              disabled={toggleFavoriteMutation.isPending}
            >
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center mb-1",
                currentQuote.backgroundImageUrl ? "bg-white/10" : "bg-gray-100"
              )}>
                <Star className={cn(
                  "h-6 w-6",
                  isFavorite ? "fill-current text-yellow-500" : currentQuote.backgroundImageUrl ? "text-white" : "text-gray-600"
                )} />
              </div>
              <span className="text-xs opacity-90">Favorito</span>
            </button>
            
            <button
              className="flex flex-col items-center"
              onClick={() => toggleMemorizedMutation.mutate(currentQuote.id)}
              disabled={toggleMemorizedMutation.isPending}
            >
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center mb-1",
                currentQuote.backgroundImageUrl ? "bg-white/10" : "bg-gray-100"
              )}>
                <Brain className={cn(
                  "h-6 w-6",
                  isMemorized ? "fill-current" : "",
                  currentQuote.backgroundImageUrl ? "text-white" : "text-gray-600"
                )} />
              </div>
              <span className="text-xs opacity-90">Memorizar</span>
            </button>
            
            <button
              className="flex flex-col items-center"
              onClick={() => shareQuote(currentQuote)}
            >
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center mb-1",
                currentQuote.backgroundImageUrl ? "bg-white/10" : "bg-gray-100"
              )}>
                <Share2 className={cn(
                  "h-6 w-6",
                  currentQuote.backgroundImageUrl ? "text-white" : "text-gray-600"
                )} />
              </div>
              <span className="text-xs opacity-90">Compartir</span>
            </button>
          </div>
          
          {/* Swipe indicators */}
          <div className="absolute bottom-1 left-0 right-0 flex justify-center pb-1 opacity-70 z-20">
            <div className="text-center text-xs">
              {currentQuote.backgroundImageUrl ? (
                <p className="text-white">Desliza para ver más citas</p>
              ) : (
                <p className="text-gray-500">Desliza para ver más citas</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyQuotesScreen;
