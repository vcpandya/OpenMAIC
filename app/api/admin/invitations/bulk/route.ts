import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user as Record<string, unknown>).role as string;
  if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const orgId = (session.user as Record<string, unknown>).organizationId as string;
  const { invitations } = await req.json();

  if (!Array.isArray(invitations) || invitations.length === 0) {
    return NextResponse.json({ error: 'No invitations provided' }, { status: 400 });
  }

  // Limit bulk upload to 100
  const entries = invitations.slice(0, 100);

  const created = await prisma.invitation.createManyAndReturn({
    data: entries.map((inv: { email: string; role?: string }) => ({
      email: inv.email,
      role: (['STUDENT', 'TEACHER', 'ADMIN'].includes(inv.role || '') ? inv.role : 'STUDENT') as 'STUDENT' | 'TEACHER' | 'ADMIN',
      organizationId: orgId,
      sentById: session.user!.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })),
  });

  return NextResponse.json({ data: created, count: created.length });
}
