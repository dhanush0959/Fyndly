import mongoose from 'mongoose';

const LostItemSchema = new mongoose.Schema({
  item_name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    maxlength: 200,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: 2000,
  },
  location: {
    type: String,
    default: 'Unknown',
    maxlength: 300,
  },
  image_url: {
    type: String,
    default: null,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    enum: ['active', 'claimed', 'returned'],
    default: 'active',
  },
  detected_objects: {
    type: Array,
    default: [],
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.LostItem || mongoose.model('LostItem', LostItemSchema);
