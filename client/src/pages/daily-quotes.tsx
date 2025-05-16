import React, { useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import QuoteCard from "@/components/QuoteCard";
import { Quote } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DailyQuotesScreenProps {
  userId: number;
}

const DailyQuotesScreen: React.FC<DailyQuotesScreenProps> = ({ userId }) => {
  const { data: quotes, isLoading } = useQuery<Quote[]>({
    queryKey: ["/api/quotes"],
  });

  const { data: userQuotes } = useQuery({
    queryKey: [`/api/users/${userId}/quotes`],
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Simulate infinite scroll by jumping back to top when reaching bottom
  useEffect(() => {
    const handleScroll = () => {
      const element = scrollRef.current;
      if (!element) return;
      
      const { scrollTop, scrollHeight, clientHeight } = element;
      
      // If reached 90% of scroll height
      if (scrollTop + clientHeight >= scrollHeight * 0.9) {
        // Add slight delay before scrolling back to top
        setTimeout(() => {
          if (element) {
            element.scrollTo({
              top: 0,
              behavior: "smooth"
            });
          }
        }, 500);
      }
    };
    
    const element = scrollRef.current;
    if (element) {
      element.addEventListener("scroll", handleScroll);
      return () => element.removeEventListener("scroll", handleScroll);
    }
  }, []);
  
  return (
    <div className="flex flex-col h-full p-5">
      <h1 className="text-3xl font-heading font-bold mb-4">Citas del Día</h1>
      
      <ScrollArea 
        ref={scrollRef} 
        className="flex-1 py-2"
      >
        <div className="space-y-5">
          {isLoading ? (
            <p className="text-center py-4">Cargando citas...</p>
          ) : !quotes || quotes.length === 0 ? (
            <p className="text-center py-4">No hay citas disponibles</p>
          ) : (
            quotes.map((quote) => {
              const userQuote = userQuotes?.find((uq: any) => uq.quoteId === quote.id);
              
              return (
                <QuoteCard
                  key={quote.id}
                  quote={quote}
                  userId={userId}
                  isSaved={!!userQuote}
                  isFavorite={userQuote?.isFavorite}
                  isMemorized={userQuote?.isMemorized}
                  variant={quote.backgroundImageUrl ? "default" : "compact"}
                />
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default DailyQuotesScreen;
