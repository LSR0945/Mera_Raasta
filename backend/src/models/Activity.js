import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  action: { type: String, required: true },
  category: { type: String, enum: ['roadmap', 'career', 'profile', 'course', 'quiz', 'login', 'system'], default: 'system' },
  details: { type: mongoose.Schema.Types.Mixed, default: null },
  metadata: { type: mongoose.Schema.Types.Mixed, default: null },
}, { timestamps: true });

activitySchema.index({ user: 1, createdAt: -1 });
activitySchema.index({ user: 1, category: 1 });

export default mongoose.models.Activity || mongoose.model('Activity', activitySchema);
