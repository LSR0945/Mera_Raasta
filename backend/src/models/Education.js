import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true }, slug: { type: String, required: true, unique: true },
  description: String, shortDescription: String, category: String, type: String,
  duration: { value: Number, unit: String }, fee: { min: Number, max: Number },
  eligibility: String, streams: [String], skills: [String],
  isOnline: Boolean, certificationAvailable: Boolean,
  isActive: { type: Boolean, default: true }, isDemo: Boolean,
}, { timestamps: true });

const collegeSchema = new mongoose.Schema({
  name: { type: String, required: true }, slug: { type: String, required: true, unique: true },
  description: String, shortDescription: String, type: String, ownership: String,
  location: { city: String, state: String }, courses: [String], streams: [String],
  facilities: { type: mongoose.Schema.Types.Mixed }, fee: { min: Number, max: Number },
  rating: Number, established: Number,
  isActive: { type: Boolean, default: true }, isDemo: Boolean,
}, { timestamps: true });

const scholarshipSchema = new mongoose.Schema({
  name: { type: String, required: true }, slug: { type: String, required: true, unique: true },
  description: String, shortDescription: String, provider: String, type: String,
  amount: { min: Number, max: Number }, eligibility: { type: mongoose.Schema.Types.Mixed },
  deadline: Date, sourceUrl: String, requiredDocuments: [String], benefits: [String],
  isGovernment: Boolean, verificationStatus: String, lastVerified: Date,
  isActive: { type: Boolean, default: true }, isDemo: Boolean,
}, { timestamps: true });

const governmentSchema = new mongoose.Schema({
  name: { type: String, required: true }, slug: { type: String, required: true, unique: true },
  description: String, shortDescription: String, category: String, department: String,
  eligibility: { type: mongoose.Schema.Types.Mixed }, benefits: [String],
  deadline: Date, sourceUrl: String, location: String,
  examDate: Date, vacancies: Number, salary: String,
  isActive: { type: Boolean, default: true }, isDemo: Boolean,
  verificationStatus: String, lastVerified: Date,
}, { timestamps: true });

governmentSchema.index({ name: 'text', description: 'text' });
governmentSchema.index({ category: 1, deadline: 1 });

export const Course = mongoose.model('Course', courseSchema);
export const College = mongoose.model('College', collegeSchema);
export const Scholarship = mongoose.model('Scholarship', scholarshipSchema);
export const Government = mongoose.model('Government', governmentSchema);
