import mongoose from 'mongoose';

const careerRecommendationSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  planA: { career: { type: mongoose.Schema.Types.ObjectId, ref: 'Career' }, fitScores: { type: mongoose.Schema.Types.Mixed }, reasoning: String },
  planB: { career: { type: mongoose.Schema.Types.ObjectId, ref: 'Career' }, fitScores: { type: mongoose.Schema.Types.Mixed }, reasoning: String },
  planC: { career: { type: mongoose.Schema.Types.ObjectId, ref: 'Career' }, fitScores: { type: mongoose.Schema.Types.Mixed }, reasoning: String },
}, { timestamps: true });

export default mongoose.model('CareerRecommendation', careerRecommendationSchema);
