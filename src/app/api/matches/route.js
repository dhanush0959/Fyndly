import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db';
import Match from '@/models/Match';

/**
 * GET /api/matches
 * Returns all matches for the current user (both as finder and as owner).
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const userId = session.user.id;

    // Get matches where the current user is the owner (they lost the item)
    const ownerMatches = await Match.find({ ownerId: userId })
      .populate('foundItemId', 'item_name description category location image_url ai_analysis created_at')
      .populate('lostItemId', 'item_name description location image_url')
      .populate('finderId', 'name email')
      .sort({ created_at: -1 })
      .lean();

    // Get matches where the current user is the finder
    const finderMatches = await Match.find({ finderId: userId })
      .populate('foundItemId', 'item_name description category location image_url ai_analysis created_at')
      .populate('lostItemId', 'item_name description location image_url')
      .populate('ownerId', 'name email')
      .sort({ created_at: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      ownerMatches, // Items you lost that were found
      finderMatches, // Items you found that matched someone's lost report
    });
  } catch (error) {
    console.error('Matches GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }
}
