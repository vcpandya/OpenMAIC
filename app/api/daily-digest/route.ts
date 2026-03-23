import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isOrgMode, prisma } from '@/lib/db';

export async function GET() {
  if (!isOrgMode()) return NextResponse.json({ data: [] });

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const orgId = (session.user as unknown as Record<string, unknown>).organizationId as string;

  const digests = await prisma.dailyDigest.findMany({
    where: {
      date: { gte: today },
      segment: {
        OR: [
          { organizationId: orgId },
          { userId: session.user.id },
        ],
      },
    },
    include: { segment: true },
    orderBy: { date: 'desc' },
  });

  return NextResponse.json({
    data: digests.map(d => ({
      ...d,
      sources: JSON.parse(d.sources),
    })),
  });
}
