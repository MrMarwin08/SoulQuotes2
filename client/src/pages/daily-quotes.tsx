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
    <div className="flex flex-col h-full bg-gray-50">
      {/* Minimal header */}
      <div className="p-4 bg-white border-b shadow-sm">
        <div className="flex justify-center">
          <h1 className="text-xl font-heading text-gray-700">Citas del Día</h1>
        </div>
      </div>
      
      {/* Full height quote container */}
      <div 
        ref={containerRef} 
        className="flex-1 overflow-hidden touch-none cursor-grab"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      >
        <div className="h-full flex flex-col relative">
          {/* Quote content - Simple design */}
          <div className="flex-1 flex flex-col justify-center items-center px-6 z-10">
            <div className="max-w-md bg-white rounded-xl shadow-md p-8 text-center">
              <p className="font-quote text-2xl leading-relaxed mb-4 text-gray-800">"{currentQuote.text}"</p>
              
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="font-quote text-lg text-gray-600">— {currentQuote.author}</p>
                  <span className={cn(
                    "text-xs px-3 py-1 rounded-full inline-block", 
                    getCategoryColor(currentQuote.category)
                  )}>
                    {currentQuote.category}
                  </span>
                </div>
                
                <div className="flex space-x-3">
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
                      "h-6 w-6", 
                      isSaved ? "fill-current text-primary" : ""
                    )} />
                  </button>
                  
                  <button
                    className="text-gray-600 hover:text-primary transition-colors"
                    onClick={() => shareQuote(currentQuote)}
                  >
                    <Share2 className="h-6 w-6" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyQuotesScreen;
