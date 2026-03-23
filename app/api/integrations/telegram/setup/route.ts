import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma, isOrgMode } from '@/lib/db';

export async function POST(req: NextRequest) {
  if (!isOrgMode()) return NextResponse.json({ error: 'Requires organization mode' }, { status: 400 });

  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user as unknown as Record<string, unknown>).role as string;
  if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin required' }, { status: 403 });
  }

  const orgId = (session.user as unknown as Record<string, unknown>).organizationId as string;
  const { botToken } = await req.json();

  // Validate token with Telegram API
  const meRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
  const meData = await meRes.json();
  if (!meData.ok) {
    return NextResponse.json({ error: 'Invalid bot token' }, { status: 400 });
  }

  // Set webhook to our endpoint
  const webhookUrl = `${req.nextUrl.origin}/api/integrations/telegram/webhook`;
  const webhookRes = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: webhookUrl }),
  });
  const webhookData = await webhookRes.json();

  // Save integration
  await prisma.integration.upsert({
    where: { id: `telegram-${orgId}` },
    create: {
      id: `telegram-${orgId}`,
      orgId,
      type: 'telegram',
      config: JSON.stringify({ botToken, botName: meData.result.username, webhookUrl }),
      status: webhookData.ok ? 'active' : 'error',
    },
    update: {
      config: JSON.stringify({ botToken, botName: meData.result.username, webhookUrl }),
      status: webhookData.ok ? 'active' : 'error',
    },
  });

  return NextResponse.json({
    success: true,
    bot: { name: meData.result.username, firstName: meData.result.first_name },
    webhook: webhookData.ok,
  });
}
