import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer
      id="app-global-footer"
      className="w-full border-t border-white/10 bg-transparent px-6 py-2.5 mt-auto z-20 text-white/50 text-[11px] select-none shrink-0"
    >
      <div className="max-w-[1600px] mx-auto flex items-center justify-center gap-2 text-center">
        <span className="font-medium text-white/80">missão</span>
        <span className="text-white/30">•</span>
        <span className="text-white/40">© {new Date().getFullYear()}</span>
      </div>
    </footer>
  );
};
