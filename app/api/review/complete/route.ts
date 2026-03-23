import { NextRequest, NextResponse } from 'next/server';
import { isOrgMode, prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

// SM-2 spaced repetition algorithm
function sm2(easeFactor: number, interval: number, quality: number): { interval: number; easeFactor: number } {
  // quality: 0-5 (0=blackout, 5=perfect)
  const newEF = Math.max(1.3, easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  let newInterval: number;
  if (quality < 3) {
    newInterval = 1; // Reset on poor performance
  } else if (interval <= 1) {
    newInterval = 1;
  } else if (interval <= 6) {
    newInterval = 6;
  } else {
    newInterval = Math.round(interval * newEF);
  }

  return { interval: newInterval, easeFactor: newEF };
}

export async function POST(req: NextRequest) {
  if (!isOrgMode()) return NextResponse.json({ success: true });

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { classroomId, score, maxScore } = await req.json();
  const quality = Math.round((score / maxScore) * 5); // Convert to 0-5 scale

  const existing = await prisma.reviewSchedule.findUnique({
    where: { userId_classroomId: { userId: session.user.id, classroomId } },
  });

  if (!existing) {
    // Create first review schedule
    await prisma.reviewSchedule.create({
      data: {
        userId: session.user.id,
        classroomId,
        nextReviewAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        interval: 1,
        easeFactor: 2.5,
        reviewCount: 1,
        lastScore: score / maxScore,
      },
    });
  } else {
    const { interval, easeFactor } = sm2(existing.easeFactor, existing.interval, quality);
    await prisma.reviewSchedule.update({
      where: { id: existing.id },
      data: {
        nextReviewAt: new Date(Date.now() + interval * 24 * 60 * 60 * 1000),
        interval,
        easeFactor,
        reviewCount: existing.reviewCount + 1,
        lastScore: score / maxScore,
      },
    });
  }

  return NextResponse.json({ success: true });
}
