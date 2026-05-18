import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  message: {
    type: String,
    required: [true, 'Message cannot be empty'],
    maxlength: [2000, 'Message cannot exceed 2000 characters'],
    trim: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Index for fast conversation lookups
MessageSchema.index({ senderId: 1, receiverId: 1, created_at: -1 });
MessageSchema.index({ receiverId: 1, read: 1 });

export default mongoose.models.Message || mongoose.model('Message', MessageSchema);
