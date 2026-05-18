import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db';
import Message from '@/models/Message';
import User from '@/models/User';

/**
 * POST /api/chat/send
 * Body: { receiverId: string, message: string }
 * Sends a message from the current user to receiverId.
 */
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { receiverId, message } = await req.json();

    // --- Validation ---
    if (!receiverId || !message?.trim()) {
      return NextResponse.json({ error: 'receiverId and message are required' }, { status: 400 });
    }
    if (message.trim().length > 2000) {
      return NextResponse.json({ error: 'Message cannot exceed 2000 characters' }, { status: 400 });
    }
    if (receiverId === session.user.id) {
      return NextResponse.json({ error: 'You cannot message yourself' }, { status: 400 });
    }

    await connectDB();

    // Verify receiver exists
    const receiver = await User.findById(receiverId).select('name email').lean();
    if (!receiver) {
      return NextResponse.json({ error: 'Recipient user not found' }, { status: 404 });
    }

    const newMessage = await Message.create({
      senderId: session.user.id,
      receiverId,
      message: message.trim(),
    });

    return NextResponse.json(
      {
        success: true,
        message: {
          id: newMessage._id.toString(),
          sender_id: session.user.id,
          receiver_id: receiverId,
          message: newMessage.message,
          read: false,
          created_at: newMessage.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
