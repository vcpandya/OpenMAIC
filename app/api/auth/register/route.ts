/**
 * User Registration API
 * POST /api/auth/register
 *
 * Supports:
 * - Open registration (first user becomes SUPER_ADMIN)
 * - Invitation-only registration (requires valid invitation code)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, invitationCode } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 },
      );
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 },
      );
    }

    // Check if this is the first user (becomes SUPER_ADMIN)
    const userCount = await prisma.user.count();
    const isFirstUser = userCount === 0;

    let role: 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT' = 'STUDENT';
    let organizationId: string | null = null;

    if (isFirstUser) {
      // First user — create organization and make them super admin
      const org = await prisma.organization.create({
        data: {
          name: 'My Organization',
          slug: 'default',
          createdById: 'pending', // Will update after user creation
        },
      });
      organizationId = org.id;
      role = 'SUPER_ADMIN';
    } else if (invitationCode) {
      // Invitation-based registration
      const invitation = await prisma.invitation.findUnique({
        where: { code: invitationCode },
      });

      if (!invitation) {
        return NextResponse.json({ error: 'Invalid invitation code' }, { status: 400 });
      }
      if (invitation.status !== 'PENDING') {
        return NextResponse.json({ error: 'Invitation has already been used' }, { status: 400 });
      }
      if (invitation.expiresAt < new Date()) {
        return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 });
      }
      if (invitation.email && invitation.email !== email) {
        return NextResponse.json(
          { error: 'This invitation was sent to a different email' },
          { status: 400 },
        );
      }

      role = invitation.role;
      organizationId = invitation.organizationId;

      // Mark invitation as accepted
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED', acceptedAt: new Date() },
      });
    } else {
      // No invitation — check if open registration is allowed
      // For now, require invitation if org exists
      const orgCount = await prisma.organization.count();
      if (orgCount > 0) {
        return NextResponse.json(
          { error: 'Registration requires an invitation code' },
          { status: 403 },
        );
      }
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name: name || email.split('@')[0],
        email,
        hashedPassword,
        role,
        organizationId,
      },
    });

    // If first user, update org's createdById
    if (isFirstUser && organizationId) {
      await prisma.organization.update({
        where: { id: organizationId },
        data: { createdById: user.id },
      });
    }

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 },
    );
  }
}
