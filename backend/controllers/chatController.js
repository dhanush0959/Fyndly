const db = require('../config/database');

// Get all conversations for a user
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const [conversations] = await db.query(
      `SELECT 
        c.*,
        CASE 
          WHEN c.user1_id = ? THEN c.user2_id 
          ELSE c.user1_id 
        END as other_user_id,
        CASE 
          WHEN c.user1_id = ? THEN u2.name 
          ELSE u1.name 
        END as other_user_name,
        CASE 
          WHEN c.user1_id = ? THEN u2.email 
          ELSE u1.email 
        END as other_user_email,
        (SELECT message FROM chat_messages 
         WHERE (sender_id = c.user1_id AND receiver_id = c.user2_id) 
            OR (sender_id = c.user2_id AND receiver_id = c.user1_id)
         ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT COUNT(*) FROM chat_messages 
         WHERE receiver_id = ? AND sender_id = CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END
         AND is_read = FALSE) as unread_count
      FROM conversations c
      JOIN users u1 ON c.user1_id = u1.id
      JOIN users u2 ON c.user2_id = u2.id
      WHERE c.user1_id = ? OR c.user2_id = ?
      ORDER BY c.last_message_at DESC`,
      [userId, userId, userId, userId, userId, userId, userId]
    );

    res.json({
      success: true,
      conversations
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
};

// Get messages in a conversation
exports.getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { otherUserId } = req.params;

    const [messages] = await db.query(
      `SELECT 
        cm.*,
        u.name as sender_name
      FROM chat_messages cm
      JOIN users u ON cm.sender_id = u.id
      WHERE (cm.sender_id = ? AND cm.receiver_id = ?)
         OR (cm.sender_id = ? AND cm.receiver_id = ?)
      ORDER BY cm.created_at ASC`,
      [userId, otherUserId, otherUserId, userId]
    );

    // Mark messages as read
    await db.query(
      `UPDATE chat_messages 
       SET is_read = TRUE 
       WHERE receiver_id = ? AND sender_id = ? AND is_read = FALSE`,
      [userId, otherUserId]
    );

    res.json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId, message, matchId } = req.body;

    if (!receiverId || !message) {
      return res.status(400).json({ error: 'Receiver and message are required' });
    }

    // Insert message
    const [result] = await db.query(
      `INSERT INTO chat_messages (sender_id, receiver_id, message, match_id) 
       VALUES (?, ?, ?, ?)`,
      [senderId, receiverId, message, matchId || null]
    );

    // Create or update conversation
    await db.query(
      `INSERT INTO conversations (user1_id, user2_id, match_id, last_message_at)
       VALUES (?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE last_message_at = NOW()`,
      [Math.min(senderId, receiverId), Math.max(senderId, receiverId), matchId || null]
    );

    // Get the created message with sender info
    const [newMessage] = await db.query(
      `SELECT cm.*, u.name as sender_name
       FROM chat_messages cm
       JOIN users u ON cm.sender_id = u.id
       WHERE cm.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: newMessage[0]
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// Get unread message count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const [result] = await db.query(
      `SELECT COUNT(*) as unread_count 
       FROM chat_messages 
       WHERE receiver_id = ? AND is_read = FALSE`,
      [userId]
    );

    res.json({
      success: true,
      unreadCount: result[0].unread_count
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
};
