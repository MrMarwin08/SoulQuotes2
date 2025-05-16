import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import QuoteCard from "@/components/QuoteCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserQuote, availableTopics } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LibraryScreenProps {
  userId: number;
}

const LibraryScreen: React.FC<LibraryScreenProps> = ({ userId }) => {
  const [filter, setFilter] = useState<"all" | "favorites" | "memorized">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const { data: userQuotes, isLoading } = useQuery({
    queryKey: [`/api/users/${userId}/quotes`],
  });

  const filteredQuotes = React.useMemo(() => {
    if (!userQuotes) return [];

    let quotes = userQuotes as UserQuote[];

    // Apply status filter
    if (filter === "favorites") {
      quotes = quotes.filter((uq) => uq.isFavorite);
    } else if (filter === "memorized") {
      quotes = quotes.filter((uq) => uq.isMemorized);
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      quotes = quotes.filter((uq) => uq.quote.category === categoryFilter);
    }

    return quotes;
  }, [userQuotes, filter, categoryFilter]);

  return (
    <div className="flex flex-col h-full p-5">
      <h1 className="text-3xl font-heading font-bold mb-6">Mi Biblioteca</h1>

      {/* Filter tabs */}
      <Tabs
        defaultValue="all"
        value={filter}
        onValueChange={(value) => setFilter(value as any)}
        className="mb-6"
      >
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="favorites">Favoritas</TabsTrigger>
          <TabsTrigger value="memorized">Memorizadas</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Categories filter chips */}
      <ScrollArea className="mb-6 pb-2 whitespace-nowrap">
        <div className="flex gap-2">
          <Button
            variant={categoryFilter === "all" ? "default" : "outline"}
            className="rounded-full text-sm px-3 py-1 h-auto"
            onClick={() => setCategoryFilter("all")}
          >
            Todos
          </Button>
          
          {availableTopics.map((topic) => (
            <Button
              key={topic}
              variant={categoryFilter === topic ? "default" : "outline"}
              className="rounded-full text-sm px-3 py-1 h-auto"
              onClick={() => setCategoryFilter(topic)}
            >
              {topic}
            </Button>
          ))}
        </div>
      </ScrollArea>

      {/* Saved quotes list */}
      <ScrollArea className="flex-1">
        <div className="space-y-4">
          {isLoading ? (
            <p className="text-center py-4">Cargando citas guardadas...</p>
          ) : filteredQuotes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No tienes citas guardadas</p>
              <p className="text-sm text-gray-400 mt-2">
                Guarda citas desde la sección "Citas del Día"
              </p>
            </div>
          ) : (
            filteredQuotes.map((userQuote) => (
              <QuoteCard
                key={userQuote.id}
                quote={userQuote.quote}
                userId={userId}
                isSaved={true}
                isFavorite={userQuote.isFavorite}
                isMemorized={userQuote.isMemorized}
                variant="compact"
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default LibraryScreen;
