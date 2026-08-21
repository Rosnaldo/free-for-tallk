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
        className="absolute top-0 left-0 will-change-transform pointer-events-none"
        width="100"
        height="100"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ transform: 'translate3d(-150px, -150px, 0)', opacity: 0 }}
      >
        {/* Solid amber/yellow circle -- uses the amber-400 utility (not a
            hardcoded hex) so it's pixel-identical to every other amber-400
            accent across the app, matching the home page's yellow. */}
        <circle cx="50" cy="50" r="50" className="fill-amber-400" />
      </svg>
    </div>
  );
};

