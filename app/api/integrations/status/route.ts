import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma, isOrgMode } from '@/lib/db';

export async function GET() {
  if (!isOrgMode()) return NextResponse.json({ data: [] });

  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const orgId = (session.user as unknown as Record<string, unknown>).organizationId as string;
  if (!orgId) return NextResponse.json({ data: [] });

  const integrations = await prisma.integration.findMany({
    where: { orgId },
    select: { id: true, type: true, status: true, createdAt: true, config: true },
  });

  // Strip sensitive data from config (only return bot name, not token)
  const safe = integrations.map(i => {
    const config = JSON.parse(i.config);
    return {
      id: i.id,
      type: i.type,
      status: i.status,
      botName: config.botName || null,
      createdAt: i.createdAt,
    };
  });

  return NextResponse.json({ data: safe });
}
