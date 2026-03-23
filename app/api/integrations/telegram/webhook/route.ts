import { NextRequest, NextResponse } from 'next/server';
import { prisma, isOrgMode } from '@/lib/db';

export async function POST(req: NextRequest) {
  if (!isOrgMode()) return NextResponse.json({ ok: true });

  const update = await req.json();
  const message = update.message;
  if (!message?.text) return NextResponse.json({ ok: true });

  const chatId = message.chat.id;
  const text = message.text;

  // Find which org this bot belongs to
  const integrations = await prisma.integration.findMany({
    where: { type: 'telegram', status: 'active' },
  });

  let botToken: string | null = null;
  for (const intg of integrations) {
    const config = JSON.parse(intg.config);
    botToken = config.botToken;
    break; // Use first active telegram integration
  }

  if (!botToken) return NextResponse.json({ ok: true });

  // Check if user is linked to org
  const userLink = await prisma.userMessagingLink.findUnique({
    where: { platform_platformUserId: { platform: 'telegram', platformUserId: String(chatId) } },
  });

  const sendMessage = async (text: string) => {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
    });
  };

  // Handle /start command
  if (text.startsWith('/start')) {
    if (userLink) {
      await sendMessage('Welcome back! Send me any topic and I\'ll create an AI lesson for you. 🎓');
    } else {
      await sendMessage('Welcome! To get started, link your account by visiting your OpenMAIC profile and adding your Telegram.\n\nOnce linked, send me any topic to generate a lesson!');
    }
    return NextResponse.json({ ok: true });
  }

  // Handle /link command
  if (text.startsWith('/link ')) {
    const linkCode = text.replace('/link ', '').trim();
    // For now, simple email-based linking
    const user = await prisma.user.findUnique({ where: { email: linkCode } });
    if (user) {
      await prisma.userMessagingLink.upsert({
        where: { platform_platformUserId: { platform: 'telegram', platformUserId: String(chatId) } },
        create: { userId: user.id, platform: 'telegram', platformUserId: String(chatId) },
        update: { userId: user.id },
      });
      await sendMessage(`Linked to ${user.email}! Now send me any topic to start learning. 🎓`);
    } else {
      await sendMessage('User not found. Please check your email and try again.');
    }
    return NextResponse.json({ ok: true });
  }

  // Generate classroom for any other text
  if (!userLink) {
    await sendMessage('Please link your account first with /link your@email.com');
    return NextResponse.json({ ok: true });
  }

  await sendMessage('🔄 Generating your lesson... This may take a minute.');

  try {
    // Call the generation API
    const genRes = await fetch(`${req.nextUrl.origin}/api/generate-classroom`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requirement: text,
        language: 'en-US',
        enableWebSearch: true,
      }),
    });
    const genData = await genRes.json();

    if (genData.data?.pollUrl) {
      // Poll until complete
      let attempts = 0;
      while (attempts < 60) { // Max 5 minutes
        await new Promise(r => setTimeout(r, 5000));
        const pollRes = await fetch(genData.data.pollUrl);
        const pollData = await pollRes.json();

        if (pollData.data?.done) {
          if (pollData.data.result?.url) {
            await sendMessage(`🎓 *Your lesson is ready!*\n\n📖 ${text}\n\n[Open Classroom](${pollData.data.result.url})`);
          } else {
            await sendMessage('Generation completed but no classroom was created. Please try again.');
          }
          break;
        }
        attempts++;
      }

      if (attempts >= 60) {
        await sendMessage('Generation is taking longer than expected. Please try again later.');
      }
    }
  } catch (_err) {
    await sendMessage('Sorry, something went wrong. Please try again.');
  }

  return NextResponse.json({ ok: true });
}
