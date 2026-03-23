import { NextRequest, NextResponse } from 'next/server';
import { isOrgMode, prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  if (!isOrgMode()) {
    return NextResponse.json({ success: true, mode: 'personal' }); // No-op in personal mode
  }

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { classroomId, sceneId, eventType, metadata } = await req.json();

  await prisma.learningEvent.create({
    data: {
      userId: session.user.id,
      classroomId,
      sceneId,
      eventType,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });

  // Update enrollment progress if scene completed
  if (eventType === 'SCENE_COMPLETED' && sceneId) {
    await prisma.classroomEnrollment.upsert({
      where: { userId_classroomId: { userId: session.user.id, classroomId } },
      create: { userId: session.user.id, classroomId, scenesCompleted: [sceneId], lastAccessedAt: new Date() },
      update: {
        scenesCompleted: { push: sceneId },
        lastAccessedAt: new Date(),
      },
    });
  }

  return NextResponse.json({ success: true });
}
