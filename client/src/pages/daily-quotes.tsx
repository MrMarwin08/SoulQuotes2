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

  // Handle touch events for mobile
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
  
  // Handle mouse events for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    startY.current = e.clientY;
    setIsSwiping(false);
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (startY.current === null) return;
    
    const currentY = e.clientY;
    const diffY = startY.current - currentY;
    
    // Only set swiping if there's a significant move
    if (Math.abs(diffY) > 10) {
      setIsSwiping(true);
    }
  };
  
  const handleMouseUp = (e: React.MouseEvent) => {
    if (startY.current === null || !isSwiping) return;
    
    const currentY = e.clientY;
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
  
  // Handle wheel events
  const handleWheel = (e: React.WheelEvent) => {
    if (!quotes) return;
    
    // Prevent the default scroll behavior
    e.preventDefault();
    
    // deltaY > 0 means scrolling down
    if (e.deltaY > 0) {
      // Go to next quote
      setCurrentQuoteIndex((prevIndex) => 
        prevIndex + 1 >= quotes.length ? 0 : prevIndex + 1
      );
    } else if (e.deltaY < 0) {
      // Go to previous quote
      setCurrentQuoteIndex((prevIndex) => 
        prevIndex - 1 < 0 ? quotes.length - 1 : prevIndex - 1
      );
    }
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
    <div 
      className="flex flex-col h-[100vh] w-full bg-gradient-to-br from-blue-50 to-purple-50 overflow-hidden"
      ref={containerRef} 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Minimal header as part of full-height layout */}
      <div className="fixed top-0 left-0 right-0 py-3 z-10 pointer-events-none">
        <div className="flex justify-center">
          <h1 className="text-sm font-heading text-gray-700 bg-white/80 px-3 py-1 rounded-full shadow-sm pointer-events-auto">
            Citas del Día
          </h1>
        </div>
      </div>
      
      {/* Quote container that takes full height and width */}
      <div className="flex items-center justify-center h-full w-full px-5">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md p-6 w-full">
          <p className="font-quote text-2xl leading-relaxed mb-6 text-gray-800">"{currentQuote.text}"</p>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-quote text-lg text-gray-600">— {currentQuote.author}</p>
              <span className={cn(
                "text-xs px-2 py-1 rounded-full inline-block mt-1", 
                getCategoryColor(currentQuote.category)
              )}>
                {currentQuote.category}
              </span>
            </div>
            
            <div className="flex space-x-4">
              <button
                className="text-gray-600 hover:text-primary transition-colors"
                onClick={() => {
                  if (!isSaved) {
                    saveQuoteMutation.mutate(currentQuote.id);
                  }
                }}
                disabled={saveQuoteMutation.isPending || isSaved}
              >
                <Bookmark className={cn(
                  "h-5 w-5", 
                  isSaved ? "fill-current text-primary" : ""
                )} />
              </button>
              
              <button
                className="text-gray-600 hover:text-primary transition-colors"
                onClick={() => shareQuote(currentQuote)}
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Small indicator for swiping */}
      <div className="fixed bottom-4 left-0 right-0 flex justify-center">
        <div className="flex space-x-2">
          <div className="w-1 h-1 rounded-full bg-gray-300"></div>
          <div className="w-1 h-1 rounded-full bg-gray-600"></div>
          <div className="w-1 h-1 rounded-full bg-gray-300"></div>
        </div>
      </div>
    </div>
  );
};

export default DailyQuotesScreen;
