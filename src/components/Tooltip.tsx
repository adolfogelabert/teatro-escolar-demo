import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
}) => {
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const gap = 8;

    let top = 0;
    let left = rect.left + rect.width / 2;

    if (position === 'top') {
      top = rect.top - gap;
    } else if (position === 'bottom') {
      top = rect.bottom + gap;
    } else if (position === 'left') {
      top = rect.top + rect.height / 2;
      left = rect.left - gap;
    } else {
      top = rect.top + rect.height / 2;
      left = rect.right + gap;
    }

    setCoords({ top, left });
  };

  useEffect(() => {
    if (show) updatePosition();
  }, [show]);

  const showTooltip = () => {
    clearTimeout(timerRef.current);
    setShow(true);
  };

  const hideTooltip = () => {
    timerRef.current = setTimeout(() => setShow(false), 100);
  };

  const transformMap: Record<string, string> = {
    top: 'translate(-50%, -100%)',
    bottom: 'translate(-50%, 0%)',
    left: 'translate(-100%, -50%)',
    right: 'translate(0%, -50%)',
  };

  const arrowMap: Record<string, string> = {
    top: 'left-1/2 -translate-x-1/2 top-full border-t-slate-900 border-x-transparent border-b-transparent border-[5px]',
    bottom: 'left-1/2 -translate-x-1/2 bottom-full border-b-slate-900 border-x-transparent border-t-transparent border-[5px]',
    left: 'top-1/2 -translate-y-1/2 left-full border-l-slate-900 border-y-transparent border-r-transparent border-[5px]',
    right: 'top-1/2 -translate-y-1/2 right-full border-r-slate-900 border-y-transparent border-l-transparent border-[5px]',
  };

  return (
    <span
      ref={triggerRef}
      className="relative inline-flex"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onTouchStart={() => {
        showTooltip();
        setTimeout(() => setShow(false), 3000);
      }}
    >
      {children || (
        <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-indigo-500 transition-colors cursor-help" />
      )}
      {show && (
        <>
          {/* Invisible bridge so tooltip doesn't disappear when moving to it */}
          <span
            className="fixed z-[9998]"
            style={{
              top: position === 'top' ? coords.top - 4 : position === 'bottom' ? coords.top : coords.top - 4,
              left: position === 'left' ? coords.left - 4 : position === 'right' ? coords.left : coords.left - 4,
              width: position === 'left' || position === 'right' ? 4 : 8,
              height: position === 'top' || position === 'bottom' ? 4 : 8,
            }}
          />
          <span
            className="fixed z-[9999] bg-slate-900 text-white text-[11px] font-medium px-3 py-2 rounded-xl shadow-xl max-w-[240px] leading-relaxed pointer-events-none"
            style={{
              top: position === 'top' || position === 'bottom' ? coords.top : coords.top,
              left: coords.left,
              transform: transformMap[position],
            }}
          >
            {content}
            <span className={`absolute w-0 h-0 border-[5px] ${arrowMap[position]}`} />
          </span>
        </>
      )}
    </span>
  );
};
