import mongoose from 'mongoose';

const LostItemSchema = new mongoose.Schema({
  // --- User-Provided Fields (the owner describes in detail) ---
  item_name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    maxlength: 200,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: 5000,
  },
  location: {
    type: String,
    default: 'Unknown',
    maxlength: 300,
    index: true,
  },
  image_url: {
    type: String,
    default: null,
  },
  date_lost: {
    type: Date,
    default: Date.now,
  },

  // --- AI-Standardized Fields (extracted from user description + reference image) ---
  category: {
    type: String,
    default: 'Other',
    index: true,
  },
  ai_profile: {
    item_type: { type: String, default: '' },
    brand: { type: String, default: 'Unknown' },
    primary_color: { type: String, default: '' },
    secondary_color: { type: String, default: '' },
    material: { type: String, default: '' },
    distinguishing_marks: { type: String, default: '' },
    searchable_tags: { type: [String], default: [] },
  },

  // --- Owner & Status ---
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'matched', 'claimed', 'returned'],
    default: 'active',
    index: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Compound index for Tier 1 filtering
LostItemSchema.index({ status: 1, category: 1, location: 1, created_at: -1 });

export default mongoose.models.LostItem || mongoose.model('LostItem', LostItemSchema);
