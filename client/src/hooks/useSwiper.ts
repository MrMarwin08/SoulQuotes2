import { useState, useRef, useEffect, useCallback } from "react";

interface UseSwiperOptions {
  initialScreen?: number;
  totalScreens: number;
  onScreenChange?: (screenIndex: number) => void;
}

interface UseSwiperResult {
  activeScreen: number;
  containerRef: React.RefObject<HTMLDivElement>;
  handleNavigate: (screenIndex: number) => void;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
  handleScroll: () => void;
}

export function useSwiper({
  initialScreen = 2,
  totalScreens,
  onScreenChange,
}: UseSwiperOptions): UseSwiperResult {
  const [activeScreen, setActiveScreen] = useState(initialScreen);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const screenWidth = useRef<number>(0);

  const handleNavigate = useCallback((screenIndex: number) => {
    if (screenIndex < 0 || screenIndex >= totalScreens) {
      return;
    }

    setActiveScreen(screenIndex);
    onScreenChange?.(screenIndex);

    const container = containerRef.current;
    if (container) {
      const targetPosition = container.clientWidth * screenIndex;
      container.scrollTo({
        left: targetPosition,
        behavior: "smooth",
      });
    }
  }, [totalScreens, onScreenChange]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    if (containerRef.current) {
      screenWidth.current = containerRef.current.clientWidth;
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null || !containerRef.current) return;

      const touchCurrentX = e.touches[0].clientX;
      const diffX = touchStartX.current - touchCurrentX;
      const swipeThreshold = screenWidth.current * 0.2;

      if (Math.abs(diffX) > swipeThreshold) {
        if (diffX > 0 && activeScreen < totalScreens - 1) {
          // Swiped left, move to next screen
          handleNavigate(activeScreen + 1);
        } else if (diffX < 0 && activeScreen > 0) {
          // Swiped right, move to previous screen
          handleNavigate(activeScreen - 1);
        }
        touchStartX.current = null;
      }
    },
    [activeScreen, totalScreens, handleNavigate]
  );

  const handleTouchEnd = useCallback(() => {
    touchStartX.current = null;
  }, []);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    clearTimeout(container.scrollTimeout as any);
    (container.scrollTimeout as any) = setTimeout(() => {
      const scrollLeft = container.scrollLeft;
      const clientWidth = container.clientWidth;
      const newScreenIndex = Math.round(scrollLeft / clientWidth);

      if (newScreenIndex !== activeScreen) {
        setActiveScreen(newScreenIndex);
        onScreenChange?.(newScreenIndex);
      }
    }, 100);
  }, [activeScreen, onScreenChange]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.scrollTo({
        left: container.clientWidth * activeScreen,
        behavior: "auto",
      });
    }
  }, [activeScreen]);

  return {
    activeScreen,
    containerRef,
    handleNavigate,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleScroll,
  };
}
