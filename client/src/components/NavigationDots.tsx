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
  return (
    <div className="navigation-dots flex justify-center py-5">
      <div className="flex space-x-3">
        {Array.from({ length: totalScreens }).map((_, index) => (
          <button
            key={index}
            className={cn(
              "dot w-2 h-2 rounded-full transition-all duration-300 ease-in-out",
              activeScreen === index
                ? "bg-primary transform scale-150"
                : "bg-gray-300"
            )}
            onClick={() => onNavigate(index)}
            aria-label={`Navegar a la pantalla ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default NavigationDots;
