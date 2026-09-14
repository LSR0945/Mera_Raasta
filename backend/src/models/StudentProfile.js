import mongoose from 'mongoose';

const studentProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  educationLevel: { type: String, enum: ['10th', '12th', 'undergraduate', 'postgraduate'] },
  board: String, college: String, stream: String, branch: String, yearOfStudy: Number,
  tenthMarks: { percentage: Number, year: Number, board: String },
  twelfthMarks: { percentage: Number, year: Number, board: String, stream: String },
  subjectMarks: [{ subject: String, marks: Number }],
  interests: [String],
  skills: [{ name: String, level: { type: String, enum: ['beginner', 'intermediate', 'advanced'] } }],
  budget: { type: String, enum: ['low', 'medium', 'high', 'very_high'] },
  budgetAmount: { min: Number, max: Number },
  location: { city: String, state: String, country: String, willingToRelocate: Boolean },
  studyHoursPerDay: Number, preferredStudyTime: String, preferredLanguage: String,
  languagesSpoken: [String],
  careerGoals: { shortTerm: String, longTerm: String, dreamJob: String, preferredWorkType: String },
  onboardingCompleted: { type: Boolean, default: false },
  completedSteps: [String],
}, { timestamps: true });

export default mongoose.model('StudentProfile', studentProfileSchema);
