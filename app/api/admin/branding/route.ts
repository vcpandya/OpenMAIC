import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const orgId = (session.user as Record<string, unknown>).organizationId as string;
  if (!orgId) return NextResponse.json({ data: null });

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { brandName: true, brandLogo: true, primaryColor: true, faviconUrl: true },
  });

  return NextResponse.json({ data: org || { brandName: '', brandLogo: '', primaryColor: '#722ed1', faviconUrl: '' } });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user as Record<string, unknown>).role as string;
  if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const orgId = (session.user as Record<string, unknown>).organizationId as string;
  if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

  const { brandName, brandLogo, primaryColor, faviconUrl } = await req.json();

  const updated = await prisma.organization.update({
    where: { id: orgId },
    data: { brandName, brandLogo, primaryColor, faviconUrl },
  });

  return NextResponse.json({ data: updated });
}
