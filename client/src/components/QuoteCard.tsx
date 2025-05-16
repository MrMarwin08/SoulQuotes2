import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bookmark, Star, Share2, Brain } from "lucide-react";
import { cn, type Quote } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface QuoteCardProps {
  quote: Quote;
  userId: number;
  isSaved?: boolean;
  isFavorite?: boolean;
  isMemorized?: boolean;
  variant?: "default" | "compact" | "with-image";
  className?: string;
}

const QuoteCard: React.FC<QuoteCardProps> = ({
  quote,
  userId,
  isSaved = false,
  isFavorite = false,
  isMemorized = false,
  variant = "default",
  className,
}) => {
  const queryClient = useQueryClient();

  const saveQuoteMutation = useMutation({
    mutationFn: async () => {
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

  const toggleMemorizedMutation = useMutation({
    mutationFn: async () => {
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

  const handleSave = () => {
    if (!isSaved) {
      saveQuoteMutation.mutate();
    }
  };

  const handleFavorite = () => {
    toggleFavoriteMutation.mutate();
  };

  const handleMemorize = () => {
    toggleMemorizedMutation.mutate();
  };

  const handleShare = () => {
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

  if (variant === "with-image" && quote.backgroundImageUrl) {
    return (
      <div className={cn("relative h-60 rounded-xl overflow-hidden shadow-lg", className)}>
        <img
          src={quote.backgroundImageUrl}
          alt={`Quote by ${quote.author}`}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <p className="text-white font-quote text-xl font-medium mb-2">"{quote.text}"</p>
          <p className="text-white/80 font-quote text-sm">— {quote.author}</p>
        </div>
      </div>
    );
  }

  return (
    <Card className={cn("overflow-hidden transition-transform hover:shadow-md", className)}>
      {variant === "default" && quote.backgroundImageUrl && (
        <div className="w-full h-40 overflow-hidden">
          <img
            src={quote.backgroundImageUrl}
            alt={`Quote by ${quote.author}`}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardContent className={cn("p-5", variant === "compact" ? "pt-5" : "pt-5")}>
        <p className="font-quote text-lg mb-2">"{quote.text}"</p>
        <p className="font-quote text-sm text-gray-600 mb-3">— {quote.author}</p>
        <div className="flex justify-between items-center">
          <span className={cn("text-xs px-2 py-1 rounded-full", getCategoryColor(quote.category))}>
            {quote.category}
          </span>
          <div className="flex gap-3">
            {variant !== "compact" && (
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8",
                  isSaved ? "text-primary" : "text-gray-400"
                )}
                onClick={handleSave}
                disabled={saveQuoteMutation.isPending}
              >
                <Bookmark className={cn("h-5 w-5", isSaved ? "fill-current" : "")} />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8",
                isFavorite ? "text-yellow-500" : "text-gray-400"
              )}
              onClick={handleFavorite}
              disabled={toggleFavoriteMutation.isPending}
            >
              <Star className={cn("h-5 w-5", isFavorite ? "fill-current" : "")} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8",
                isMemorized ? "text-primary" : "text-gray-400"
              )}
              onClick={handleMemorize}
              disabled={toggleMemorizedMutation.isPending}
            >
              <Brain className={cn("h-5 w-5", isMemorized ? "fill-current" : "")} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400"
              onClick={handleShare}
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuoteCard;
