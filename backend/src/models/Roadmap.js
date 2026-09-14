import mongoose from 'mongoose';

const NodeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  type: { type: String, default: 'general' },
  status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
  progress: { type: Number, default: 0 },
  metadata: { type: mongoose.Schema.Types.Mixed, default: null },
  order: { type: Number, default: 0 },
}, { _id: true });

const RoadmapSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  career: { type: mongoose.Schema.Types.ObjectId, ref: 'Career', default: null },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  nodes: { type: [NodeSchema], default: [] },
  overallProgress: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.Roadmap || mongoose.model('Roadmap', RoadmapSchema);
