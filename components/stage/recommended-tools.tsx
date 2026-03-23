'use client';

import { useStageStore } from '@/lib/store';
import { ExternalLink, Github, Cloud, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

const categoryIcons = {
  'open-source': Github,
  'saas': Cloud,
  'resource': BookOpen,
};

const categoryColors = {
  'open-source': 'text-emerald-600 bg-emerald-500/10',
  'saas': 'text-blue-600 bg-blue-500/10',
  'resource': 'text-amber-600 bg-amber-500/10',
};

export function RecommendedTools() {
  const stage = useStageStore((s) => s.stage);
  const tools = stage?.recommendedTools;

  if (!tools || tools.length === 0) return null;

  return (
    <div className="p-3 md:p-4 space-y-3">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-primary" />
        Explore Further
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {tools.map((tool, i) => {
          const Icon = categoryIcons[tool.category] || BookOpen;
          const colorClass = categoryColors[tool.category] || 'text-gray-600 bg-gray-500/10';
          return (
            <a
              key={i}
              href={tool.url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-muted/30 transition-all"
            >
              <div className={cn('shrink-0 w-8 h-8 rounded-lg flex items-center justify-center', colorClass)}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium truncate">{tool.name}</span>
                  {tool.url && <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{tool.description}</p>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
