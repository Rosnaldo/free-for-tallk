import { useEffect, useState, type RefObject } from "react";

const MOBILE_BREAKPOINT = 640;
const MOBILE_MEDIA_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

/**
 * Without a ref, tracks the browser window width. Pass a ref to instead
 * track that element's own rendered width (e.g. so previews that shrink a
 * container via CSS, like the CallView Dev Board, are detected correctly).
 */
export function useIsMobile(ref?: RefObject<HTMLElement | null>): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (ref?.current) return ref.current.clientWidth < MOBILE_BREAKPOINT;
    return typeof window !== "undefined" && window.matchMedia(MOBILE_MEDIA_QUERY).matches;
  });

  useEffect(() => {
    const element = ref?.current;

    if (!element) {
      const mediaQueryList = window.matchMedia(MOBILE_MEDIA_QUERY);
      const handleChange = () => setIsMobile(mediaQueryList.matches);

      handleChange();
      mediaQueryList.addEventListener("change", handleChange);
      return () => mediaQueryList.removeEventListener("change", handleChange);
    }

    const observer = new ResizeObserver(([entry]) => {
      setIsMobile((entry?.contentRect.width ?? element.clientWidth) < MOBILE_BREAKPOINT);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return isMobile;
}
