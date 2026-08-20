import React, { useEffect, useRef } from 'react';

export const CursorGlowDot: React.FC = () => {
  const dotRef = useRef<SVGSVGElement | null>(null);
  const posRef = useRef<{ x: number; y: number; targetX: number; targetY: number; visible: boolean }>({
    x: -100,
    y: -100,
    targetX: -100,
    targetY: -100,
    visible: false,
  });

  useEffect(() => {
    let animationFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      posRef.current.targetX = e.clientX;
      posRef.current.targetY = e.clientY;
      posRef.current.visible = true;
    };

    const handleMouseLeave = () => {
      posRef.current.visible = false;
    };

    const updatePosition = () => {
      const state = posRef.current;
      // Smooth delayed interpolation for enhanced trailing follow effect
      const easeFactor = 0.022;
      state.x += (state.targetX - state.x) * easeFactor;
      state.y += (state.targetY - state.y) * easeFactor;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${state.x}px, ${state.y}px, 0)`;
        dotRef.current.style.opacity = state.visible ? '1' : '0';
      }

      animationFrameId = requestAnimationFrame(updatePosition);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    animationFrameId = requestAnimationFrame(updatePosition);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      id="cursor-dot-bg-container"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
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
