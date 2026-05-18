// This route is superseded by /api/items/lost which uses MongoDB + real auth.
// Kept as a 301 redirect for backwards compatibility.
import { NextResponse } from 'next/server';

export async function POST(request) {
  return NextResponse.redirect(new URL('/api/items/lost', request.url), 308);
}

export async function GET(request) {
  return NextResponse.redirect(new URL('/api/items/lost', request.url), 308);
}
