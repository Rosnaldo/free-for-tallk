import React, { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

interface FloatingActionsProps {
  onCreateRoom?: () => void;
  onShare?: () => void;
}

export const FloatingActions: React.FC<FloatingActionsProps> = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 150);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!showScrollTop) return null;

  return (
    <div
      id="floating-actions-container"
      className="fixed bottom-6 right-6 z-40 flex flex-col items-center gap-3"
    >
      {/* Scroll to Top FAB */}
      <button
        id="scroll-to-top-fab"
        onClick={scrollToTop}
        className="w-11 h-11 rounded-full bg-transparent hover:bg-white/10 border border-white/30 hover:border-white/60 text-white flex items-center justify-center transition-all duration-300 cursor-pointer hover:scale-105 active:scale-95 shadow-lg"
        title="Scroll to Top"
        aria-label="Scroll to Top"
      >
        <ChevronUp className="w-5 h-5 stroke-[2.5]" />
      </button>
    </div>
  );
};
