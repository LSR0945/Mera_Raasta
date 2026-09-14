import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  title: String, slug: { type: String, unique: true }, description: String, shortDescription: String,
  difficulty: String, category: String, skills: [{ name: String, level: String }],
  duration: String, instructions: [String],
  isPublished: { type: Boolean, default: true }, isDemo: Boolean,
}, { timestamps: true });

const internshipSchema = new mongoose.Schema({
  title: String, slug: { type: String, unique: true }, company: String,
  description: String, shortDescription: String, type: String, duration: String,
  stipend: { min: Number, max: Number }, location: { type: mongoose.Schema.Types.Mixed },
  requiredSkills: [{ name: String, level: String }], requiredEducation: String,
  openings: Number, deadline: Date, isPaid: Boolean, isDemo: Boolean, isActive: Boolean,
}, { timestamps: true });

const jobSchema = new mongoose.Schema({
  title: String, slug: { type: String, unique: true }, company: String,
  description: String, shortDescription: String, type: String,
  salary: { min: Number, max: Number }, location: { type: mongoose.Schema.Types.Mixed },
  requiredSkills: [{ name: String, level: String }], requiredEducation: String,
  openings: Number, deadline: Date, isDemo: Boolean, isActive: Boolean,
}, { timestamps: true });

const interviewSchema = new mongoose.Schema({
  title: String, slug: { type: String, unique: true }, company: String,
  description: String, shortDescription: String, type: String,
  questions: [{ question: String, options: [String], correctAnswer: Number, explanation: String }],
  duration: Number, totalQuestions: Number,
  isPublished: { type: Boolean, default: true }, isDemo: Boolean,
}, { timestamps: true });

export const Project = mongoose.model('Project', projectSchema);
export const Internship = mongoose.model('Internship', internshipSchema);
export const Job = mongoose.model('Job', jobSchema);
export const Interview = mongoose.model('Interview', interviewSchema);
