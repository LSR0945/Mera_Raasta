import mongoose from 'mongoose';

// Mongoose gotcha: agar array ke andar object me `type` key ho to Mongoose use
// "array of String" samajh leta hai. Isliye sub-schema alag banate hain.
const actionSchema = new mongoose.Schema(
  {
    type: { type: String },
    title: String,
    description: String,
    priority: { type: String, enum: ['low', 'medium', 'high'] },
    reason: String,
    status: { type: String, enum: ['pending', 'completed', 'dismissed'], default: 'pending' },
    dueDate: Date,
  },
  { _id: false }
);

const nbaSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  actions: [actionSchema],
  lastAnalyzedAt: Date,
  profileCompleteness: Number, roadmapProgress: Number,
  skillGaps: [String], weakAreas: [String],
}, { timestamps: true });

export default mongoose.model('NextBestAction', nbaSchema);
