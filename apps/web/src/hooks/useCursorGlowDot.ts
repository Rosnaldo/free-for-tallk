import { useEffect, useRef } from 'react';

export interface UseCursorGlowDotOptions {
  isModalOpen?: boolean;
  easeFactor?: number;
}

export function useCursorGlowDot(options?: UseCursorGlowDotOptions) {
  const activeModalOpen = Boolean(options?.isModalOpen);

  const dotRef = useRef<SVGSVGElement | null>(null);
  const posRef = useRef<{
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    visible: boolean;
  }>({
    x: -100,
    y: -100,
    targetX: -100,
    targetY: -100,
    visible: false,
  });

  const easeFactor = options?.easeFactor ?? 0.022;

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
  }, [easeFactor]);

  return {
    dotRef,
    activeModalOpen,
  };
}
