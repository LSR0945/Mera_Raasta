import mongoose from 'mongoose';

const careerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  shortDescription: { type: String },
  category: { type: String },
  educationPath: { type: mongoose.Schema.Types.Mixed },
  requiredSkills: [{ name: String, importance: String }],
  salaryRange: { type: mongoose.Schema.Types.Mixed },
  demandLevel: { type: String },
  growthOutlook: { type: String },
  workLocations: [String],
  pros: [String],
  cons: [String],
  challenges: [String],
  workLifeBalance: { type: String },
  workHours: { type: String },
  educationCost: { type: String },
  timeToEntry: { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

careerSchema.index({ title: 'text', description: 'text' });
careerSchema.index({ category: 1 });

export default mongoose.model('Career', careerSchema);
