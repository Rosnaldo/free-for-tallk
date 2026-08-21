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
    opacity: number;
    visible: boolean;
  }>({
    x: -100,
    y: -100,
    targetX: -100,
    targetY: -100,
    opacity: 0,
    visible: false,
  });

  const easeFactor = options?.easeFactor ?? 0.022;

  useEffect(() => {
    let animationFrameId: number;
    let idleTimeoutId: ReturnType<typeof setTimeout>;

    // Hides the dot after a few seconds without any pointer/touch activity;
    // any new movement cancels the pending hide and restarts the countdown.
    const scheduleIdleHide = () => {
      clearTimeout(idleTimeoutId);
      idleTimeoutId = setTimeout(() => {
        posRef.current.visible = false;
      }, 3000);
    };

    const handleMouseMove = (e: MouseEvent) => {
      posRef.current.targetX = e.clientX;
      posRef.current.targetY = e.clientY;
      posRef.current.visible = true;
      scheduleIdleHide();
    };

    const handleMouseLeave = () => {
      posRef.current.visible = false;
      clearTimeout(idleTimeoutId);
    };

    // Touch devices never fire mousemove, so the dot needs its own handlers
    // to follow a finger the same way it follows the cursor.
    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      posRef.current.targetX = touch.clientX;
      posRef.current.targetY = touch.clientY;
      posRef.current.visible = true;
      scheduleIdleHide();
    };

    const handleTouchEnd = () => {
      scheduleIdleHide();
    };

    const OPACITY_EASE_FACTOR = 0.15;

    const updatePosition = () => {
      const state = posRef.current;
      // Smooth delayed interpolation for enhanced trailing follow effect
      state.x += (state.targetX - state.x) * easeFactor;
      state.y += (state.targetY - state.y) * easeFactor;
      // Eased in this same rAF loop (rather than a separate CSS transition)
      // so it never races against the transform updates above -- fading via
      // a CSS transition while transform changes every frame is what made
      // the dot appear to shrink as it disappeared.
      state.opacity += ((state.visible ? 1 : 0) - state.opacity) * OPACITY_EASE_FACTOR;

      if (dotRef.current) {
        // Centering offset (-50, -50) baked in directly instead of relying
        // on a CSS translate class: an inline transform style fully replaces
        // (rather than merges with) any class-based transform, so that class
        // was silently dead.
        dotRef.current.style.transform = `translate3d(${state.x - 50}px, ${state.y - 50}px, 0)`;
        dotRef.current.style.opacity = String(state.opacity);
      }

      animationFrameId = requestAnimationFrame(updatePosition);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('touchstart', handleTouchMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);
    animationFrameId = requestAnimationFrame(updatePosition);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('touchstart', handleTouchMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
      cancelAnimationFrame(animationFrameId);
      clearTimeout(idleTimeoutId);
    };
  }, [easeFactor]);

  return {
    dotRef,
    activeModalOpen,
  };
}
