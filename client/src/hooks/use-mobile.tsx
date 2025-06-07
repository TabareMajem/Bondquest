import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    // Check if window is available (client-side)
    if (typeof window === 'undefined') return;

    try {
      const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
      const onChange = () => {
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
      }
      mql.addEventListener("change", onChange)
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
      return () => mql.removeEventListener("change", onChange)
    } catch (error) {
      console.warn('matchMedia not supported, falling back to window width');
      // Fallback for browsers that don't support matchMedia
      const onChange = () => {
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
      }
      window.addEventListener('resize', onChange)
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
      return () => window.removeEventListener('resize', onChange)
    }
  }, [])

  return !!isMobile
}
