'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Plus, Search, RefreshCw } from 'lucide-react';

interface Segment {
  id: string;
  name: string;
  keywords: string[];
  isActive: boolean;
  lastResearchedAt: string | null;
  digests: Array<{ id: string; date: string; status: string }>;
}

export default function SegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [name, setName] = useState('');
  const [keywords, setKeywords] = useState('');
  const [loading, setLoading] = useState(false);
  const [researching, setResearching] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/segments').then(r => r.json()).then(d => {
      if (d.data) setSegments(d.data);
    });
  }, []);

  const createSegment = async () => {
    if (!name.trim()) return;
    setLoading(true);
    const res = await fetch('/api/segments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        keywords: keywords ? keywords.split(',').map(k => k.trim()).filter(Boolean) : [name.trim()],
        scope: 'org',
      }),
    });
    const data = await res.json();
    if (data.data) {
      setSegments(prev => [{ ...data.data, digests: [] }, ...prev]);
      setName('');
      setKeywords('');
    }
    setLoading(false);
  };

  const triggerResearch = async (segmentId: string) => {
    setResearching(segmentId);
    try {
      const res = await fetch(`/api/segments/${segmentId}/research`, { method: 'POST' });
      const data = await res.json();
      if (data.data) {
        // Refresh segments
        const refreshRes = await fetch('/api/segments');
        const refreshData = await refreshRes.json();
        if (refreshData.data) setSegments(refreshData.data);
      }
    } catch { /* ignore */ }
    setResearching(null);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Learning Segments</h1>

      {/* Create segment */}
      <div className="bg-card border border-border/50 rounded-xl p-5 mb-6 max-w-lg">
        <h2 className="text-sm font-semibold mb-3">Add Learning Segment</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Topic Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
              placeholder="e.g., Machine Learning" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Keywords (comma-separated, optional)</label>
            <input type="text" value={keywords} onChange={(e) => setKeywords(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
              placeholder="e.g., neural networks, deep learning, transformers" />
          </div>
          <button onClick={createSegment} disabled={loading || !name.trim()}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Create Segment
          </button>
        </div>
      </div>

      {/* Segments list */}
      <div className="space-y-3">
        {segments.map((segment) => (
          <div key={segment.id} className="bg-card border border-border/50 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{segment.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                Keywords: {segment.keywords.join(', ')}
                {segment.lastResearchedAt && ` · Last researched: ${new Date(segment.lastResearchedAt).toLocaleDateString()}`}
              </p>
            </div>
            <button
              onClick={() => triggerResearch(segment.id)}
              disabled={researching === segment.id}
              className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted/50 disabled:opacity-50 flex items-center gap-1.5 shrink-0"
            >
              {researching === segment.id ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <Search className="w-3 h-3" />
              )}
              Research
            </button>
          </div>
        ))}
        {segments.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No learning segments yet. Create one above to start auto-learning.</p>
        )}
      </div>
    </div>
  );
}
