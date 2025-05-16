import React from "react";
import { cn } from "@/lib/utils";

interface NavigationDotsProps {
  totalScreens: number;
  activeScreen: number;
  onNavigate: (screenIndex: number) => void;
}

const NavigationDots: React.FC<NavigationDotsProps> = ({
  totalScreens,
  activeScreen,
  onNavigate,
}) => {
  // Screen names for aria-labels
  const screenNames = [
    "Biblioteca", 
    "Cita Global", 
    "Citas del Día", 
    "Cita Personalizada", 
    "Perfil"
  ];

  return (
    <div className="navigation-dots flex justify-center">
      <div className="flex space-x-3 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
        {Array.from({ length: totalScreens }).map((_, index) => (
          <button
            key={index}
            className={cn(
              "dot w-1.5 h-1.5 rounded-full transition-all duration-300 ease-in-out",
              activeScreen === index
                ? "bg-primary"
                : "bg-gray-300"
            )}
            onClick={() => onNavigate(index)}
            aria-label={`Ir a ${screenNames[index] || `pantalla ${index + 1}`}`}
          />
        ))}
      </div>
    </div>
  );
};

export default NavigationDots;
