import mongoose from 'mongoose';

const BillingWebhookEventSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true, trim: true },
    eventType: { type: String, required: true, trim: true },
    processedAt: { type: Date, default: Date.now },
    clientId: { type: String, default: '', trim: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.BillingWebhookEvent || mongoose.model('BillingWebhookEvent', BillingWebhookEventSchema);
