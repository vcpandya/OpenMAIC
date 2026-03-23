import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isOrgMode, prisma } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isOrgMode()) return NextResponse.json({ data: null });

  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: classroomId } = await params;

  const [enrollments, quizAttempts, eventCounts] = await Promise.all([
    prisma.classroomEnrollment.findMany({
      where: { classroomId },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { lastAccessedAt: 'desc' },
    }),
    prisma.quizAttempt.findMany({
      where: { classroomId },
      orderBy: { timestamp: 'desc' },
      take: 100,
    }),
    prisma.learningEvent.groupBy({
      by: ['eventType'],
      where: { classroomId },
      _count: true,
    }),
  ]);

  // Calculate stats
  const avgScore = quizAttempts.length > 0
    ? quizAttempts.reduce((sum, a) => sum + (a.score / a.maxScore) * 100, 0) / quizAttempts.length
    : null;

  const completionRate = enrollments.length > 0
    ? enrollments.filter(e => e.progress >= 100).length / enrollments.length * 100
    : 0;

  return NextResponse.json({
    data: {
      enrollments: enrollments.length,
      completionRate: Math.round(completionRate),
      avgQuizScore: avgScore ? Math.round(avgScore) : null,
      totalQuizAttempts: quizAttempts.length,
      eventBreakdown: Object.fromEntries(eventCounts.map(e => [e.eventType, e._count])),
      recentEnrollments: enrollments.slice(0, 10),
    },
  });
}
