import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Presentation } from '../types';
import { formatCOP } from '../data/theaterData';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Ticket,
  Sparkles,
  Pause,
  Play,
} from 'lucide-react';

interface EventSliderProps {
  presentations: Presentation[];
  ticketPrice: number;
  currentPresentationId: string;
  onSelect: (id: string) => void;
}

const GAP = 16;

export const EventSlider: React.FC<EventSliderProps> = ({
  presentations,
  ticketPrice,
  currentPresentationId,
  onSelect,
}) => {
  const count = presentations.length;
  const [realIndex, setRealIndex] = useState(0);
  const [displayIndex, setDisplayIndex] = useState(1); // 1-based, first real slide
  const [isPaused, setIsPaused] = useState(false);
  const [slideWidth, setSlideWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [hasTransition, setHasTransition] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMoveRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  // Measure
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) setSlideWidth(containerRef.current.offsetWidth);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Auto-advance
  useEffect(() => {
    if (isPaused || isDragging) return;
    timerRef.current = setInterval(() => {
      advance(1);
    }, 4000);
    return () => clearInterval(timerRef.current);
  }, [isPaused, isDragging, realIndex]);

  const advance = useCallback((delta: number) => {
    setDisplayIndex((prev) => {
      const next = prev + delta;
      setRealIndex(((next - 1) % count + count) % count);
      return next;
    });
  }, [count]);

  // Infinite snap: when displayIndex goes past boundaries, silently jump
  const totalClones = count * 2;
  useEffect(() => {
    if (!hasTransition) return;

    // After last clone → jump to real position (no transition)
    if (displayIndex >= count + 1) {
      const timer = setTimeout(() => {
        setHasTransition(false);
        setDisplayIndex(1);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setHasTransition(true);
          });
        });
      }, 450);
      return () => clearTimeout(timer);
    }
    // Before first clone → jump to real position
    if (displayIndex <= 0) {
      const timer = setTimeout(() => {
        setHasTransition(false);
        setDisplayIndex(count);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setHasTransition(true);
          });
        });
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [displayIndex, count, hasTransition]);

  const goNext = useCallback(() => {
    advance(1);
    setDragOffset(0);
  }, [advance]);

  const goPrev = useCallback(() => {
    advance(-1);
    setDragOffset(0);
  }, [advance]);

  // Touch / drag
  const onPointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setHasTransition(false);
    lastMoveRef.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const delta = e.clientX - lastMoveRef.current;
    lastMoveRef.current = e.clientX;
    setDragOffset((prev) => prev + delta);
  };

  const onPointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    setHasTransition(true);

    const threshold = slideWidth * 0.2;
    if (dragOffset < -threshold) {
      advance(1);
    } else if (dragOffset > threshold) {
      advance(-1);
    }
    setDragOffset(0);
  };

  // Build display slides: [clone_last, real0, real1, ..., realN-1, clone_first]
  const displaySlides = [
    presentations[count - 1],
    ...presentations,
    presentations[0],
  ];

  const translateX = -(displayIndex * (slideWidth + GAP)) + dragOffset;

  return (
    <div className="relative">
      {/* Viewport */}
      <div
        ref={containerRef}
        className="overflow-hidden rounded-2xl"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ touchAction: 'pan-y' }}
      >
        <div
          className="flex"
          style={{
            gap: `${GAP}px`,
            transform: `translateX(${translateX}px)`,
            transition: hasTransition
              ? 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
              : 'none',
          }}
        >
          {displaySlides.map((pres, i) => {
            const c = accentMap[pres.id] || accentMap.primaria;
            return (
              <div
                key={`${pres.id}-${i}`}
                className={`w-full shrink-0 bg-gradient-to-r ${c.bg} rounded-2xl overflow-hidden shadow-xl ${c.glow} border ${c.border}`}
                style={{ width: slideWidth || '100%' }}
              >
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                  <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                </div>

                <div className="relative z-10 p-4 sm:p-6">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                          {pres.name}
                        </span>
                        <span className="bg-white/15 text-white/80 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                          {pres.grades}
                        </span>
                      </div>
                      <h2 className={`text-xl sm:text-2xl font-black ${c.text} tracking-tight mb-1`}>
                        {pres.title}
                      </h2>
                      <p className={`text-sm ${c.text} opacity-80 font-medium mb-3`}>{pres.obra}</p>
                      <p className={`text-xs ${c.text} opacity-60 max-w-lg leading-relaxed hidden sm:block`}>
                        {pres.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
                          <Calendar className="w-3.5 h-3.5 text-white" />
                          <span className="text-xs font-semibold text-white">{pres.date}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
                          <Clock className="w-3.5 h-3.5 text-white" />
                          <span className="text-xs font-semibold text-white">{pres.time}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
                          <Ticket className="w-3.5 h-3.5 text-white" />
                          <span className="text-xs font-bold text-white">{formatCOP(ticketPrice)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-3 lg:items-end shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); onSelect(pres.id); }}
                        onPointerDown={(e) => e.stopPropagation()}
                        className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                          currentPresentationId === pres.id
                            ? 'bg-white text-slate-900 shadow-lg scale-105'
                            : 'bg-white/20 text-white hover:bg-white/30 border border-white/30'
                        }`}
                      >
                        {currentPresentationId === pres.id ? (
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4" />
                            Seleccionada
                          </span>
                        ) : 'Ver Asientos'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Arrows */}
      <button
        onClick={(e) => { e.stopPropagation(); goPrev(); }}
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute -left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white hover:bg-slate-50 rounded-full shadow-lg flex items-center justify-center transition-all cursor-pointer z-20 border border-slate-200"
      >
        <ChevronLeft className="w-5 h-5 text-slate-600" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); goNext(); }}
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white hover:bg-slate-50 rounded-full shadow-lg flex items-center justify-center transition-all cursor-pointer z-20 border border-slate-200"
      >
        <ChevronRight className="w-5 h-5 text-slate-600" />
      </button>

      {/* Dots + Pause */}
      <div className="flex items-center justify-center gap-2 mt-3">
        {presentations.map((pres, i) => (
          <button
            key={pres.id}
            onClick={(e) => {
              e.stopPropagation();
              setHasTransition(false);
              setDisplayIndex(i + 1);
              setRealIndex(i);
              requestAnimationFrame(() => {
                requestAnimationFrame(() => setHasTransition(true));
              });
              setDragOffset(0);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className={`transition-all cursor-pointer rounded-full ${
              i === realIndex
                ? 'w-6 h-2 bg-slate-800'
                : 'w-2 h-2 bg-slate-300 hover:bg-slate-400'
            }`}
          />
        ))}
        <button
          onClick={(e) => { e.stopPropagation(); setIsPaused(!isPaused); }}
          onPointerDown={(e) => e.stopPropagation()}
          className="ml-2 p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          title={isPaused ? 'Reproducir' : 'Pausar'}
        >
          {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};

const accentMap: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  preescolar: {
    bg: 'from-amber-500 via-orange-500 to-amber-600',
    border: 'border-amber-400/40',
    text: 'text-amber-50',
    glow: 'shadow-amber-500/30',
  },
  primaria: {
    bg: 'from-emerald-500 via-teal-500 to-emerald-600',
    border: 'border-emerald-400/40',
    text: 'text-emerald-50',
    glow: 'shadow-emerald-500/30',
  },
  bachillerato: {
    bg: 'from-indigo-500 via-purple-500 to-indigo-600',
    border: 'border-indigo-400/40',
    text: 'text-indigo-50',
    glow: 'shadow-indigo-500/30',
  },
};
