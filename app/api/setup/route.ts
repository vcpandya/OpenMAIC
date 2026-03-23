import { NextRequest, NextResponse } from 'next/server';
import { apiSuccess, apiError } from '@/lib/server/api-response';
import fs from 'fs';
import path from 'path';

const SETUP_CONFIG_PATH = path.join(process.cwd(), 'data', 'setup.json');

export async function POST(req: NextRequest) {
  try {
    const { mode } = await req.json();

    if (!mode || !['personal', 'organization'].includes(mode)) {
      return apiError('INVALID_REQUEST', 400, 'Invalid deployment mode');
    }

    // Ensure data directory exists
    const dataDir = path.dirname(SETUP_CONFIG_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Save setup configuration
    const config = {
      deploymentMode: mode,
      setupCompletedAt: new Date().toISOString(),
      version: '0.2.1',
    };

    fs.writeFileSync(SETUP_CONFIG_PATH, JSON.stringify(config, null, 2));

    // Build response with cookie so middleware knows setup is done
    const resp = NextResponse.json({ success: true, data: { mode, message: 'Setup completed' } });
    resp.cookies.set('openmaic-setup-done', mode, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365 * 10, // 10 years
      path: '/',
    });
    return resp;
  } catch (_error) {
    return apiError('INTERNAL_ERROR', 500, 'Failed to save setup configuration');
  }
}

export async function GET() {
  try {
    if (fs.existsSync(SETUP_CONFIG_PATH)) {
      const config = JSON.parse(fs.readFileSync(SETUP_CONFIG_PATH, 'utf-8'));
      return apiSuccess({ initialized: true, ...config });
    }
    return apiSuccess({ initialized: false });
  } catch {
    return apiSuccess({ initialized: false });
  }
}
