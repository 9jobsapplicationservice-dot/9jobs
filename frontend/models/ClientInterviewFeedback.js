import mongoose from 'mongoose';

const ClientInterviewFeedbackSchema = new mongoose.Schema({
  full_name: { type: String, required: true },
  email_address: { type: String, required: true },
  interview_type: { type: String, required: true },
  interview_result: { type: String, required: true },
  interview_feedback: { type: String, required: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export default mongoose.models.ClientInterviewFeedback || mongoose.model('ClientInterviewFeedback', ClientInterviewFeedbackSchema);
