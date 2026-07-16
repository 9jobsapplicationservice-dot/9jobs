import mongoose from 'mongoose';

const RateLimitSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    attempts: { type: Number, default: 1 },
    resetAt: { type: Date, required: true },
  },
  {
    timestamps: true,
  }
);

// TTL index to automatically delete expired rate limit records
RateLimitSchema.index({ resetAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.RateLimit || mongoose.model('RateLimit', RateLimitSchema);
