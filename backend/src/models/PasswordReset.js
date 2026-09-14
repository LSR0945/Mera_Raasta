import mongoose from 'mongoose';
import crypto from 'crypto';

const passwordResetSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false },
}, { timestamps: true });

passwordResetSchema.statics.createOTP = async function (email) {
  await this.deleteMany({ email, used: false });
  const otp = crypto.randomInt(100000, 999999).toString();
  await this.create({ email, otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000) });
  return otp;
};

passwordResetSchema.statics.verifyOTP = async function (email, otp) {
  const record = await this.findOne({ email, otp, used: false, expiresAt: { $gt: new Date() } });
  if (!record) return null;
  record.used = true;
  await record.save();
  return record;
};

export default mongoose.model('PasswordReset', passwordResetSchema);
