// Login is now handled entirely by NextAuth via /api/auth/[...nextauth].
// This route is no longer needed, but kept as a redirect for any old clients
// that may still call /api/auth/login directly.
import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Please use NextAuth sign-in at /api/auth/signin' },
    { status: 410 }
  );
}
