import mongoose from 'mongoose';

const lmsCourseSchema = new mongoose.Schema({
  title: String, slug: { type: String, unique: true }, description: String,
  shortDescription: String, category: String, difficulty: String,
  duration: String, skills: [String], lessons: [{ title: String, content: String, order: Number }],
  isPublished: { type: Boolean, default: true }, isDemo: Boolean,
}, { timestamps: true });

const quizSchema = new mongoose.Schema({
  title: String, slug: { type: String, unique: true }, description: String,
  category: String, difficulty: String, duration: Number,
  questions: [{ question: String, options: [String], correctAnswer: Number, explanation: String }],
  passingScore: { type: Number, default: 60 }, isPublished: { type: Boolean, default: true }, isDemo: Boolean,
}, { timestamps: true });

export const LmsCourse = mongoose.model('LmsCourse', lmsCourseSchema);
export const Quiz = mongoose.model('Quiz', quizSchema);
