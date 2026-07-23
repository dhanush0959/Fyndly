import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db';
import Match from '@/models/Match';
import FoundItem from '@/models/FoundItem';
import LostItem from '@/models/LostItem';
import { AIService } from '@/lib/ai-service';

/**
 * POST /api/matches/verify
 * Owner submits an answer to the verification challenge question.
 * Gemini evaluates the answer against the found item image.
 *
 * Body: { matchId, answer }
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { matchId, answer } = await request.json();

    if (!matchId || !answer || answer.trim().length === 0) {
      return NextResponse.json({ error: 'Match ID and answer are required' }, { status: 400 });
    }

    await connectDB();

    // Fetch the match and ensure the current user is the owner
    const match = await Match.findById(matchId);
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }
    if (match.ownerId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'You are not authorized to verify this match' }, { status: 403 });
    }
    if (match.verification_status === 'verified') {
      return NextResponse.json({ error: 'This match has already been verified' }, { status: 400 });
    }

    // Get the found item for its image
    const foundItem = await FoundItem.findById(match.foundItemId).lean();
    if (!foundItem) {
      return NextResponse.json({ error: 'Found item not found' }, { status: 404 });
    }

    // --- Gemini AI: Evaluate the owner's answer (1 API call) ---
    const verificationResult = await AIService.verifyOwnership(
      match.verification_question,
      answer.trim(),
      foundItem.image_url
    );

    // Update the match record
    match.verification_answer = answer.trim();
    match.verification_result = {
      is_verified: verificationResult.is_correct && verificationResult.confidence >= 60,
      ai_evaluation: verificationResult.evaluation || '',
    };

    if (verificationResult.is_correct && verificationResult.confidence >= 60) {
      match.verification_status = 'verified';

      // Mark the lost item as 'matched'
      await LostItem.findByIdAndUpdate(match.lostItemId, { status: 'matched' });
    } else {
      match.verification_status = 'rejected';
    }

    await match.save();

    return NextResponse.json({
      success: true,
      verified: match.verification_status === 'verified',
      confidence: verificationResult.confidence,
      evaluation: verificationResult.evaluation,
      message: match.verification_status === 'verified'
        ? '✅ Ownership verified! You can now connect with the finder via chat.'
        : '❌ Verification failed. Your answer did not match our records. Please try again or contact support.',
    });
  } catch (error) {
    console.error('Verify match POST error:', error);
    return NextResponse.json({ error: 'Failed to verify ownership' }, { status: 500 });
  }
}
