import React, { useState, useEffect, useRef } from 'react';
import { ArrowUp } from 'lucide-react';

export const BackToTop: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const animRef = useRef<number>();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const smoothScrollToTop = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);

    const duration = 800;
    const start = window.scrollY;
    const startTime = performance.now();

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);

      window.scrollTo(0, start * (1 - eased));

      if (progress < 1) {
        animRef.current = requestAnimationFrame(step);
      }
    };

    animRef.current = requestAnimationFrame(step);
  };

  if (!visible) return null;

  return (
    <button
      onClick={smoothScrollToTop}
      className="fixed bottom-20 sm:bottom-6 right-4 z-40 w-11 h-11 bg-slate-900 hover:bg-indigo-600 text-white rounded-full shadow-xl flex items-center justify-center transition-all cursor-pointer active:scale-90 border border-slate-700"
      title="Volver arriba"
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
};
