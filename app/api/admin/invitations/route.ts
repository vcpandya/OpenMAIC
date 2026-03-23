import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user as Record<string, unknown>).role as string;
  if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const orgId = (session.user as Record<string, unknown>).organizationId as string;
  const invitations = await prisma.invitation.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ data: invitations });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user as Record<string, unknown>).role as string;
  if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const orgId = (session.user as Record<string, unknown>).organizationId as string;
  const { email, role: invRole } = await req.json();

  const invitation = await prisma.invitation.create({
    data: {
      email: email || null,
      role: invRole || 'STUDENT',
      organizationId: orgId,
      sentById: session.user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  return NextResponse.json({ data: invitation });
}
