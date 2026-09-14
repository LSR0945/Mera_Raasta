import mongoose from 'mongoose';

const nbaSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  actions: [{
    type: String, title: String, description: String,
    priority: { type: String, enum: ['low', 'medium', 'high'] },
    reason: String, status: { type: String, enum: ['pending', 'completed', 'dismissed'], default: 'pending' },
    dueDate: Date,
  }],
  lastAnalyzedAt: Date,
  profileCompleteness: Number, roadmapProgress: Number,
  skillGaps: [String], weakAreas: [String],
}, { timestamps: true });

export default mongoose.model('NextBestAction', nbaSchema);
