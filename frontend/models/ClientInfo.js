import mongoose from 'mongoose';

const ClientInfoSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    contactNo: { type: String, required: true, trim: true },
    workingRights: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    dob: { type: String, required: true, trim: true }, // Store as string (YYYY-MM-DD) or date
    expectedSalary: { type: String, required: true, trim: true },
    preferredJobLocation: { type: String, required: true, trim: true },
    workType: { type: String, required: true, trim: true },
    noticePeriod: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    password: { type: String, required: true }, // Placed as per requirement table "Password New"
    preferredRole: { type: String, required: true, trim: true },
    resumeUrl: { type: String, default: '' },
    resumeStorageKey: { type: String, default: '' },
    resumeFileName: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.ClientInfo || mongoose.model('ClientInfo', ClientInfoSchema);
