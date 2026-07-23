import mongoose from 'mongoose';

const MatchSchema = new mongoose.Schema({
  foundItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FoundItem',
    required: true,
    index: true,
  },
  lostItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LostItem',
    required: true,
    index: true,
  },
  // Who found it
  finderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Who lost it
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // Matching details
  confidence_score: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  ai_reasoning: {
    type: String,
    default: '',
  },
  matched_tier: {
    type: String,
    enum: ['tier1', 'tier2', 'tier3'],
    default: 'tier3',
  },

  // Verification flow
  verification_status: {
    type: String,
    enum: ['pending', 'challenge_sent', 'verified', 'rejected'],
    default: 'pending',
  },
  verification_question: {
    type: String,
    default: '',
  },
  verification_answer: {
    type: String,
    default: '',
  },
  verification_result: {
    is_verified: { type: Boolean, default: false },
    ai_evaluation: { type: String, default: '' },
  },

  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Prevent duplicate matches for the same found+lost pair
MatchSchema.index({ foundItemId: 1, lostItemId: 1 }, { unique: true });

export default mongoose.models.Match || mongoose.model('Match', MatchSchema);
