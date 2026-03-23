import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isOrgMode, prisma } from '@/lib/db';

export async function GET() {
  if (!isOrgMode()) return NextResponse.json({ data: [] });

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const orgId = (session.user as unknown as Record<string, unknown>).organizationId as string;

  const segments = await prisma.learningSegment.findMany({
    where: {
      OR: [
        { organizationId: orgId },
        { userId: session.user.id },
      ],
    },
    include: { digests: { take: 1, orderBy: { date: 'desc' } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ data: segments });
}

export async function POST(req: NextRequest) {
  if (!isOrgMode()) return NextResponse.json({ error: 'Requires organization mode' }, { status: 400 });

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, keywords, scope } = await req.json();
  const orgId = (session.user as unknown as Record<string, unknown>).organizationId as string;

  const segment = await prisma.learningSegment.create({
    data: {
      name,
      keywords: keywords || [name],
      organizationId: scope === 'org' ? orgId : null,
      userId: scope === 'personal' ? session.user.id : null,
    },
  });

  return NextResponse.json({ data: segment });
}
