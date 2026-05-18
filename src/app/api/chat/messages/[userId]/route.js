import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db';
import Message from '@/models/Message';

/**
 * GET /api/chat/messages/[userId]
 * Returns all messages between the current user and [userId],
 * and marks received messages as read.
 */
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserId = session.user.id;
    const { userId: otherUserId } = await params;

    if (!otherUserId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    await connectDB();

    // Fetch messages between the two users
    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: currentUserId },
      ],
    })
      .sort({ created_at: 1 })
      .lean();

    // Mark messages sent BY the other user TO current user as read
    await Message.updateMany(
      { senderId: otherUserId, receiverId: currentUserId, read: false },
      { $set: { read: true } }
    );

    // Normalise _id → id for client
    const normalised = messages.map((m) => ({
      id: m._id.toString(),
      sender_id: m.senderId.toString(),
      receiver_id: m.receiverId.toString(),
      message: m.message,
      read: m.read,
      created_at: m.created_at,
    }));

    return NextResponse.json({ success: true, messages: normalised });
  } catch (error) {
    console.error('Messages GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}
