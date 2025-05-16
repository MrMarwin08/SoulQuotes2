import React, { useEffect } from "react";
import { useSwiper } from "@/hooks/useSwiper";
import NavigationDots from "@/components/NavigationDots";
import LibraryScreen from "./library";
import GlobalQuoteScreen from "./global-quote";
import DailyQuotesScreen from "./daily-quotes";
import PersonalizedQuoteScreen from "./personalized-quote";
import ProfileScreen from "./profile";
import { defaultUser } from "@/lib/utils";

const Home: React.FC = () => {
  const {
    activeScreen,
    containerRef,
    handleNavigate,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleScroll,
  } = useSwiper({
    initialScreen: 2, // Start with Daily Quotes as the central screen
    totalScreens: 5,
  });

  // Set document title based on active screen
  useEffect(() => {
    const titles = [
      "Mi Biblioteca | Citas del Alma",
      "Cita Global del Día | Citas del Alma",
      "Citas del Día | Citas del Alma",
      "Tu Cita Personalizada | Citas del Alma",
      "Mi Perfil | Citas del Alma",
    ];
    document.title = titles[activeScreen];
  }, [activeScreen]);

  return (
    <div className="h-[100vh] w-full flex flex-col bg-background text-foreground overflow-hidden">
      <div
        ref={containerRef}
        className="swiper-container flex-1 flex overflow-x-auto hide-scrollbar scroll-snap-x-mandatory"
        style={{
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          scrollBehavior: "smooth",
          msOverflowStyle: "none",
          scrollbarWidth: "none",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onScroll={handleScroll}
      >
        {/* Screen 1: Biblioteca personal */}
        <div className="swiper-slide w-full flex-shrink-0 h-full scroll-snap-align-center">
          <LibraryScreen userId={defaultUser.id} />
        </div>

        {/* Screen 2: Cita global + Lección */}
        <div className="swiper-slide w-full flex-shrink-0 h-full scroll-snap-align-center">
          <GlobalQuoteScreen userId={defaultUser.id} />
        </div>

        {/* Screen 3: Citas del día (central screen) */}
        <div className="swiper-slide w-full flex-shrink-0 h-full scroll-snap-align-center">
          <DailyQuotesScreen userId={defaultUser.id} />
        </div>

        {/* Screen 4: Cita personalizada */}
        <div className="swiper-slide w-full flex-shrink-0 h-full scroll-snap-align-center">
          <PersonalizedQuoteScreen userId={defaultUser.id} />
        </div>

        {/* Screen 5: Perfil y ajustes */}
        <div className="swiper-slide w-full flex-shrink-0 h-full scroll-snap-align-center">
          <ProfileScreen userId={defaultUser.id} />
        </div>
      </div>

      {/* Bottom navigation dots */}
      <div className="fixed bottom-3 left-0 right-0 z-10">
        <NavigationDots
          totalScreens={5}
          activeScreen={activeScreen}
          onNavigate={handleNavigate}
        />
      </div>
    </div>
  );
};

export default Home;
