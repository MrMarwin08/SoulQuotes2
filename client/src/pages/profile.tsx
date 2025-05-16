import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { User, defaultUser, availableTopics, availableAuthors, formatDate } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Bell, Clock, Moon, Languages } from "lucide-react";

interface ProfileScreenProps {
  userId: number;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ userId }) => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User>(defaultUser);

  const updatePreferencesMutation = useMutation({
    mutationFn: async (preferences: User["preferences"]) => {
      const res = await apiRequest("PATCH", `/api/users/${userId}/preferences`, preferences);
      return res.json();
    },
    onSuccess: (updatedUser) => {
      setUser(prevUser => ({
        ...prevUser,
        preferences: {
          ...prevUser.preferences,
          ...updatedUser.preferences
        }
      }));
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
    }
  });

  const handleTopicToggle = (topic: string) => {
    const currentTopics = user.preferences?.topics || [];
    const newTopics = currentTopics.includes(topic)
      ? currentTopics.filter(t => t !== topic)
      : [...currentTopics, topic];
    
    updatePreferencesMutation.mutate({
      ...user.preferences,
      topics: newTopics
    });
  };

  const handleAuthorToggle = (author: string) => {
    const currentAuthors = user.preferences?.authors || [];
    const newAuthors = currentAuthors.includes(author)
      ? currentAuthors.filter(a => a !== author)
      : [...currentAuthors, author];
    
    updatePreferencesMutation.mutate({
      ...user.preferences,
      authors: newAuthors
    });
  };

  const handleDarkModeToggle = () => {
    updatePreferencesMutation.mutate({
      ...user.preferences,
      darkMode: !user.preferences?.darkMode
    });
  };

  return (
    <div className="flex flex-col h-full p-5">
      <h1 className="text-3xl font-heading font-bold mb-6">Mi Perfil</h1>
      
      {/* User info */}
      <div className="flex items-center mb-8">
        <div className="relative mr-4">
          <img 
            src={user.profilePicture || "https://via.placeholder.com/150"}
            alt="Avatar de usuario" 
            className="w-20 h-20 rounded-full object-cover border-2 border-primary" 
          />
          <button className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
        <div>
          <h2 className="font-medium text-lg">{user.fullName}</h2>
          <p className="text-gray-500 text-sm">
            Miembro desde {formatDate(user.memberSince)}
          </p>
        </div>
      </div>
      
      {/* Preferences section */}
      <ScrollArea className="flex-1 pr-2">
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-3">Temas de interés</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {availableTopics.map(topic => (
              <Button
                key={topic}
                variant={user.preferences?.topics?.includes(topic) ? "default" : "outline"}
                className="rounded-full text-sm px-3 py-1 h-auto"
                onClick={() => handleTopicToggle(topic)}
              >
                {topic}
              </Button>
            ))}
          </div>
          
          <h2 className="text-lg font-medium mb-3">Autores favoritos</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {availableAuthors.map(author => (
              <Button
                key={author}
                variant={user.preferences?.authors?.includes(author) ? "secondary" : "outline"}
                className="rounded-full text-sm px-3 py-1 h-auto"
                onClick={() => handleAuthorToggle(author)}
              >
                {author}
              </Button>
            ))}
          </div>
        </div>
        
        {/* App settings */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium mb-2">Configuración</h2>
          
          <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
            <div className="flex items-center">
              <Bell className="text-gray-500 mr-3 h-5 w-5" />
              <Label htmlFor="notifications">Notificaciones diarias</Label>
            </div>
            <Switch id="notifications" defaultChecked />
          </div>
          
          <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
            <div className="flex items-center">
              <Clock className="text-gray-500 mr-3 h-5 w-5" />
              <span>Horario de notificación</span>
            </div>
            <div className="text-gray-500">{user.preferences?.notificationTime || "08:00"}</div>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
            <div className="flex items-center">
              <Moon className="text-gray-500 mr-3 h-5 w-5" />
              <Label htmlFor="dark-mode">Modo oscuro</Label>
            </div>
            <Switch 
              id="dark-mode" 
              checked={user.preferences?.darkMode || false}
              onCheckedChange={handleDarkModeToggle}
            />
          </div>
          
          <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
            <div className="flex items-center">
              <Languages className="text-gray-500 mr-3 h-5 w-5" />
              <span>Idioma</span>
            </div>
            <div className="text-gray-500">{user.preferences?.language || "Español"}</div>
          </div>
        </div>
        
        <Separator className="my-4" />
        
        {/* App version */}
        <div className="text-center text-xs text-gray-400 pb-4">
          Citas del Alma v1.0.1
        </div>
      </ScrollArea>
    </div>
  );
};

export default ProfileScreen;
