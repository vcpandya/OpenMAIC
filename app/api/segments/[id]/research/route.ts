import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isOrgMode, prisma } from '@/lib/db';
import { researchTopic } from '@/lib/research/jina';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isOrgMode()) return NextResponse.json({ error: 'Requires organization mode' }, { status: 400 });

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const segment = await prisma.learningSegment.findUnique({ where: { id } });
  if (!segment) return NextResponse.json({ error: 'Segment not found' }, { status: 404 });

  // Research using Jina
  const { sources, summary } = await researchTopic(segment.name, segment.keywords);

  // Save digest
  const digest = await prisma.dailyDigest.create({
    data: {
      segmentId: segment.id,
      sources: JSON.stringify(sources),
      status: 'researched',
    },
  });

  // Update segment's lastResearchedAt
  await prisma.learningSegment.update({
    where: { id },
    data: { lastResearchedAt: new Date() },
  });

  return NextResponse.json({ data: { digest, summary, sources } });
}
