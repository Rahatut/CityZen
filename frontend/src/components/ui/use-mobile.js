import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(undefined);

  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      // Non-web environments (React Native) — assume mobile by default
      setIsMobile(true);
      return;
    }

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener("change", onChange);
    } else if (typeof mql.addListener === 'function') {
      mql.addListener(onChange);
    }
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => {
      if (typeof mql.removeEventListener === 'function') {
        mql.removeEventListener("change", onChange);
      } else if (typeof mql.removeListener === 'function') {
        mql.removeListener(onChange);
      }
    };
  }, []);

  return !!isMobile;
}
