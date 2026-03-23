import { NextRequest, NextResponse } from 'next/server';
import { isOrgMode, prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  if (!isOrgMode()) return NextResponse.json({ success: true, mode: 'personal' });

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { classroomId, questionId, answer, score, maxScore } = await req.json();

  await prisma.quizAttempt.create({
    data: {
      userId: session.user.id,
      classroomId,
      questionId,
      answer: String(answer),
      score: Number(score),
      maxScore: Number(maxScore),
    },
  });

  return NextResponse.json({ success: true });
}
