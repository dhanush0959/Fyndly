import mongoose from 'mongoose';

const FoundItemSchema = new mongoose.Schema({
  item_name: {
    type: String,
    default: 'Unknown',
    trim: true,
    maxlength: 200,
  },
  description: {
    type: String,
    default: '',
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

export default mongoose.models.FoundItem || mongoose.model('FoundItem', FoundItemSchema);
