'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Users, BookOpen, TrendingUp } from 'lucide-react';

interface ClassroomStat {
  id: string;
  title: string;
  enrollments: number;
  completionRate: number;
  avgQuizScore: number | null;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<{ totalUsers: number; totalClassrooms: number; totalQuizAttempts: number }>({
    totalUsers: 0, totalClassrooms: 0, totalQuizAttempts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch aggregate stats
    fetch('/api/admin/analytics')
      .then(r => r.json())
      .then(d => {
        if (d.data) setStats(d.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-600 bg-blue-500/10' },
    { label: 'Classrooms Created', value: stats.totalClassrooms, icon: BookOpen, color: 'text-emerald-600 bg-emerald-500/10' },
    { label: 'Quiz Attempts', value: stats.totalQuizAttempts, icon: BarChart3, color: 'text-purple-600 bg-purple-500/10' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Analytics</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-card border border-border/50 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-4 h-4" />
              </div>
              <span className="text-sm text-muted-foreground">{stat.label}</span>
            </div>
            <p className="text-3xl font-bold">{loading ? '—' : stat.value}</p>
          </div>
        ))}
      </div>

      {/* Per-classroom analytics instruction */}
      <div className="bg-card border border-border/50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">Classroom Analytics</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          View detailed analytics for individual classrooms via the API:
        </p>
        <code className="block mt-2 px-3 py-2 rounded-lg bg-muted text-xs font-mono">
          GET /api/analytics/classroom/&#123;classroomId&#125;
        </code>
        <p className="text-xs text-muted-foreground mt-2">
          Returns: enrollment count, completion rate, average quiz score, event breakdown, and recent student activity.
        </p>
      </div>
    </div>
  );
}
