import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { Quote } from "@/lib/utils";
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

  const isSaved = userQuotes?.some((uq: any) => uq.quoteId === quote?.id) ?? false;
  const isFavorite = userQuotes?.some((uq: any) => uq.quoteId === quote?.id && uq.isFavorite) ?? false;

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
    <div className="flex flex-col h-full p-5">
      <h1 className="text-2xl font-heading font-bold mb-2">Cita Global del Día</h1>
      <p className="text-sm text-gray-500 mb-6">
        Conectando con miles de personas a través de la reflexión
      </p>

      {/* Quote image */}
      <div className="relative h-60 mb-6 rounded-xl overflow-hidden shadow-lg">
        <img
          src={quote.backgroundImageUrl || "https://pixabay.com/get/gf9b201fa108ca8db3a70aec9091838460de66dbf8990c121aa953f6ea8245fa81545a081dcc027b628fba5b1256f8a5d53c94d2954e38de39cd1d4137dec575e_1280.jpg"}
          alt="Imagen inspiradora"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <p className="text-white font-quote text-xl font-medium mb-2">
            "{quote.text}"
          </p>
          <p className="text-white/80 font-quote text-sm">— {quote.author}</p>
        </div>
      </div>

      {/* Interaction buttons */}
      <div className="flex justify-center gap-8 mb-8">
        <button
          className="flex flex-col items-center"
          onClick={() => saveQuoteMutation.mutate()}
          disabled={saveQuoteMutation.isPending || isSaved}
        >
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-1">
            <Bookmark className={isSaved ? "text-primary fill-current" : "text-gray-600"} />
          </div>
          <span className="text-xs text-gray-500">Guardar</span>
        </button>
        
        <button
          className="flex flex-col items-center"
          onClick={() => toggleFavoriteMutation.mutate()}
          disabled={toggleFavoriteMutation.isPending}
        >
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-1">
            <Star className={isFavorite ? "text-yellow-500 fill-current" : "text-gray-600"} />
          </div>
          <span className="text-xs text-gray-500">Favorito</span>
        </button>
        
        <button
          className="flex flex-col items-center"
          onClick={handleShare}
        >
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-1">
            <Share2 className="text-gray-600" />
          </div>
          <span className="text-xs text-gray-500">Compartir</span>
        </button>
      </div>

      {/* Daily Lesson */}
      <div className="bg-primary/5 rounded-xl p-5 mb-4">
        <h2 className="text-lg font-heading font-bold mb-2">Lección de Vida</h2>
        <p className="text-gray-700 mb-4">
          Tómate un momento hoy para reflexionar sobre una acción que puedas realizar 
          para cultivar felicidad genuina en tu vida y en la de quienes te rodean.
        </p>
        <div className="flex items-center gap-2">
          <span className="text-primary">💡</span>
          <span className="text-sm text-primary font-medium">
            Practica la gratitud consciente
          </span>
        </div>
      </div>

      {/* Community engagement stats */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          <span>12,482 personas reflexionando</span>
        </div>
        <div className="flex items-center gap-1">
          <Heart className="h-4 w-4" />
          <span>3,241 inspirados</span>
        </div>
      </div>
    </div>
  );
};

export default GlobalQuoteScreen;
