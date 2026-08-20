import React from 'react';

interface BannerVoteSectionProps {
  className?: string;
}

export const BannerVoteSection: React.FC<BannerVoteSectionProps> = ({
  className = '',
}) => {
  return (
    <section
      id="banner-vote-section"
      className={`relative z-10 bg-transparent py-4 sm:py-6 flex items-center justify-center text-center select-none ${className}`}
    >
      <h2 className="flex flex-wrap items-baseline justify-center gap-x-4 gap-y-1">
        <span className="text-xl sm:text-2xl md:text-3xl font-bold uppercase tracking-wider text-white">
          Eu vou votar no
        </span>
        <span className="text-7xl sm:text-8xl md:text-9xl font-black tracking-tight text-amber-400 leading-none">
          14
        </span>
      </h2>
    </section>
  );
};
