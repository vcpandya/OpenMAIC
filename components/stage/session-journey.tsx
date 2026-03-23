'use client';

import { cn } from '@/lib/utils/cn';
import { Check } from 'lucide-react';
import { useRef, useEffect } from 'react';
import type { Scene } from '@/lib/types/stage';

interface SessionJourneyProps {
  scenes: Scene[];
  currentSceneId: string | null;
  onSceneSelect: (sceneId: string) => void;
}

export function SessionJourney({ scenes, currentSceneId, onSceneSelect }: SessionJourneyProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentIndex = scenes.findIndex((s) => s.id === currentSceneId);

  // Auto-scroll to keep current scene pill visible
  useEffect(() => {
    if (scrollRef.current && currentIndex >= 0) {
      const el = scrollRef.current.children[currentIndex] as HTMLElement;
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [currentIndex]);

  if (scenes.length <= 1) return null;

  return (
    <div className="w-full bg-background/80 backdrop-blur-sm border-b border-border/50 px-2 md:px-4">
      <div
        ref={scrollRef}
        className="flex items-center gap-1 md:gap-1.5 overflow-x-auto py-1.5"
        style={{ scrollbarWidth: 'none' }}
      >
        {scenes.map((scene, index) => {
          const isCurrent = scene.id === currentSceneId;
          const isCompleted = currentIndex >= 0 && index < currentIndex;
          const isFuture = currentIndex >= 0 && index > currentIndex;

          return (
            <button
              key={scene.id}
              onClick={() => onSceneSelect(scene.id)}
              className={cn(
                'shrink-0 flex items-center gap-1.5 px-2 md:px-3 py-1 rounded-full text-xs transition-all duration-300 cursor-pointer',
                'border',
                isCurrent && 'bg-primary/10 border-primary/40 text-primary font-medium shadow-sm',
                isCompleted && 'bg-muted/50 border-border/30 text-muted-foreground',
                isFuture && 'bg-transparent border-border/20 text-muted-foreground/50',
                !isCurrent && 'hover:bg-muted/80 hover:border-border/50',
              )}
            >
              {/* Progress dot / checkmark */}
              <span
                className={cn(
                  'shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold',
                  isCurrent && 'bg-primary text-primary-foreground',
                  isCompleted && 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
                  isFuture && 'bg-muted text-muted-foreground/40',
                )}
              >
                {isCompleted ? <Check className="w-2.5 h-2.5" /> : index + 1}
              </span>
              {/* Title — hidden on mobile, dots only */}
              <span className="hidden md:inline truncate max-w-[120px]">
                {scene.title || `Scene ${index + 1}`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
