import { NextResponse } from 'next/server';

export async function POST(req) {
  const body = await req.json();
  return NextResponse.json({
    success: true,
    token: 'mock-jwt-token',
    user: { id: 1, name: 'Test User', email: body.email }
  });
}
