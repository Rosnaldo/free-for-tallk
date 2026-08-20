import React from 'react';
import { useCursorGlowDot } from '../hooks/useCursorGlowDot';

interface CursorGlowDotProps {
  isModalOpen?: boolean;
}

export const CursorGlowDot: React.FC<CursorGlowDotProps> = ({ isModalOpen }) => {
  const { dotRef, activeModalOpen } = useCursorGlowDot({ isModalOpen });

  return (
    <div
      id="cursor-dot-bg-container"
      className={`fixed inset-0 pointer-events-none ${
        activeModalOpen ? 'z-50' : 'z-0'
      } overflow-hidden transition-[z-index]`}
      aria-hidden="true"
    >
      <svg
        ref={dotRef}
        className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 will-change-transform transition-opacity duration-300 pointer-events-none"
        width="100"
        height="100"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ transform: 'translate3d(-100px, -100px, 0)', opacity: 0 }}
      >
        {/* Solid clean amber/yellow circle matching the site's accent color (amber-500) */}
        <circle cx="50" cy="50" r="50" fill="#f59e0b" />
      </svg>
    </div>
  );
};

