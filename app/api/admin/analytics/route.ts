import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma, isOrgMode } from '@/lib/db';

export async function GET() {
  if (!isOrgMode()) return NextResponse.json({ data: null });

  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user as unknown as Record<string, unknown>).role as string;
  if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [totalUsers, totalClassrooms, totalQuizAttempts] = await Promise.all([
    prisma.user.count(),
    prisma.classroom.count(),
    prisma.quizAttempt.count(),
  ]);

  return NextResponse.json({
    data: { totalUsers, totalClassrooms, totalQuizAttempts },
  });
}
