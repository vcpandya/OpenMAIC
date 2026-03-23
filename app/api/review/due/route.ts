import { NextResponse } from 'next/server';
import { isOrgMode, prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function GET() {
  if (!isOrgMode()) return NextResponse.json({ data: [] });

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const dueReviews = await prisma.reviewSchedule.findMany({
    where: {
      userId: session.user.id,
      nextReviewAt: { lte: new Date() },
    },
    include: {
      classroom: { select: { id: true, title: true } },
    },
    orderBy: { nextReviewAt: 'asc' },
  });

  return NextResponse.json({ data: dueReviews });
}
