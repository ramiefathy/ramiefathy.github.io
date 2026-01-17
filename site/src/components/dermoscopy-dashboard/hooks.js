import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

export function useMountAnimationReady() {
  const prefersReducedMotion = useReducedMotion();
  const [ready, setReady] = useState(prefersReducedMotion);

  useEffect(() => {
    if (prefersReducedMotion) {
      setReady(true);
      return undefined;
    }

    const raf = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(raf);
  }, [prefersReducedMotion]);

  return ready;
}

