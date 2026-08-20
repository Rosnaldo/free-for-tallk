import React from 'react';

interface VoteHeroSectionProps {
  onCreateRoom: () => void;
  className?: string;
}

export const VoteHeroSection: React.FC<VoteHeroSectionProps> = ({
  onCreateRoom,
  className = '',
}) => {
  return (
    <section
      id="vote-hero-section"
      className={`relative z-10 bg-transparent pt-4 sm:pt-6 pb-6 sm:pb-8 mb-8 sm:mb-12 flex flex-col items-center justify-center text-center select-none space-y-4 sm:space-y-6 ${className}`}
    >
      {/* Vote Text */}
      <h2 className="flex flex-wrap items-baseline justify-center gap-x-4 gap-y-1">
        <span className="text-xl sm:text-2xl md:text-3xl font-bold uppercase tracking-wider text-white">
          Eu vou votar no
        </span>
        <span className="text-7xl sm:text-8xl md:text-9xl font-black tracking-tight text-amber-400 leading-none">
          14
        </span>
      </h2>

      {/* Button to Create Room below the text */}
      <div>
        <button
          id="hero-create-room-btn"
          type="button"
          onClick={onCreateRoom}
          className="px-5 py-2.5 rounded-xl bg-amber-400 text-black font-bold text-xs uppercase tracking-wider transition-colors active:scale-95 cursor-pointer"
        >
          Criar Sala
        </button>
      </div>
    </section>
  );
};
