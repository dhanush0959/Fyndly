import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db';
import Message from '@/models/Message';
import User from '@/models/User';

/**
 * GET /api/chat/conversations
 * Returns all unique conversations for the current user,
 * with the last message and unread count for each.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserId = session.user.id;

    await connectDB();

    // Find all messages involving the current user
    const messages = await Message.find({
      $or: [{ senderId: currentUserId }, { receiverId: currentUserId }],
    })
      .sort({ created_at: -1 })
      .lean();

    // Collect unique partner IDs
    const partnerIds = new Set();
    for (const msg of messages) {
      const partnerId =
        msg.senderId.toString() === currentUserId
          ? msg.receiverId.toString()
          : msg.senderId.toString();
      partnerIds.add(partnerId);
    }

    // Fetch partner user details
    const partners = await User.find({ _id: { $in: [...partnerIds] } })
      .select('name email')
      .lean();

    const partnerMap = {};
    for (const p of partners) {
      partnerMap[p._id.toString()] = p;
    }

    // Build conversation summaries
    const conversations = [];
    for (const partnerId of partnerIds) {
      const partner = partnerMap[partnerId];
      if (!partner) continue;

      // Last message in this conversation
      const lastMsg = messages.find((m) => {
        const s = m.senderId.toString();
        const r = m.receiverId.toString();
        return (
          (s === currentUserId && r === partnerId) ||
          (s === partnerId && r === currentUserId)
        );
      });

      // Unread count (messages FROM partner that current user hasn't read)
      const unreadCount = messages.filter(
        (m) =>
          m.senderId.toString() === partnerId &&
          m.receiverId.toString() === currentUserId &&
          !m.read
      ).length;

      conversations.push({
        id: partnerId,
        other_user_id: partnerId,
        other_user_name: partner.name,
        other_user_email: partner.email,
        last_message: lastMsg?.message || null,
        last_message_at: lastMsg?.created_at || null,
        unread_count: unreadCount,
      });
    }

    // Sort by most recent message
    conversations.sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at));

    return NextResponse.json({ success: true, conversations });
  } catch (error) {
    console.error('Conversations GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}
