import mongoose from 'mongoose';

const driverVerificationSchema = new mongoose.Schema({
  driverId: { type: mongoose.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  cnic: { type: String, required: true },
  licenseNumber: { type: String, required: true },
  licenseImageUrl: String,
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  reviewedBy: { type: mongoose.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  rejectionReason: String
}, { timestamps: true });

export default mongoose.model('DriverVerification', driverVerificationSchema);
